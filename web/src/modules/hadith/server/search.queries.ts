import "server-only";
import { db } from "@/shared/db";
import { matchConditions } from "@/shared/text/search-sql";
import { COLLECTION_ORDER } from "@/shared/addresses/hadith-query";
import { HADITH_SEARCH_LIMIT } from "../hadith.constants";
import { shortTitle } from "../hadith.format";
import type { HadithHit } from "../hadith.types";
import { PATH } from "./hadith.sql";

// Hadiths of all published collections whose search form contains every pattern.
export async function searchHadith(
  patterns: string[],
  diacritics: boolean,
): Promise<{ hits: HadithHit[]; total: number }> {
  const match = matchConditions("t", patterns, diacritics, 1, true);
  const conditions = match.sql;
  const order = `$${match.params.length + 1}::text[]`;
  const { rows } = await db().query<HadithHit & { total: number; workShort: string | null }>(
    `SELECT h.*, ${PATH("h.address")} AS path,
            (SELECT count(*)::int FROM section_items s
             WHERE s.version_id = h.version_id AND s.address <@ subpath(h.address, 0, 2)) AS variants
     FROM (
       SELECT w.id AS work, w.titles->>'ru' AS "workTitle", w.titles->>'ru-short' AS "workShort",
              t.version_id, t.address, i.book, t.content AS text, count(*) OVER ()::int AS total,
              w.authority_sunni AS authority, a.ordinal
       FROM texts t
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
       JOIN works w ON w.id = v.work_id AND w.category = 'hadith'
       JOIN section_items i ON i.version_id = t.version_id AND i.address = t.address
       JOIN addresses a ON a.address = t.address
       WHERE ${conditions}
       ORDER BY w.authority_sunni NULLS LAST, array_position(${order}, w.id) NULLS LAST, w.id, a.ordinal
       LIMIT ${HADITH_SEARCH_LIMIT}
     ) h
     ORDER BY h.authority NULLS LAST, array_position(${order}, h.work) NULLS LAST, h.work, h.ordinal`,
    [...match.params, COLLECTION_ORDER],
  );
  const hits = rows.map((row) => ({
    work: row.work,
    workTitle: shortTitle(row.workTitle, row.workShort),
    path: row.path,
    variants: row.variants,
    book: row.book,
    text: row.text,
  }));
  return { hits, total: rows[0]?.total ?? 0 };
}
