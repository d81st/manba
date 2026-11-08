import "server-only";
import { db } from "@/lib/db";
import { formatRefs } from "@/lib/refs";
import type { InputProblem } from "@/lib/input";
import { type CheckedVideo } from "../video.validation";
import { COLUMNS } from "./video.sql";

export async function saveVideo(id: number | null, input: CheckedVideo, actor: string): Promise<{ id?: number; problems: InputProblem[] }> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const problems: InputProblem[] = [];
    const known = await client.query<{ address: string }>(
      "SELECT address::text FROM addresses WHERE address = ANY($1::extensions.ltree[])",
      [input.addresses],
    );
    const missing = input.addresses.filter((a) => !known.rows.some((r) => r.address === a));
    if (missing.length) problems.push({ field: "refs", code: "refsMissing", detail: formatRefs(missing) });
    const topics = await client.query<{ id: string; slug: string }>("SELECT id, slug FROM topics WHERE slug = ANY($1::text[])", [
      input.topicSlugs,
    ]);
    const unknown = input.topicSlugs.filter((s) => !topics.rows.some((t) => t.slug === s));
    if (unknown.length) problems.push({ field: "topics", code: "topicsMissing", detail: unknown.join(", ") });
    const taken = await client.query("SELECT 1 FROM videos WHERE url = $1 AND id IS DISTINCT FROM $2", [input.url, id]);
    if (taken.rowCount) problems.push({ field: "url", code: "taken" });
    const before = id ? (await client.query(`SELECT ${COLUMNS} FROM videos v WHERE v.id = $1`, [id])).rows[0] : null;
    if (id && !before) problems.push({ field: "", code: "notFound" });
    if (problems.length) {
      await client.query("ROLLBACK");
      return { problems };
    }
    const values = [input.url, input.platform, input.title, input.channel, input.language, input.note, input.status, actor];
    let videoId = id;
    if (id) {
      // A new address has not been checked yet.
      await client.query(
        `UPDATE videos SET url = $2, platform = $3, title = $4, channel = $5, language = $6, note = $7, status = $8,
           updated_by = $9, updated_at = now(),
           link_state = CASE WHEN url = $2 THEN link_state ELSE 'unknown' END,
           checked_at = CASE WHEN url = $2 THEN checked_at ELSE NULL END
         WHERE id = $1`,
        [id, ...values],
      );
      await client.query("DELETE FROM video_refs WHERE video_id = $1", [id]);
      await client.query("DELETE FROM video_topics WHERE video_id = $1", [id]);
    } else {
      videoId = (
        await client.query(
          `INSERT INTO videos (url, platform, title, channel, language, note, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id::int`,
          values,
        )
      ).rows[0].id;
    }
    await client.query(
      `INSERT INTO video_refs (video_id, address, position)
       SELECT $1, a::extensions.ltree, o FROM unnest($2::text[]) WITH ORDINALITY AS u(a, o)`,
      [videoId, input.addresses],
    );
    await client.query("INSERT INTO video_topics (video_id, topic_id) SELECT $1, unnest($2::bigint[])", [
      videoId,
      topics.rows.map((t) => t.id),
    ]);
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
       VALUES ('video', $1, $2, $3, $4, $5)`,
      [String(videoId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(input), actor],
    );
    await client.query("COMMIT");
    return { id: videoId!, problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
