import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { HISTORY_TAG } from "../history.constants";
import type { HistoryEvent, HistoryEventForEdit } from "../history.types";
import { DATES, LOCALE } from "./history.sql";

async function loadEvents(statuses: string[]): Promise<HistoryEvent[]> {
  const { rows } = await db().query<HistoryEvent>(
    `SELECT e.id::int, e.slug, e.layer, coalesce(x.title, e.slug) AS title, e.status,
            CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object('slug', t.slug,
              'title', coalesce(tt.title, t.slug), 'published', t.status = 'published') END AS topic,
            ${DATES} AS dates
     FROM history_events e
     LEFT JOIN history_event_texts x ON x.event_id = e.id AND x.locale = $1
     LEFT JOIN topics t ON t.id = e.topic_id
     LEFT JOIN topic_texts tt ON tt.topic_id = t.id AND tt.locale = $1
     WHERE e.status = ANY ($2)
     ORDER BY e.id`,
    [LOCALE, statuses],
  );
  return rows;
}

// drafts: also what is not published yet (the preview); never what is retired.
export async function getHistoryEvents(drafts: boolean): Promise<HistoryEvent[]> {
  "use cache";
  cacheTag(HISTORY_TAG);
  cacheLife("hours");
  return loadEvents(drafts ? ["draft", "review", "published"] : ["published"]);
}

// ============ Admin ============

export async function listHistoryForAdmin(): Promise<HistoryEvent[]> {
  return loadEvents(["draft", "review", "published", "retired"]);
}

export async function getHistoryEventForEdit(id: number): Promise<HistoryEventForEdit | null> {
  const { rows } = await db().query(
    `SELECT e.id::int, e.slug, e.layer, e.status, coalesce(x.title, '') AS title, e.topic_id::int AS topic,
            ${DATES} AS dates, '' AS reason
     FROM history_events e LEFT JOIN history_event_texts x ON x.event_id = e.id AND x.locale = $2
     WHERE e.id = $1`,
    [id, LOCALE],
  );
  return rows[0] ?? null;
}

export async function listHistoryTopics() {
  const { rows } = await db().query<{ id: number; name: string }>(
    `SELECT t.id::int, coalesce(x.title, t.slug) AS name FROM topics t
     LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1
     WHERE t.status <> 'retired' ORDER BY name`,
    [LOCALE],
  );
  return rows;
}
