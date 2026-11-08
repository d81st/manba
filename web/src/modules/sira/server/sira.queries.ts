import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { SIRA_TAG } from "../sira.constants";
import { coMentions, type CoMention } from "../sira.graph";
import type { EventForEdit, PersonForEdit, SiraData, SiraEvent, SiraPerson, SiraPlace, SiraRelation } from "../sira.types";
import { type PlaceInput } from "../sira.validation";
import { LOCALE, TOPIC } from "./sira.sql";

// drafts: also what is not published yet (the preview of the admin); never what is retired.
async function loadSiraData(drafts: boolean): Promise<SiraData> {
  const statuses = drafts ? ["draft", "review", "published"] : ["published"];
  const [places, events, people, relations] = await Promise.all([
    db().query<SiraPlace>(
      `SELECT p.id::int, p.slug, coalesce(x.name, p.slug) AS name, p.name_ar AS "nameAr", p.lat, p.lon,
              p.coord_source AS "coordSource"
       FROM places p LEFT JOIN place_texts x ON x.place_id = p.id AND x.locale = $1
       ORDER BY name`,
      [LOCALE],
    ),
    db().query<SiraEvent>(
      `SELECT e.id::int, e.slug, e.kind, coalesce(x.title, e.slug) AS title, e.status, e.position,
              p.slug AS place, ${TOPIC} AS topic,
              coalesce((SELECT json_agg(json_build_object(
                  'address', d.address::text, 'quote', d.quote, 'holder', d.holder, 'year', d.year_ah,
                  'month', d.month, 'day', d.day, 'age', d.age, 'variant', d.variant, 'note', d.note)
                ORDER BY d.position, d.id) FROM sira_event_dates d WHERE d.event_id = e.id), '[]') AS dates
       FROM sira_events e
       LEFT JOIN sira_event_texts x ON x.event_id = e.id AND x.locale = $1
       LEFT JOIN places p ON p.id = e.place_id
       LEFT JOIN topics t ON t.id = e.topic_id
       WHERE e.status = ANY ($2)
       ORDER BY e.position, e.id`,
      [LOCALE, statuses],
    ),
    db().query<SiraPerson>(
      `SELECT s.id::int, s.slug, coalesce(x.name, s.slug) AS name, s.name_ar AS "nameAr", s.search_forms AS forms,
              s.status, ${TOPIC} AS topic
       FROM sira_people s
       LEFT JOIN sira_person_texts x ON x.person_id = s.id AND x.locale = $1
       LEFT JOIN topics t ON t.id = s.topic_id
       WHERE s.status = ANY ($2)
       ORDER BY s.id`,
      [LOCALE, statuses],
    ),
    db().query<SiraRelation>(
      `SELECT r.id::int, a.slug AS a, b.slug AS b, r.kind, r.address::text AS address, r.quote, r.note, r.status
       FROM sira_relations r JOIN sira_people a ON a.id = r.a JOIN sira_people b ON b.id = r.b
       WHERE r.status = ANY ($1) AND a.status = ANY ($1) AND b.status = ANY ($1)
       ORDER BY r.id`,
      [statuses],
    ),
  ]);
  return { places: places.rows, events: events.rows, people: people.rows, relations: relations.rows };
}

export async function getSiraData(drafts: boolean): Promise<SiraData> {
  "use cache";
  cacheTag(SIRA_TAG);
  cacheLife("hours");
  return loadSiraData(drafts);
}

// "Mentioned together" in the chapters of the Sira of Ibn Hisham, for every
// person with forms of the name (lib/sira-graph.ts).
export async function getCoMentions(drafts: boolean): Promise<{ units: Record<string, number>; pairs: CoMention[] }> {
  "use cache";
  cacheTag(SIRA_TAG);
  cacheLife("hours");
  const { people } = await loadSiraData(drafts);
  const { rows } = await db().query<{ unit: string; plain: string }>(
    `SELECT si.book || '.' || si.chapter AS unit, t.search_plain AS plain
     FROM texts t JOIN section_items si ON si.version_id = t.version_id AND si.address = t.address
     WHERE t.version_id = (SELECT id FROM text_versions WHERE work_id = 'ibn_hisham' AND is_primary LIMIT 1)`,
  );
  return coMentions(rows, people.map((p) => ({ slug: p.slug, forms: p.forms })));
}

// ============ Admin ============

export async function getSiraForAdmin(): Promise<SiraData> {
  const statuses = ["draft", "review", "published", "retired"];
  const data = await loadSiraData(true);
  // The admin lists also show what is retired.
  const [events, people] = await Promise.all([
    db().query<{ id: number; slug: string; title: string; status: string; position: number; kind: string }>(
      `SELECT e.id::int, e.slug, coalesce(x.title, e.slug) AS title, e.status, e.position, e.kind
       FROM sira_events e LEFT JOIN sira_event_texts x ON x.event_id = e.id AND x.locale = $1
       WHERE e.status = ANY ($2) ORDER BY e.position, e.id`,
      [LOCALE, statuses],
    ),
    db().query<{ id: number; slug: string; name: string; status: string }>(
      `SELECT s.id::int, s.slug, coalesce(x.name, s.slug) AS name, s.status
       FROM sira_people s LEFT JOIN sira_person_texts x ON x.person_id = s.id AND x.locale = $1
       WHERE s.status = ANY ($2) ORDER BY s.id`,
      [LOCALE, statuses],
    ),
  ]);
  const datesOf = new Map(data.events.map((e) => [e.id, e.dates]));
  const placeOf = new Map(data.events.map((e) => [e.id, e.place]));
  return {
    ...data,
    events: events.rows.map((e) => ({ ...e, place: placeOf.get(e.id) ?? null, topic: null, dates: datesOf.get(e.id) ?? [] })),
    people: people.rows.map((p) => ({ ...p, nameAr: "", forms: [], topic: null })),
  };
}

export async function getEventForEdit(id: number): Promise<EventForEdit | null> {
  const { rows } = await db().query(
    `SELECT e.id::int, e.slug, e.kind, e.status, coalesce(x.title, '') AS title, coalesce(p.slug, '') AS place,
            e.topic_id::int AS topic, e.position,
            coalesce((SELECT json_agg(json_build_object(
                'address', d.address::text, 'quote', d.quote, 'holder', d.holder, 'year', d.year_ah,
                'month', d.month, 'day', d.day, 'age', d.age, 'variant', d.variant, 'note', d.note)
              ORDER BY d.position, d.id) FROM sira_event_dates d WHERE d.event_id = e.id), '[]') AS dates
     FROM sira_events e
     LEFT JOIN sira_event_texts x ON x.event_id = e.id AND x.locale = $2
     LEFT JOIN places p ON p.id = e.place_id
     WHERE e.id = $1`,
    [id, LOCALE],
  );
  return rows[0] ? { ...rows[0], reason: "" } : null;
}

export async function getPersonForEdit(id: number): Promise<PersonForEdit | null> {
  const { rows } = await db().query(
    `SELECT s.id::int, s.slug, s.status, coalesce(x.name, '') AS name, s.name_ar AS "nameAr", s.search_forms AS forms,
            s.topic_id::int AS topic,
            coalesce((SELECT json_agg(json_build_object(
                'other', CASE WHEN r.a = s.id THEN b.slug ELSE a.slug END, 'kind', r.kind,
                'direction', CASE WHEN r.a = s.id THEN 'out' ELSE 'in' END,
                'address', r.address::text, 'quote', r.quote, 'note', r.note, 'status', r.status) ORDER BY r.id)
              FROM sira_relations r JOIN sira_people a ON a.id = r.a JOIN sira_people b ON b.id = r.b
              WHERE r.a = s.id OR r.b = s.id), '[]') AS relations
     FROM sira_people s LEFT JOIN sira_person_texts x ON x.person_id = s.id AND x.locale = $2
     WHERE s.id = $1`,
    [id, LOCALE],
  );
  return rows[0] ? { ...rows[0], reason: "" } : null;
}

export async function getPlaceForEdit(id: number): Promise<(PlaceInput & { id: number }) | null> {
  const { rows } = await db().query(
    `SELECT p.id::int, p.slug, coalesce(x.name, '') AS name, p.name_ar AS "nameAr", p.lat, p.lon,
            p.coord_source AS "coordSource", '' AS reason
     FROM places p LEFT JOIN place_texts x ON x.place_id = p.id AND x.locale = $2 WHERE p.id = $1`,
    [id, LOCALE],
  );
  return rows[0] ?? null;
}

export async function listChoices() {
  const [places, people, topics] = await Promise.all([
    db().query<{ slug: string; name: string }>(
      `SELECT p.slug, coalesce(x.name, p.slug) AS name FROM places p
       LEFT JOIN place_texts x ON x.place_id = p.id AND x.locale = $1 ORDER BY name`,
      [LOCALE],
    ),
    db().query<{ slug: string; name: string }>(
      `SELECT s.slug, coalesce(x.name, s.slug) AS name FROM sira_people s
       LEFT JOIN sira_person_texts x ON x.person_id = s.id AND x.locale = $1
       WHERE s.status <> 'retired' ORDER BY name`,
      [LOCALE],
    ),
    db().query<{ id: number; name: string }>(
      `SELECT t.id::int, coalesce(x.title, t.slug) AS name FROM topics t
       LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1
       WHERE t.category = 'sira' AND t.status <> 'retired' ORDER BY name`,
      [LOCALE],
    ),
  ]);
  return { places: places.rows, people: people.rows, topics: topics.rows };
}
