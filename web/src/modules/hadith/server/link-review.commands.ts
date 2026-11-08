import "server-only";
import { db } from "@/lib/db";
import { type Verdict } from "../hadith.links";

// Records a verdict on a pair, with a journal entry. False when the pair does not exist.
export async function reviewPair(id: number, verdict: Verdict, note: string, actor: string): Promise<boolean> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const link = await client.query<{ a: string; b: string; verdict: string | null }>(
      `SELECT l.a::text, l.b::text,
              (SELECT verdict FROM hadith_link_reviews r WHERE r.link_id = l.id ORDER BY r.id DESC LIMIT 1) AS verdict
       FROM hadith_links l WHERE l.id = $1 FOR UPDATE OF l`,
      [id],
    );
    const pair = link.rows[0];
    if (!pair) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      "INSERT INTO hadith_link_reviews (link_id, verdict, note, actor) VALUES ($1, $2, $3, $4)",
      [id, verdict, note, actor],
    );
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('hadith_link', $1, 'reviewed', $2, $3, $4, $5)`,
      [
        String(id),
        JSON.stringify({ verdict: pair.verdict }),
        JSON.stringify({ a: pair.a, b: pair.b, verdict }),
        note,
        actor,
      ],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
