import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { formatRefs } from "@/shared/addresses/refs";
import { GLOSSARY_TAG } from "../term.constants";
import type { RelationKind, TermForEdit, TermSummary } from "../term.types";
import { LOCALE, SUMMARY } from "./term.sql";

// Lists and the edit form; the public page of one term is in term-page.queries.ts.

export async function listTermsForAdmin(status?: string): Promise<TermSummary[]> {
  const { rows } = await db().query<TermSummary>(
    `${SUMMARY} WHERE ($1::text IS NULL OR t.status = $1) ORDER BY t.updated_at DESC`,
    [status ?? null],
  );
  return rows;
}

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

export async function listPublishedTerms(): Promise<TermSummary[]> {
  "use cache";
  cacheTag(GLOSSARY_TAG);
  cacheLife("hours");
  const { rows } = await db().query<TermSummary>(
    `${SUMMARY} WHERE t.status = 'published' ORDER BY lower(x.translation)`,
  );
  return rows;
}
