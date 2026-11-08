import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { platformOf, telegramPost, type CheckedVideo, type Platform, type VideoInput } from "@/lib/videos-input";
import { formatRefs } from "@/lib/refs";
import type { InputProblem } from "@/lib/input";

// Videos as additional material (migration 048): links to posts next to the
// fragments and topics they are about. A video is never an argument.

export const VIDEOS_TAG = "videos";

export type Video = {
  id: number;
  url: string;
  platform: Platform;
  title: string;
  channel: string;
  language: string;
  note: string;
  status: string;
  linkState: "unknown" | "ok" | "unavailable";
  checkedAt: string;
};

const COLUMNS = `v.id::int, v.url, v.platform, v.title, v.channel, v.language, v.note, v.status,
  v.link_state AS "linkState", coalesce(to_char(v.checked_at, 'DD.MM.YYYY'), '') AS "checkedAt"`;

export async function listVideos(status?: string): Promise<(Video & { places: number; topics: number })[]> {
  const { rows } = await db().query(
    `SELECT ${COLUMNS},
            (SELECT count(*)::int FROM video_refs r WHERE r.video_id = v.id) AS places,
            (SELECT count(*)::int FROM video_topics t WHERE t.video_id = v.id) AS topics
     FROM videos v WHERE ($1::text IS NULL OR v.status = $1) ORDER BY v.id DESC`,
    [status ?? null],
  );
  return rows;
}

export async function getVideoForEdit(id: number): Promise<(VideoInput & { id: number; linkState: string; checkedAt: string }) | null> {
  const { rows } = await db().query<Video>(`SELECT ${COLUMNS} FROM videos v WHERE v.id = $1`, [id]);
  const video = rows[0];
  if (!video) return null;
  const refs = await db().query<{ address: string }>(
    "SELECT address::text FROM video_refs WHERE video_id = $1 ORDER BY position",
    [id],
  );
  const topics = await db().query<{ slug: string }>(
    "SELECT t.slug FROM video_topics v JOIN topics t ON t.id = v.topic_id WHERE v.video_id = $1 ORDER BY t.slug",
    [id],
  );
  return {
    id: video.id,
    url: video.url,
    title: video.title,
    channel: video.channel,
    language: video.language,
    note: video.note,
    status: video.status as VideoInput["status"],
    refs: formatRefs(refs.rows.map((r) => r.address)),
    topics: topics.rows.map((t) => t.slug).join(", "),
    linkState: video.linkState,
    checkedAt: video.checkedAt,
  };
}

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

export type PublicVideo = Pick<Video, "url" | "platform" | "title" | "channel" | "language" | "note" | "linkState">;

// Published videos for each of the given fragments. A video tied to a hadith
// also shows next to its narrations, and the other way round.
export async function videosForAddresses(addresses: string[]): Promise<Record<string, PublicVideo[]>> {
  "use cache";
  cacheTag(VIDEOS_TAG);
  cacheLife("hours");
  const result: Record<string, PublicVideo[]> = {};
  if (addresses.length === 0) return result;
  const { rows } = await db().query<PublicVideo & { address: string }>(
    `SELECT DISTINCT ON (a, v.id) a::text AS address, v.url, v.platform, v.title, v.channel, v.language, v.note, v.link_state AS "linkState"
     FROM unnest($1::extensions.ltree[]) AS a
     JOIN video_refs r ON r.address <@ a OR a <@ r.address
     JOIN videos v ON v.id = r.video_id AND v.status = 'published'
     ORDER BY a, v.id`,
    [addresses],
  );
  for (const { address, ...video } of rows) (result[address] ??= []).push(video);
  return result;
}

export async function videosForTopic(slug: string): Promise<PublicVideo[]> {
  "use cache";
  cacheTag(VIDEOS_TAG);
  cacheLife("hours");
  const { rows } = await db().query<PublicVideo>(
    `SELECT v.url, v.platform, v.title, v.channel, v.language, v.note, v.link_state AS "linkState"
     FROM videos v
     JOIN video_topics vt ON vt.video_id = v.id
     JOIN topics t ON t.id = vt.topic_id AND t.slug = $1
     WHERE v.status = 'published' ORDER BY v.id`,
    [slug],
  );
  return rows;
}

// Whether the post is still there. YouTube answers its oEmbed address with
// 404 or 400 for a removed or private video; a removed Telegram post shows an
// error block on its embed page. Other sites: the page itself.
export async function linkState(url: string): Promise<"ok" | "unavailable" | "unknown"> {
  const get = (address: string) => fetch(address, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
  try {
    const platform = platformOf(url);
    if (platform === "youtube") {
      const response = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
      if (response.ok || response.status === 401 || response.status === 403) return "ok";
      return response.status === 404 || response.status === 400 ? "unavailable" : "unknown";
    }
    if (platform === "telegram") {
      const post = telegramPost(url);
      if (!post) return "unavailable";
      const response = await get(`https://t.me/${post.channel}/${post.post}?embed=1`);
      if (!response.ok) return response.status === 404 ? "unavailable" : "unknown";
      const html = await response.text();
      return html.includes("tgme_widget_message_error") ? "unavailable" : "ok";
    }
    const response = await get(url);
    if (response.ok) return "ok";
    return response.status === 404 || response.status === 410 ? "unavailable" : "unknown";
  } catch {
    return "unknown";
  }
}

export async function checkLinks(actor: string): Promise<{ checked: number; unavailable: number }> {
  const { rows } = await db().query<{ id: number; url: string; link_state: string }>(
    "SELECT id::int, url, link_state FROM videos ORDER BY checked_at NULLS FIRST, id LIMIT 50",
  );
  let unavailable = 0;
  for (const row of rows) {
    const state = await linkState(row.url);
    if (state === "unavailable") unavailable++;
    // An unanswered check keeps the last known state.
    await db().query(
      `UPDATE videos SET link_state = CASE WHEN $2 = 'unknown' THEN link_state ELSE $2 END, checked_at = now() WHERE id = $1`,
      [row.id, state],
    );
    if (state !== "unknown" && state !== row.link_state) {
      await db().query(
        `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
         VALUES ('video', $1, 'updated', $2, $3, $4)`,
        [String(row.id), JSON.stringify({ linkState: row.link_state }), JSON.stringify({ linkState: state }), actor],
      );
    }
  }
  return { checked: rows.length, unavailable };
}
