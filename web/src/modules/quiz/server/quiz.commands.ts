import "server-only";
import type pg from "pg";
import { db } from "@/shared/db";
import { formatRefs } from "@/shared/addresses/refs";
import type { InputProblem } from "@/shared/forms/input";
import type { CheckedQuestion } from "../quiz.validation";
import { LOCALE } from "./quiz.sql";
import { getQuestionForEdit } from "./quiz.queries";

type Saved = { id?: number; problems: InputProblem[] };

export async function saveQuestion(id: number | null, input: CheckedQuestion, actor: string): Promise<Saved> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await save(client, id, input, actor);
    await client.query(result.problems.length ? "ROLLBACK" : "COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function save(client: pg.PoolClient, id: number | null, input: CheckedQuestion, actor: string): Promise<Saved> {
  const problems: InputProblem[] = [];
  if (input.addresses.length) {
    const { rows } = await client.query<{ address: string }>(
      `SELECT a AS address FROM unnest($1::text[]) AS a
       WHERE NOT EXISTS (
         SELECT 1 FROM addresses x
         WHERE x.address = a::extensions.ltree AND x.level IN ('ayah', 'hadith', 'narration', 'page', 'passage', 'comment')
       )`,
      [input.addresses],
    );
    if (rows.length) problems.push({ field: "refs", code: "refsMissing", detail: formatRefs(rows.map((r) => r.address)) });
  }
  const before = id ? await getQuestionForEdit(id) : null;
  if (id && !before) problems.push({ field: "", code: "notFound" });
  if (before?.status === "published" && !input.reason) problems.push({ field: "reason", code: "reason" });
  if (problems.length) return { problems };

  let questionId = id;
  if (questionId) {
    await client.query(
      `UPDATE quiz_questions SET topic_id = $2, term_id = $3, status = $4, updated_by = $5, updated_at = now() WHERE id = $1`,
      [questionId, input.topic, input.term, input.status, actor],
    );
    await client.query("DELETE FROM quiz_options WHERE question_id = $1", [questionId]);
    await client.query("DELETE FROM quiz_refs WHERE question_id = $1", [questionId]);
  } else {
    questionId = (
      await client.query(
        `INSERT INTO quiz_questions (topic_id, term_id, status, created_by, updated_by) VALUES ($1, $2, $3, $4, $4) RETURNING id::int`,
        [input.topic, input.term, input.status, actor],
      )
    ).rows[0].id;
  }
  await client.query(
    `INSERT INTO quiz_question_texts (question_id, locale, prompt, note) VALUES ($1, $2, $3, $4)
     ON CONFLICT (question_id, locale) DO UPDATE SET prompt = excluded.prompt, note = excluded.note`,
    [questionId, LOCALE, input.prompt, input.note],
  );
  for (const [i, option] of input.options.entries()) {
    const optionId = (
      await client.query("INSERT INTO quiz_options (question_id, position, correct) VALUES ($1, $2, $3) RETURNING id", [
        questionId,
        i,
        option.correct,
      ])
    ).rows[0].id;
    await client.query("INSERT INTO quiz_option_texts (option_id, locale, text) VALUES ($1, $2, $3)", [optionId, LOCALE, option.text]);
  }
  for (const [i, address] of input.addresses.entries()) {
    await client.query("INSERT INTO quiz_refs (question_id, address, position) VALUES ($1, $2::extensions.ltree, $3)", [
      questionId,
      address,
      i,
    ]);
  }
  const { reason, ...rest } = input;
  const after = { ...rest, addresses: undefined };
  await client.query(
    `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
     VALUES ('quiz_question', $1, $2, $3, $4, $5, $6)`,
    [String(questionId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(after), reason, actor],
  );
  return { id: questionId!, problems: [] };
}
