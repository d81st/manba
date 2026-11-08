import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { getHadithRefs } from "@/lib/hadith";
import { GLOSSARY_TAG } from "../term.constants";
import type { PublicTerm, RefAyah, TermSummary } from "../term.types";
import { LOCALE, SUMMARY } from "./term.sql";

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

  // Referenced ayahs with the primary text and the sura name; hadiths with their texts.
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
  const hadithRefs = await db().query<{ definition_id: string | null; address: string }>(
    `SELECT definition_id, address::text FROM term_refs
     WHERE term_id = $1 AND NOT address <@ 'quran'::extensions.ltree ORDER BY position`,
    [term.id],
  );
  const hadiths = await getHadithRefs([...new Set(hadithRefs.rows.map((r) => r.address))]);
  const hadithsOf = (definitionId: string | null) =>
    hadithRefs.rows.filter((r) => r.definition_id === definitionId).flatMap((r) => hadiths.get(r.address) ?? []);
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
    hadiths: hadithsOf(null),
    definitions: definitions.rows.map((d) => ({
      holder: d.holder,
      recognition: d.recognition,
      text: d.text,
      sourceNote: d.source_note,
      refs: refs.rows.filter((r) => r.definition_id === String(d.id)).map(toAyah),
      hadiths: hadithsOf(String(d.id)),
    })),
    related: related.rows,
  };
}
