import "server-only";
import { db } from "@/lib/db";
import { matchConditions } from "@/lib/search-sql";
import { SEARCH_LIMIT } from "../quran.constants";
import type { SearchResult } from "../quran.types";
import { HITS, type HitRow, toResult, TRANSLATION_ID } from "./quran.sql";

// An ayah matches when every pattern is found in any published original
// Arabic version (Uthmani or standard spelling). "diacritics" picks the
// vocalized search column.
export async function searchText(patterns: string[], diacritics: boolean): Promise<SearchResult> {
  const match = matchConditions("m", patterns, diacritics, 1, true);
  const { rows } = await db().query<HitRow>(
    `${HITS} AND a.address IN (
       SELECT m.address FROM texts m JOIN text_versions mv ON mv.id = m.version_id
       WHERE mv.work_id = 'quran' AND mv.language = 'ar' AND mv.kind = 'original'
         AND mv.status = 'published' AND ${match.sql})
     ORDER BY a.ordinal LIMIT ${SEARCH_LIMIT}`,
    match.params,
  );
  return toResult(rows);
}

// Ayahs whose Russian translation has every pattern (its search form, plain-key.ts).
export async function searchTranslation(patterns: string[]): Promise<SearchResult> {
  const match = matchConditions("m", patterns, false, 1, true);
  const { rows } = await db().query<HitRow>(
    `${HITS} AND a.address IN (
       SELECT m.address FROM texts m WHERE m.version_id = ${TRANSLATION_ID} AND ${match.sql})
     ORDER BY a.ordinal LIMIT ${SEARCH_LIMIT}`,
    match.params,
  );
  return toResult(rows);
}

export async function getAyahs(sura: number, from: number, to: number): Promise<SearchResult> {
  const { rows } = await db().query<HitRow>(
    `${HITS} AND a.address <@ $1::ltree
       AND split_part(a.address::text, '.', 3)::int BETWEEN $2 AND $3
     ORDER BY a.ordinal`,
    [`quran.${sura}`, from, to],
  );
  return toResult(rows);
}

// ============ Map ============

// Addresses ("2:255") of every ayah matching a text search, without a limit.
export async function searchAddresses(patterns: string[], diacritics: boolean): Promise<string[]> {
  const match = matchConditions("m", patterns, diacritics, 1, true);
  const { rows } = await db().query<{ address: string }>(
    `SELECT DISTINCT a.address::text AS address, a.ordinal
     FROM texts m
     JOIN text_versions mv ON mv.id = m.version_id
     JOIN addresses a ON a.address = m.address
     WHERE mv.work_id = 'quran' AND mv.language = 'ar' AND mv.kind = 'original'
       AND mv.status = 'published' AND a.level = 'ayah' AND a.status = 'active'
       AND ${match.sql}
     ORDER BY a.ordinal`,
    match.params,
  );
  return rows.map((row) => row.address.split(".").slice(1).join(":"));
}
