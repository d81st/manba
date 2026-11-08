import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { formatRefs } from "@/shared/addresses/refs";
import { VIDEOS_TAG } from "../video.constants";
import type { PublicVideo, Video } from "../video.types";
import { type VideoInput } from "../video.validation";
import { COLUMNS } from "./video.sql";

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
