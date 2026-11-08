import "server-only";
import type pg from "pg";
import { db } from "@/shared/db";
import type { InputProblem } from "@/shared/forms/input";
import { formatRefs, parseRefs } from "@/shared/addresses/refs";
import type { SaveResult } from "../term.types";
import type { TermInput } from "../term.validation";
import { getTermForEdit } from "./term.queries";
import { INVERSE, LOCALE } from "./term.sql";
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

// Creates (id = null) or updates a term in one transaction, with a journal entry.
export async function saveTerm(id: number | null, input: TermInput, actor: string): Promise<SaveResult> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const problems: InputProblem[] = [];

    const before = id ? await getTermForEdit(id) : null;
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
    const taken = await client.query("SELECT 1 FROM terms WHERE slug = $1 AND id IS DISTINCT FROM $2", [
      input.slug,
      id,
    ]);
    if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });

    // "Ибн Касир 2:64" is kept as the tafsir comment that covers the ayah.
    const termRefs = await resolveBookRefs(client, parseRefs(input.refs).addresses);
    const definitionRefs = await Promise.all(
      input.definitions.map((d) => resolveBookRefs(client, parseRefs(d.refs).addresses)),
    );
    const missing = await missingAddresses(client, termRefs);
    if (missing.length) problems.push({ field: "refs", code: "refsMissing", detail: formatRefs(missing) });
    for (const i of input.definitions.keys()) {
      const lost = await missingAddresses(client, definitionRefs[i]);
      if (lost.length) {
        problems.push({ field: `definitions.${i}.refs`, code: "refsMissing", detail: formatRefs(lost) });
      }
    }
    const relatedIds = input.related.map((r) => r.id).filter((relatedId) => relatedId !== id);
    if (relatedIds.length) {
      const found = await client.query("SELECT count(*)::int AS n FROM terms WHERE id = ANY($1::bigint[])", [
        relatedIds,
      ]);
      if (found.rows[0].n !== new Set(relatedIds).size) problems.push({ field: "related", code: "related" });
    }
    if (problems.length) {
      await client.query("ROLLBACK");
      return { problems };
    }

    let termId = id;
    if (termId) {
      await client.query(
        `UPDATE terms SET slug = $2, arabic = $3, transliteration = $4, is_basic = $5, basic_order = $6,
                status = $7, updated_by = $8, updated_at = now() WHERE id = $1`,
        [termId, input.slug, input.arabic, input.transliteration, input.isBasic, input.basicOrder, input.status, actor],
      );
    } else {
      const created = await client.query<{ id: number }>(
        `INSERT INTO terms (slug, arabic, transliteration, is_basic, basic_order, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id::int`,
        [input.slug, input.arabic, input.transliteration, input.isBasic, input.basicOrder, input.status, actor],
      );
      termId = created.rows[0].id;
    }

    await client.query(
      `INSERT INTO term_texts (term_id, locale, translation, short, detail) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (term_id, locale) DO UPDATE
         SET translation = EXCLUDED.translation, short = EXCLUDED.short, detail = EXCLUDED.detail`,
      [termId, LOCALE, input.translation, input.short, input.detail],
    );

    // Definitions and references are replaced as a whole on every save.
    await client.query("DELETE FROM term_refs WHERE term_id = $1", [termId]);
    await client.query("DELETE FROM term_definitions WHERE term_id = $1 AND locale = $2", [termId, LOCALE]);
    await insertRefs(client, termId, null, termRefs);
    for (const [position, definition] of input.definitions.entries()) {
      const created = await client.query<{ id: string }>(
        `INSERT INTO term_definitions (term_id, locale, holder, recognition, text, source_note, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [termId, LOCALE, definition.holder, definition.recognition, definition.text, definition.sourceNote, position],
      );
      await insertRefs(client, termId, created.rows[0].id, definitionRefs[position]);
    }

    // Relations are kept in both directions.
    await client.query("DELETE FROM term_relations WHERE term_id = $1 OR related_id = $1", [termId]);
    for (const relation of input.related.filter((r) => r.id !== termId)) {
      await client.query(
        `INSERT INTO term_relations (term_id, related_id, kind) VALUES ($1, $2, $3), ($2, $1, $4)
         ON CONFLICT DO NOTHING`,
        [termId, relation.id, relation.kind, INVERSE[relation.kind]],
      );
    }

    const { reason, ...snapshot } = input;
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('term', $1, $2, $3, $4, $5, $6)`,
      [
        String(termId),
        id ? "updated" : "created",
        before ? JSON.stringify({ ...before, relatedNames: undefined, reason: undefined }) : null,
        JSON.stringify(snapshot),
        reason,
        actor,
      ],
    );
    await client.query("COMMIT");
    return { id: termId, problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertRefs(client: pg.PoolClient, termId: number, definitionId: string | null, addresses: string[]) {
  if (addresses.length === 0) return;
  await client.query(
    `INSERT INTO term_refs (term_id, definition_id, address, position)
     SELECT $1, $2, a::extensions.ltree, p - 1 FROM unnest($3::text[]) WITH ORDINALITY AS t(a, p)`,
    [termId, definitionId, addresses],
  );
}

// Only drafts can be deleted; anything that was ever shown is retired instead.
export async function deleteDraftTerm(id: number, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const term = await client.query(
      `SELECT t.status, t.slug, x.translation FROM terms t
       LEFT JOIN term_texts x ON x.term_id = t.id AND x.locale = $2 WHERE t.id = $1 FOR UPDATE OF t`,
      [id, LOCALE],
    );
    const row = term.rows[0];
    const everPublished = await client.query(
      `SELECT 1 FROM change_log WHERE entity = 'term' AND entity_id = $1 AND new_value->>'status' = 'published'`,
      [String(id)],
    );
    if (!row || row.status !== "draft" || everPublished.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("DELETE FROM terms WHERE id = $1", [id]);
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, reason, actor)
       VALUES ('term', $1, 'deleted', $2, 'Удалён черновик', $3)`,
      [String(id), JSON.stringify({ slug: row.slug, translation: row.translation }), actor],
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
