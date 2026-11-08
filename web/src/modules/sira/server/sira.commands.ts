import "server-only";
import type pg from "pg";
import { db } from "@/shared/db";
import type { InputProblem } from "@/shared/forms/input";
import { quoteFound, type CheckedEvent, type CheckedPerson, type PlaceInput } from "../sira.validation";
import { LOCALE } from "./sira.sql";
import { getEventForEdit, getPersonForEdit, getPlaceForEdit } from "./sira.queries";

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
