import "server-only";
import type pg from "pg";
import { db } from "@/lib/db";
import type { SaveResult } from "../topic.types";
import type { TopicInput } from "../topic.validation";
import { getTopicForEdit } from "./topic.queries";
import { LOCALE, type RefRole } from "./topic.sql";
import { formatRefs, parseRefs } from "@/lib/refs";
import type { InputProblem } from "@/lib/input";
import { resolveBookRefs } from "@/modules/library/server";

async function missingAddresses(client: pg.PoolClient, addresses: string[]) {
  if (addresses.length === 0) return [];
  const { rows } = await client.query<{ address: string }>(
    `SELECT a AS address FROM unnest($1::text[]) AS a
     WHERE NOT EXISTS (
       SELECT 1 FROM addresses x
       WHERE x.address = a::extensions.ltree AND x.level IN ('ayah', 'hadith', 'narration', 'page', 'passage', 'comment')
     )`,
    [addresses],
  );
  return rows.map((r) => r.address);
}

async function countExisting(client: pg.PoolClient, table: "topics" | "terms" | "position_sides", ids: number[]) {
  if (ids.length === 0) return 0;
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table} WHERE id = ANY($1::bigint[])`, [ids]);
  return rows[0].n as number;
}

// Creates (id = null) or updates a topic in one transaction, with a journal entry.
export async function saveTopic(id: number | null, input: TopicInput, actor: string): Promise<SaveResult> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const problems: InputProblem[] = [];

    const before = id ? await getTopicForEdit(id) : null;
    if (id && !before) {
      await client.query("ROLLBACK");
      return { problems: [{ field: "", code: "notFound" }] };
    }
    if (before && before.status === "published" && before.slug !== input.slug) {
      problems.push({ field: "slug", code: "slugPublished" });
    }
    if (before && before.status === "published" && !input.reason) {
      problems.push({ field: "reason", code: "reason" });
    }
    const taken = await client.query("SELECT 1 FROM topics WHERE slug = $1 AND id IS DISTINCT FROM $2", [
      input.slug,
      id,
    ]);
    if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });

    const refFields = { main: "mainRefs", circumstances: "circumstancesRefs", related: "relatedRefs" } as const;
    // "Ибн Касир 2:64" is kept as the tafsir comment that covers the ayah.
    const refsIn = (text: string) => resolveBookRefs(client, parseRefs(text).addresses);
    const refs = {} as Record<keyof typeof refFields, string[]>;
    for (const [role, field] of Object.entries(refFields) as [keyof typeof refFields, keyof TopicInput][]) {
      refs[role] = await refsIn(input[field] as string);
    }
    const positionRefs = await Promise.all(input.positions.map((p) => refsIn(p.refs)));
    for (const [role, field] of Object.entries(refFields) as [keyof typeof refFields, string][]) {
      const missing = await missingAddresses(client, refs[role]);
      if (missing.length) problems.push({ field, code: "refsMissing", detail: formatRefs(missing) });
    }
    for (const i of input.positions.keys()) {
      const lost = await missingAddresses(client, positionRefs[i]);
      if (lost.length) problems.push({ field: `positions.${i}.refs`, code: "refsMissing", detail: formatRefs(lost) });
    }
    const sideIds = [...new Set(input.positions.map((p) => p.sideId))];
    if ((await countExisting(client, "position_sides", sideIds)) !== sideIds.length) {
      problems.push({ field: "positions", code: "side" });
    }
    if ((await countExisting(client, "terms", input.terms)) !== input.terms.length) {
      problems.push({ field: "terms", code: "terms" });
    }
    const relatedIds = input.related.filter((relatedId) => relatedId !== id);
    if ((await countExisting(client, "topics", relatedIds)) !== relatedIds.length) {
      problems.push({ field: "related", code: "related" });
    }
    const placeId = input.place
      ? ((await client.query<{ id: number }>("SELECT id::int FROM places WHERE slug = $1", [input.place])).rows[0]?.id ?? null)
      : null;
    if (input.place && !placeId) problems.push({ field: "place", code: "place" });
    if (problems.length) {
      await client.query("ROLLBACK");
      return { problems };
    }

    let topicId = id;
    if (topicId) {
      await client.query(
        `UPDATE topics SET slug = $2, category = $3, status = $4, place_id = $6, updated_by = $5, updated_at = now()
         WHERE id = $1`,
        [topicId, input.slug, input.category, input.status, actor, placeId],
      );
    } else {
      const created = await client.query<{ id: number }>(
        `INSERT INTO topics (slug, category, status, place_id, created_by, updated_by)
         VALUES ($1, $2, $3, $5, $4, $4) RETURNING id::int`,
        [input.slug, input.category, input.status, actor, placeId],
      );
      topicId = created.rows[0].id;
    }

    await client.query(
      `INSERT INTO topic_texts (topic_id, locale, title, question, circumstances, circumstances_note)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (topic_id, locale) DO UPDATE
         SET title = EXCLUDED.title, question = EXCLUDED.question,
             circumstances = EXCLUDED.circumstances, circumstances_note = EXCLUDED.circumstances_note`,
      [topicId, LOCALE, input.title, input.question, input.circumstances, input.circumstancesNote],
    );

    // Positions and references are replaced as a whole on every save.
    await client.query("DELETE FROM topic_refs WHERE topic_id = $1", [topicId]);
    await client.query("DELETE FROM topic_positions WHERE topic_id = $1 AND locale = $2", [topicId, LOCALE]);
    for (const role of ["main", "circumstances", "related"] as const) {
      await insertRefs(client, topicId, role, null, refs[role]);
    }
    for (const [order, position] of input.positions.entries()) {
      const created = await client.query<{ id: string }>(
        `INSERT INTO topic_positions (topic_id, side_id, locale, holder, recognition, text, source_note, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          topicId,
          position.sideId,
          LOCALE,
          position.holder,
          position.recognition,
          position.text,
          position.sourceNote,
          order,
        ],
      );
      await insertRefs(client, topicId, "position", created.rows[0].id, positionRefs[order]);
    }

    await client.query("DELETE FROM topic_terms WHERE topic_id = $1", [topicId]);
    if (input.terms.length) {
      await client.query(
        "INSERT INTO topic_terms (topic_id, term_id) SELECT $1, unnest($2::bigint[])",
        [topicId, input.terms],
      );
    }
    // Relations are kept in both directions.
    await client.query("DELETE FROM topic_relations WHERE topic_id = $1 OR related_id = $1", [topicId]);
    for (const relatedId of relatedIds) {
      await client.query(
        "INSERT INTO topic_relations (topic_id, related_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING",
        [topicId, relatedId],
      );
    }

    const { reason, ...snapshot } = input;
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('topic', $1, $2, $3, $4, $5, $6)`,
      [
        String(topicId),
        id ? "updated" : "created",
        before ? JSON.stringify({ ...before, reason: undefined }) : null,
        JSON.stringify(snapshot),
        reason,
        actor,
      ],
    );
    await client.query("COMMIT");
    return { id: topicId, problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertRefs(
  client: pg.PoolClient,
  topicId: number,
  role: RefRole,
  positionId: string | null,
  addresses: string[],
) {
  if (addresses.length === 0) return;
  await client.query(
    `INSERT INTO topic_refs (topic_id, role, position_id, address, position)
     SELECT $1, $2, $3, a::extensions.ltree, p - 1 FROM unnest($4::text[]) WITH ORDINALITY AS t(a, p)`,
    [topicId, role, positionId, addresses],
  );
}

// Only drafts can be deleted; anything that was ever shown is retired instead.
export async function deleteDraftTopic(id: number, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const topic = await client.query(
      `SELECT t.status, t.slug, x.title FROM topics t
       LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $2 WHERE t.id = $1 FOR UPDATE OF t`,
      [id, LOCALE],
    );
    const row = topic.rows[0];
    const everPublished = await client.query(
      `SELECT 1 FROM change_log WHERE entity = 'topic' AND entity_id = $1 AND new_value->>'status' = 'published'`,
      [String(id)],
    );
    if (!row || row.status !== "draft" || everPublished.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("DELETE FROM topics WHERE id = $1", [id]);
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, reason, actor)
       VALUES ('topic', $1, 'deleted', $2, 'Удалён черновик', $3)`,
      [String(id), JSON.stringify({ slug: row.slug, title: row.title }), actor],
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
