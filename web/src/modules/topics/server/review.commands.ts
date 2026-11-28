import "server-only";
import { db } from "@/shared/db";
import { reviewItems } from "../topic.review";
import { getTopicForEdit } from "./topic.queries";

export type ReviewDecision = "check" | "uncheck" | "note";

// Marks an item of a topic's checklist as checked (with the fingerprint of
// what it holds now), takes the mark off, or saves the remark alone. Every
// change goes to the change log. The item must exist in the topic as it is now.
export async function saveReviewCheck(
  topicId: number,
  key: string,
  decision: ReviewDecision,
  note: string,
  actor: string,
): Promise<"saved" | "notFound"> {
  const topic = await getTopicForEdit(topicId);
  const item = topic ? reviewItems(topic).find((i) => i.key === key) : undefined;
  if (!item) return "notFound";
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const before = (
      await client.query<{ fingerprint: string; checked: boolean; note: string }>(
        "SELECT fingerprint, checked, note FROM topic_review_checks WHERE topic_id = $1 AND item = $2 FOR UPDATE",
        [topicId, key],
      )
    ).rows[0];
    const checked = decision === "check" ? true : decision === "uncheck" ? false : (before?.checked ?? false);
    // A remark alone keeps what was checked; a mark records what is there now.
    const fingerprint = decision === "note" && before ? before.fingerprint : item.fingerprint;
    await client.query(
      `INSERT INTO topic_review_checks (topic_id, item, fingerprint, checked, note, actor)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (topic_id, item) DO UPDATE
         SET fingerprint = EXCLUDED.fingerprint, checked = EXCLUDED.checked, note = EXCLUDED.note,
             actor = EXCLUDED.actor, updated_at = now()`,
      [topicId, key, fingerprint, checked, note, actor],
    );
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
       VALUES ('topic', $1, 'review_check', $2, $3, $4)`,
      [
        String(topicId),
        before ? JSON.stringify({ item: key, checked: before.checked, note: before.note }) : null,
        JSON.stringify({ item: key, checked, note, fingerprint }),
        actor,
      ],
    );
    await client.query("COMMIT");
    return "saved";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
