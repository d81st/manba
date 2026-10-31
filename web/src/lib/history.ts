import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type pg from "pg";
import { defaultLocale } from "@/i18n";
import { db } from "@/lib/db";
import type { InputProblem } from "@/lib/glossary-input";
import type { CheckedHistoryEvent } from "@/lib/history-input";
import { quoteFound } from "@/lib/sira-input";

// «Историческая линия» (migration 022): events on layers, each date the quoted
// words of a source with their address; nothing here is the site's own.

export const HISTORY_TAG = "history";
const LOCALE = defaultLocale;

export type HistoryDate = {
  address: string;
  quote: string;
  holder: string;
  yearAh: number | null;
  yearCe: number | null;
  month: number | null;
  day: number | null;
  variant: boolean;
  note: string;
};

export type HistoryEvent = {
  id: number;
  slug: string;
  layer: string;
  title: string;
  status: string;
  topic: { slug: string; title: string; published: boolean } | null;
  dates: HistoryDate[];
};

const DATES = `coalesce((SELECT json_agg(json_build_object(
    'address', d.address::text, 'quote', d.quote, 'holder', d.holder, 'yearAh', d.year_ah, 'yearCe', d.year_ce,
    'month', d.month, 'day', d.day, 'variant', d.variant, 'note', d.note)
  ORDER BY d.position, d.id) FROM history_event_dates d WHERE d.event_id = e.id), '[]')`;

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

export type HistoryEventForEdit = Omit<CheckedHistoryEvent, "dates"> & { id: number; dates: HistoryDate[] };

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

type Saved = { id?: number; problems: InputProblem[] };

export async function saveHistoryEvent(id: number | null, input: CheckedHistoryEvent, actor: string): Promise<Saved> {
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

async function save(client: pg.PoolClient, id: number | null, input: CheckedHistoryEvent, actor: string): Promise<Saved> {
  const problems: InputProblem[] = [];
  // Each address exists and each quote stands in the text there.
  for (const [i, d] of input.dates.entries()) {
    const { rows } = await client.query<{ known: boolean; text: string | null }>(
      `SELECT EXISTS (SELECT 1 FROM addresses WHERE address = $1::extensions.ltree) AS known,
              (SELECT string_agg(t.content, ' ') FROM texts t WHERE t.address <@ $1::extensions.ltree) AS text`,
      [d.address],
    );
    if (!rows[0].known) problems.push({ field: `dates.${i}.ref`, code: "refMissing" });
    else if (!quoteFound(rows[0].text ?? "", d.quote)) problems.push({ field: `dates.${i}.quote`, code: "quoteNotFound" });
  }
  const taken = await client.query("SELECT 1 FROM history_events WHERE slug = $1 AND id IS DISTINCT FROM $2", [input.slug, id]);
  if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });
  const before = id ? await getHistoryEventForEdit(id) : null;
  if (id && !before) problems.push({ field: "", code: "notFound" });
  if (before && before.slug !== input.slug) {
    const published = await client.query(
      `SELECT 1 FROM change_log WHERE entity = 'history_event' AND entity_id = $1 AND new_value->>'status' = 'published' LIMIT 1`,
      [String(id)],
    );
    if (published.rowCount) problems.push({ field: "slug", code: "slugPublished" });
  }
  if (before?.status === "published" && !input.reason) problems.push({ field: "reason", code: "reason" });
  if (problems.length) return { problems };

  let eventId = id;
  if (eventId) {
    await client.query(
      `UPDATE history_events SET slug = $2, layer = $3, topic_id = $4, status = $5, updated_by = $6, updated_at = now()
       WHERE id = $1`,
      [eventId, input.slug, input.layer, input.topic, input.status, actor],
    );
    await client.query("DELETE FROM history_event_dates WHERE event_id = $1", [eventId]);
  } else {
    eventId = (
      await client.query(
        `INSERT INTO history_events (slug, layer, topic_id, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id::int`,
        [input.slug, input.layer, input.topic, input.status, actor],
      )
    ).rows[0].id;
  }
  await client.query(
    `INSERT INTO history_event_texts (event_id, locale, title) VALUES ($1, $2, $3)
     ON CONFLICT (event_id, locale) DO UPDATE SET title = excluded.title`,
    [eventId, LOCALE, input.title],
  );
  for (const [i, d] of input.dates.entries()) {
    await client.query(
      `INSERT INTO history_event_dates (event_id, address, quote, holder, year_ah, year_ce, month, day, variant, note, position)
       VALUES ($1, $2::extensions.ltree, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [eventId, d.address, d.quote, d.holder, d.yearAh, d.yearCe, d.month, d.day, d.variant, d.note, i],
    );
  }
  const { reason, ...after } = input;
  await client.query(
    `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
     VALUES ('history_event', $1, $2, $3, $4, $5, $6)`,
    [String(eventId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(after), reason, actor],
  );
  return { id: eventId!, problems: [] };
}
