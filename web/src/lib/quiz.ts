import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type pg from "pg";
import { defaultLocale } from "@/i18n";
import { db } from "@/lib/db";
import { getHadithRefs, type HadithRef } from "@/lib/hadith";
import { type CheckedQuestion, questionLevel } from "@/lib/quiz-input";
import { formatRefs } from "@/lib/refs";
import type { InputProblem } from "@/lib/input";

// «Тесты» (migration 023): questions built from fragments of the sources.

export const QUIZ_TAG = "quiz";
const LOCALE = defaultLocale;

export type QuizAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };

export type QuizQuestion = {
  id: number;
  status: string;
  prompt: string;
  note: string;
  options: { id: number; text: string; correct: boolean }[];
  refs: string[];
  level: { sunni: number | null; shia: number | null };
  topic: { slug: string; title: string; published: boolean } | null;
  term: { slug: string; title: string; published: boolean } | null;
  ayahs: QuizAyah[];
  passages: HadithRef[];
};

type Row = Omit<QuizQuestion, "level" | "ayahs" | "passages"> & { works: { sunni: number | null; shia: number | null }[] };

async function loadQuestions(statuses: string[], id?: number): Promise<QuizQuestion[]> {
  const { rows } = await db().query<Row>(
    `SELECT q.id::int, q.status, coalesce(x.prompt, '') AS prompt, coalesce(x.note, '') AS note,
            coalesce((SELECT json_agg(json_build_object('id', o.id::int, 'text', coalesce(ot.text, ''), 'correct', o.correct)
                ORDER BY o.position, o.id)
              FROM quiz_options o LEFT JOIN quiz_option_texts ot ON ot.option_id = o.id AND ot.locale = $1
              WHERE o.question_id = q.id), '[]') AS options,
            coalesce((SELECT json_agg(r.address::text ORDER BY r.position, r.id) FROM quiz_refs r WHERE r.question_id = q.id), '[]') AS refs,
            coalesce((SELECT json_agg(json_build_object('sunni', w.authority_sunni, 'shia', w.authority_shia))
              FROM quiz_refs r JOIN works w ON w.id = split_part(r.address::text, '.', 1)
              WHERE r.question_id = q.id), '[]') AS works,
            CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object('slug', t.slug,
              'title', coalesce(tt.title, t.slug), 'published', t.status = 'published') END AS topic,
            CASE WHEN m.id IS NULL THEN NULL ELSE json_build_object('slug', m.slug,
              'title', coalesce(mt.translation, m.slug), 'published', m.status = 'published') END AS term
     FROM quiz_questions q
     LEFT JOIN quiz_question_texts x ON x.question_id = q.id AND x.locale = $1
     LEFT JOIN topics t ON t.id = q.topic_id
     LEFT JOIN topic_texts tt ON tt.topic_id = t.id AND tt.locale = $1
     LEFT JOIN terms m ON m.id = q.term_id
     LEFT JOIN term_texts mt ON mt.term_id = m.id AND mt.locale = $1
     WHERE q.status = ANY ($2) AND ($3::bigint IS NULL OR q.id = $3)
     ORDER BY q.id`,
    [LOCALE, statuses, id ?? null],
  );
  const all = rows.flatMap((r) => r.refs);
  const quran = all.filter((a) => a.startsWith("quran."));
  const ayahRows = quran.length
    ? (
        await db().query<{ address: string; text: string; sura_name: string }>(
          `SELECT a.address::text, t.content AS text, s.names->>'translit' AS sura_name
           FROM addresses a
           JOIN texts t ON t.address = a.address
           JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published'
             AND v.work_id = 'quran' AND v.language = 'ar'
           JOIN addresses s ON s.address = subpath(a.address, 0, 2)
           WHERE a.address = ANY ($1::extensions.ltree[])`,
          [quran],
        )
      ).rows
    : [];
  const ayahs = new Map(
    ayahRows.map((row) => {
      const [, sura, ayah] = row.address.split(".").map(Number);
      return [row.address, { address: row.address, sura, ayah, suraName: row.sura_name, text: row.text }];
    }),
  );
  const passages = await getHadithRefs([...new Set(all.filter((a) => !a.startsWith("quran.")))]);
  return rows.map(({ works, ...r }) => ({
    ...r,
    level: questionLevel(works),
    ayahs: r.refs.flatMap((a) => ayahs.get(a) ?? []),
    passages: r.refs.flatMap((a) => passages.get(a) ?? []),
  }));
}

// drafts: also what is not published yet (the preview); never what is retired.
export async function getQuizQuestions(drafts: boolean): Promise<QuizQuestion[]> {
  "use cache";
  cacheTag(QUIZ_TAG);
  cacheLife("hours");
  return loadQuestions(drafts ? ["draft", "review", "published"] : ["published"]);
}

// ============ Admin ============

export async function listQuestionsForAdmin() {
  return loadQuestions(["draft", "review", "published", "retired"]);
}

export async function getQuestionForEdit(id: number) {
  const [question] = await loadQuestions(["draft", "review", "published", "retired"], id);
  if (!question) return null;
  const ids = await db().query<{ topic: number | null; term: number | null }>(
    "SELECT topic_id::int AS topic, term_id::int AS term FROM quiz_questions WHERE id = $1",
    [id],
  );
  return {
    id: question.id,
    status: question.status,
    prompt: question.prompt,
    note: question.note,
    options: question.options.map((o) => ({ text: o.text, correct: o.correct })),
    refs: formatRefs(question.refs),
    topic: ids.rows[0]?.topic ?? null,
    term: ids.rows[0]?.term ?? null,
    reason: "",
  };
}

export async function listQuizChoices() {
  const [topics, terms] = await Promise.all([
    db().query<{ id: number; name: string }>(
      `SELECT t.id::int, coalesce(x.title, t.slug) AS name FROM topics t
       LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1 WHERE t.status <> 'retired' ORDER BY name`,
      [LOCALE],
    ),
    db().query<{ id: number; name: string }>(
      `SELECT m.id::int, coalesce(x.translation, m.slug) AS name FROM terms m
       LEFT JOIN term_texts x ON x.term_id = m.id AND x.locale = $1 WHERE m.status <> 'retired' ORDER BY name`,
      [LOCALE],
    ),
  ]);
  return { topics: topics.rows, terms: terms.rows };
}

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
