import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type pg from "pg";
import { defaultLocale } from "@/i18n";
import { db } from "@/lib/db";
import {
  formatRefs,
  parseRefs,
  RELATION_KINDS,
  type InputProblem,
  type TermInput,
} from "@/lib/glossary-input";

export const GLOSSARY_TAG = "glossary";
const LOCALE = defaultLocale;

type RelationKind = (typeof RELATION_KINDS)[number];

// The same link seen from the other term.
const INVERSE: Record<RelationKind, RelationKind> = {
  related: "related",
  opposite: "opposite",
  broader: "narrower",
  narrower: "broader",
};

export type TermSummary = {
  id: number;
  slug: string;
  arabic: string;
  transliteration: string;
  translation: string;
  short: string;
  status: string;
  isBasic: boolean;
  basicOrder: number | null;
  updatedAt: string;
  updatedBy: string;
};

const SUMMARY = `
  SELECT t.id::int, t.slug, t.arabic, t.transliteration, x.translation, x.short, t.status,
         t.is_basic AS "isBasic", t.basic_order AS "basicOrder",
         t.updated_at::text AS "updatedAt", t.updated_by AS "updatedBy"
  FROM terms t JOIN term_texts x ON x.term_id = t.id AND x.locale = '${LOCALE}'`;

// ============ Admin ============

export async function listTermsForAdmin(status?: string): Promise<TermSummary[]> {
  const { rows } = await db().query<TermSummary>(
    `${SUMMARY} WHERE ($1::text IS NULL OR t.status = $1) ORDER BY t.updated_at DESC`,
    [status ?? null],
  );
  return rows;
}

export type TermForEdit = TermInput & { id: number; relatedNames: Record<number, string> };

export async function getTermForEdit(id: number): Promise<TermForEdit | null> {
  const term = await db().query(
    `SELECT t.*, x.translation, x.short, x.detail FROM terms t
     JOIN term_texts x ON x.term_id = t.id AND x.locale = $2 WHERE t.id = $1`,
    [id, LOCALE],
  );
  const row = term.rows[0];
  if (!row) return null;

  const refs = await db().query<{ definition_id: string | null; address: string }>(
    `SELECT definition_id, address::text FROM term_refs WHERE term_id = $1 ORDER BY position`,
    [id],
  );
  const definitions = await db().query(
    `SELECT id, holder, recognition, text, source_note FROM term_definitions
     WHERE term_id = $1 AND locale = $2 ORDER BY position`,
    [id, LOCALE],
  );
  const related = await db().query<{ id: number; kind: RelationKind; name: string }>(
    `SELECT r.related_id::int AS id, r.kind, x.translation AS name
     FROM term_relations r JOIN term_texts x ON x.term_id = r.related_id AND x.locale = $2
     WHERE r.term_id = $1 ORDER BY x.translation`,
    [id, LOCALE],
  );
  const refsOf = (definitionId: string | null) =>
    formatRefs(refs.rows.filter((r) => r.definition_id === definitionId).map((r) => r.address));

  return {
    id,
    slug: row.slug,
    arabic: row.arabic,
    transliteration: row.transliteration,
    translation: row.translation,
    short: row.short,
    detail: row.detail,
    isBasic: row.is_basic,
    basicOrder: row.basic_order,
    status: row.status,
    refs: refsOf(null),
    related: related.rows.map((r) => ({ id: r.id, kind: r.kind })),
    relatedNames: Object.fromEntries(related.rows.map((r) => [r.id, r.name])),
    definitions: definitions.rows.map((d) => ({
      holder: d.holder,
      recognition: d.recognition,
      text: d.text,
      sourceNote: d.source_note,
      refs: refsOf(String(d.id)),
    })),
    reason: "",
  };
}

// Terms to pick as related ones (any status, so drafts can be linked).
export async function listTermChoices(): Promise<{ id: number; name: string }[]> {
  const { rows } = await db().query<{ id: number; name: string }>(
    `SELECT t.id::int, x.translation || ' · ' || t.transliteration AS name
     FROM terms t JOIN term_texts x ON x.term_id = t.id AND x.locale = $1
     WHERE t.status <> 'retired' ORDER BY x.translation`,
    [LOCALE],
  );
  return rows;
}

async function missingAddresses(client: pg.PoolClient, addresses: string[]) {
  if (addresses.length === 0) return [];
  const { rows } = await client.query<{ address: string }>(
    `SELECT a FROM unnest($1::text[]) AS a
     WHERE NOT EXISTS (SELECT 1 FROM addresses x WHERE x.address = a::extensions.ltree AND x.level = 'ayah')`,
    [addresses],
  );
  return rows.map((r) => r.address);
}

export type SaveResult = { id?: number; problems: InputProblem[] };

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

    const termRefs = parseRefs(input.refs).addresses;
    const missing = await missingAddresses(client, termRefs);
    if (missing.length) problems.push({ field: "refs", code: "refsMissing", detail: formatRefs(missing) });
    for (const [i, definition] of input.definitions.entries()) {
      const lost = await missingAddresses(client, parseRefs(definition.refs).addresses);
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
      await insertRefs(client, termId, created.rows[0].id, parseRefs(definition.refs).addresses);
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

// ============ Public ============

export async function listPublishedTerms(): Promise<TermSummary[]> {
  "use cache";
  cacheTag(GLOSSARY_TAG);
  cacheLife("hours");
  const { rows } = await db().query<TermSummary>(
    `${SUMMARY} WHERE t.status = 'published' ORDER BY lower(x.translation)`,
  );
  return rows;
}

export type RefAyah = { address: string; sura: number; ayah: number; suraName: string; text: string };
export type PublicDefinition = {
  holder: string;
  recognition: string;
  text: string;
  sourceNote: string;
  refs: RefAyah[];
};
export type PublicTerm = TermSummary & {
  detail: string;
  refs: RefAyah[];
  definitions: PublicDefinition[];
  related: { slug: string; translation: string; transliteration: string; kind: RelationKind }[];
};

export async function getPublishedTerm(slug: string): Promise<PublicTerm | null> {
  "use cache";
  cacheTag(GLOSSARY_TAG);
  cacheLife("hours");
  const summary = await db().query<TermSummary & { detail: string }>(
    `SELECT s.*, x.detail FROM (${SUMMARY} WHERE t.slug = $1 AND t.status = 'published') s
     JOIN term_texts x ON x.term_id = s.id AND x.locale = '${LOCALE}'`,
    [slug],
  );
  const term = summary.rows[0];
  if (!term) return null;

  // Referenced ayahs with the primary text and the sura name.
  const refs = await db().query<{ definition_id: string | null; address: string; text: string; sura_name: string }>(
    `SELECT r.definition_id, r.address::text, t.content AS text, s.names->>'translit' AS sura_name
     FROM term_refs r
     JOIN texts t ON t.address = r.address
     JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published'
       AND v.work_id = 'quran' AND v.language = 'ar'
     JOIN addresses s ON s.address = subpath(r.address, 0, 2)
     WHERE r.term_id = $1 ORDER BY r.position`,
    [term.id],
  );
  const toAyah = (row: { address: string; text: string; sura_name: string }): RefAyah => {
    const [, sura, ayah] = row.address.split(".").map(Number);
    return { address: row.address, sura, ayah, suraName: row.sura_name, text: row.text };
  };
  const definitions = await db().query(
    `SELECT id, holder, recognition, text, source_note FROM term_definitions
     WHERE term_id = $1 AND locale = $2 ORDER BY position`,
    [term.id, LOCALE],
  );
  const related = await db().query(
    `SELECT t.slug, x.translation, t.transliteration, r.kind
     FROM term_relations r JOIN terms t ON t.id = r.related_id AND t.status = 'published'
     JOIN term_texts x ON x.term_id = t.id AND x.locale = $2
     WHERE r.term_id = $1 ORDER BY x.translation`,
    [term.id, LOCALE],
  );

  return {
    ...term,
    refs: refs.rows.filter((r) => r.definition_id === null).map(toAyah),
    definitions: definitions.rows.map((d) => ({
      holder: d.holder,
      recognition: d.recognition,
      text: d.text,
      sourceNote: d.source_note,
      refs: refs.rows.filter((r) => r.definition_id === String(d.id)).map(toAyah),
    })),
    related: related.rows,
  };
}
