import "server-only";
import { db } from "@/shared/db";
import { type Analysis, missKey } from "../assistant.analysis";

// Counts a question with no answer by its words only (migration 024).
export async function recordMiss(analysis: Analysis) {
  const key = missKey(analysis);
  if (!key) return;
  await db().query(
    `INSERT INTO assistant_misses (words) VALUES ($1)
     ON CONFLICT (words) DO UPDATE SET count = assistant_misses.count + 1, last_month = date_trunc('month', now())::date`,
    [key],
  );
}

// ============ Admin ============

export async function saveSynonym(id: number | null, input: { phrase: string; forms: string[]; note: string }, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const taken = await client.query("SELECT 1 FROM assistant_synonyms WHERE phrase = $1 AND id IS DISTINCT FROM $2", [input.phrase, id]);
    if (taken.rowCount) {
      await client.query("ROLLBACK");
      return { problems: [{ field: "phrase", code: "phraseTaken" }] };
    }
    const before = id ? (await client.query("SELECT phrase, forms, note FROM assistant_synonyms WHERE id = $1", [id])).rows[0] : null;
    let synonymId = id;
    if (id) {
      await client.query("UPDATE assistant_synonyms SET phrase = $2, forms = $3, note = $4, updated_by = $5, updated_at = now() WHERE id = $1", [
        id,
        input.phrase,
        input.forms,
        input.note,
        actor,
      ]);
    } else {
      synonymId = (
        await client.query(
          "INSERT INTO assistant_synonyms (phrase, forms, note, created_by, updated_by) VALUES ($1, $2, $3, $4, $4) RETURNING id::int",
          [input.phrase, input.forms, input.note, actor],
        )
      ).rows[0].id;
    }
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('assistant_synonym', $1, $2, $3, $4, '', $5)`,
      [String(synonymId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(input), actor],
    );
    await client.query("COMMIT");
    return { problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSynonym(id: number, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const before = (await client.query("DELETE FROM assistant_synonyms WHERE id = $1 RETURNING phrase, forms, note", [id])).rows[0];
    if (before) {
      await client.query(
        `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
         VALUES ('assistant_synonym', $1, 'deleted', $2, NULL, '', $3)`,
        [String(id), JSON.stringify(before), actor],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
