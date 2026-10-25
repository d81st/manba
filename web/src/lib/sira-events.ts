import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type pg from "pg";
import { defaultLocale } from "@/i18n";
import { db } from "@/lib/db";
import type { InputProblem } from "@/lib/glossary-input";
import { coMentions, type CoMention } from "@/lib/sira-graph";
import { quoteFound, type CheckedEvent, type CheckedPerson, type PlaceInput } from "@/lib/sira-input";

// Events, places and people of «Жизнеописание пророка» (migration 015): the
// map, the timeline and the graph of people. Every date and relation is the
// quoted words of a source with their address; nothing here is the site's own.

export const SIRA_TAG = "sira-events";
const LOCALE = defaultLocale;

export type SiraPlace = {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  lat: number | null;
  lon: number | null;
  coordSource: string;
};

export type SiraDate = {
  address: string;
  quote: string;
  holder: string;
  year: number | null;
  month: number | null;
  day: number | null;
  age: number | null;
  variant: boolean;
  note: string;
};

export type SiraEvent = {
  id: number;
  slug: string;
  kind: string;
  title: string;
  status: string;
  position: number;
  place: string | null;
  topic: { id: number; slug: string; published: boolean } | null;
  dates: SiraDate[];
};

export type SiraPerson = {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  forms: string[];
  status: string;
  topic: { id: number; slug: string; published: boolean } | null;
};

export type SiraRelation = {
  id: number;
  a: string;
  b: string;
  kind: string;
  address: string;
  quote: string;
  note: string;
  status: string;
};

export type SiraData = {
  places: SiraPlace[];
  events: SiraEvent[];
  people: SiraPerson[];
  relations: SiraRelation[];
};

const TOPIC = `CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object('id', t.id::int, 'slug', t.slug, 'published', t.status = 'published') END`;

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

export type EventForEdit = Omit<CheckedEvent, "dates"> & { id: number; dates: SiraDate[] };

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

export type PersonForEdit = Omit<CheckedPerson, "relations"> & {
  id: number;
  relations: { other: string; kind: string; direction: "out" | "in"; address: string; quote: string; note: string; status: string }[];
};

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

// Checks that each address exists and that each quote stands in the text there.
async function checkQuotes(client: pg.PoolClient, items: { address: string; quote: string; field: string }[]) {
  const problems: InputProblem[] = [];
  for (const item of items) {
    const { rows } = await client.query<{ known: boolean; text: string | null }>(
      `SELECT EXISTS (SELECT 1 FROM addresses WHERE address = $1::extensions.ltree) AS known,
              (SELECT string_agg(t.content, ' ') FROM texts t WHERE t.address <@ $1::extensions.ltree) AS text`,
      [item.address],
    );
    if (!rows[0].known) problems.push({ field: `${item.field}.ref`, code: "refMissing" });
    else if (!quoteFound(rows[0].text ?? "", item.quote)) problems.push({ field: `${item.field}.quote`, code: "quoteNotFound" });
  }
  return problems;
}

async function log(
  client: pg.PoolClient,
  entity: string,
  id: number,
  action: string,
  before: unknown,
  after: unknown,
  reason: string,
  actor: string,
) {
  await client.query(
    `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [entity, String(id), action, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, reason, actor],
  );
}

type Saved = { id?: number; problems: InputProblem[] };

async function inTransaction(work: (client: pg.PoolClient) => Promise<Saved>): Promise<Saved> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query(result.problems.length ? "ROLLBACK" : "COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function wasPublished(client: pg.PoolClient, entity: string, id: number) {
  const { rowCount } = await client.query(
    `SELECT 1 FROM change_log WHERE entity = $1 AND entity_id = $2 AND new_value->>'status' = 'published' LIMIT 1`,
    [entity, String(id)],
  );
  return Boolean(rowCount);
}

export async function saveEvent(id: number | null, input: CheckedEvent, actor: string): Promise<Saved> {
  return inTransaction(async (client) => {
    const problems = await checkQuotes(
      client,
      input.dates.map((d, i) => ({ address: d.address, quote: d.quote, field: `dates.${i}` })),
    );
    const taken = await client.query("SELECT 1 FROM sira_events WHERE slug = $1 AND id IS DISTINCT FROM $2", [input.slug, id]);
    if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });
    const before = id ? await getEventForEdit(id) : null;
    if (id && !before) problems.push({ field: "", code: "notFound" });
    if (before && before.slug !== input.slug && (await wasPublished(client, "sira_event", id!))) {
      problems.push({ field: "slug", code: "slugPublished" });
    }
    if (before?.status === "published" && !input.reason) problems.push({ field: "reason", code: "reason" });
    if (problems.length) return { problems };

    const place = input.place ? (await client.query("SELECT id FROM places WHERE slug = $1", [input.place])).rows[0]?.id : null;
    if (input.place && !place) return { problems: [{ field: "place", code: "place" }] };
    let eventId = id;
    if (eventId) {
      await client.query(
        `UPDATE sira_events SET slug = $2, kind = $3, place_id = $4, topic_id = $5, position = $6, status = $7,
                updated_by = $8, updated_at = now() WHERE id = $1`,
        [eventId, input.slug, input.kind, place, input.topic, input.position, input.status, actor],
      );
      await client.query("DELETE FROM sira_event_dates WHERE event_id = $1", [eventId]);
    } else {
      eventId = (
        await client.query(
          `INSERT INTO sira_events (slug, kind, place_id, topic_id, position, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id::int`,
          [input.slug, input.kind, place, input.topic, input.position, input.status, actor],
        )
      ).rows[0].id;
    }
    await client.query(
      `INSERT INTO sira_event_texts (event_id, locale, title) VALUES ($1, $2, $3)
       ON CONFLICT (event_id, locale) DO UPDATE SET title = excluded.title`,
      [eventId, LOCALE, input.title],
    );
    for (const [i, d] of input.dates.entries()) {
      await client.query(
        `INSERT INTO sira_event_dates (event_id, address, quote, holder, year_ah, month, day, age, variant, note, position)
         VALUES ($1, $2::extensions.ltree, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [eventId, d.address, d.quote, d.holder, d.year, d.month, d.day, d.age, d.variant, d.note, i],
      );
    }
    const { reason, ...after } = input;
    await log(client, "sira_event", eventId!, id ? "updated" : "created", before, after, reason, actor);
    return { id: eventId!, problems: [] };
  });
}

export async function savePerson(id: number | null, input: CheckedPerson, actor: string): Promise<Saved> {
  return inTransaction(async (client) => {
    const problems = await checkQuotes(
      client,
      input.relations.map((r, i) => ({ address: r.address, quote: r.quote, field: `relations.${i}` })),
    );
    const taken = await client.query("SELECT 1 FROM sira_people WHERE slug = $1 AND id IS DISTINCT FROM $2", [input.slug, id]);
    if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });
    const before = id ? await getPersonForEdit(id) : null;
    if (id && !before) problems.push({ field: "", code: "notFound" });
    if (before && before.slug !== input.slug && (await wasPublished(client, "sira_person", id!))) {
      problems.push({ field: "slug", code: "slugPublished" });
    }
    if (before?.status === "published" && !input.reason) problems.push({ field: "reason", code: "reason" });
    const others = new Map<string, number>();
    for (const [i, r] of input.relations.entries()) {
      const row = (await client.query("SELECT id::int FROM sira_people WHERE slug = $1", [r.other])).rows[0];
      if (!row) problems.push({ field: `relations.${i}.other`, code: "person" });
      else others.set(r.other, row.id);
    }
    if (problems.length) return { problems };

    let personId = id;
    if (personId) {
      await client.query(
        `UPDATE sira_people SET slug = $2, name_ar = $3, search_forms = $4, topic_id = $5, status = $6,
                updated_by = $7, updated_at = now() WHERE id = $1`,
        [personId, input.slug, input.nameAr, input.forms, input.topic, input.status, actor],
      );
      await client.query("DELETE FROM sira_relations WHERE a = $1 OR b = $1", [personId]);
    } else {
      personId = (
        await client.query(
          `INSERT INTO sira_people (slug, name_ar, search_forms, topic_id, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id::int`,
          [input.slug, input.nameAr, input.forms, input.topic, input.status, actor],
        )
      ).rows[0].id;
    }
    await client.query(
      `INSERT INTO sira_person_texts (person_id, locale, name) VALUES ($1, $2, $3)
       ON CONFLICT (person_id, locale) DO UPDATE SET name = excluded.name`,
      [personId, LOCALE, input.name],
    );
    for (const r of input.relations) {
      const [a, b] = r.direction === "out" ? [personId, others.get(r.other)] : [others.get(r.other), personId];
      await client.query(
        `INSERT INTO sira_relations (a, b, kind, address, quote, note, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4::extensions.ltree, $5, $6, $7, $8, $8)`,
        [a, b, r.kind, r.address, r.quote, r.note, r.status, actor],
      );
    }
    const { reason, ...after } = input;
    await log(client, "sira_person", personId!, id ? "updated" : "created", before, after, reason, actor);
    return { id: personId!, problems: [] };
  });
}

export async function savePlace(id: number | null, input: PlaceInput, actor: string): Promise<Saved> {
  return inTransaction(async (client) => {
    const problems: InputProblem[] = [];
    const taken = await client.query("SELECT 1 FROM places WHERE slug = $1 AND id IS DISTINCT FROM $2", [input.slug, id]);
    if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });
    const before = id ? await getPlaceForEdit(id) : null;
    if (id && !before) problems.push({ field: "", code: "notFound" });
    if (before && before.slug !== input.slug) problems.push({ field: "slug", code: "slugFixed" });
    if (problems.length) return { problems };
    let placeId = id;
    if (placeId) {
      await client.query(
        `UPDATE places SET name_ar = $2, lat = $3, lon = $4, coord_source = $5, updated_by = $6, updated_at = now() WHERE id = $1`,
        [placeId, input.nameAr, input.lat, input.lon, input.coordSource, actor],
      );
    } else {
      placeId = (
        await client.query(
          `INSERT INTO places (slug, name_ar, lat, lon, coord_source, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id::int`,
          [input.slug, input.nameAr, input.lat, input.lon, input.coordSource, actor],
        )
      ).rows[0].id;
    }
    await client.query(
      `INSERT INTO place_texts (place_id, locale, name) VALUES ($1, $2, $3)
       ON CONFLICT (place_id, locale) DO UPDATE SET name = excluded.name`,
      [placeId, LOCALE, input.name],
    );
    const { reason, ...after } = input;
    await log(client, "place", placeId!, id ? "updated" : "created", before, after, reason, actor);
    return { id: placeId!, problems: [] };
  });
}
