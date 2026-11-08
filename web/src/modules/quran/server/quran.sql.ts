// Shared pieces of the Quran queries (internal to the module's server side).
import "server-only";
import type { SearchResult, SuraSummary } from "../quran.types";

// The Russian translation shown under the ayahs: the published one first loaded.
export const TRANSLATION = `
  SELECT v.id, v.title AS version_title, v.verification, s.title, s.url, s.license, s.version
  FROM text_versions v JOIN sources s ON s.id = v.source_id
  WHERE v.work_id = 'quran' AND v.language = 'ru' AND v.kind = 'translation' AND v.status = 'published'
  ORDER BY v.created_at, v.id LIMIT 1`;

export const SURA_SUMMARY = `
  SELECT split_part(a.address::text, '.', 2)::int AS number,
         a.names,
         (SELECT count(*)::int FROM addresses x
           WHERE x.level = 'ayah' AND x.address <@ a.address) AS ayahs,
         (SELECT c.value FROM classifications c
           WHERE c.address = a.address AND c.kind = 'revelation_place'
             AND c.recognition = 'tradition' LIMIT 1) AS revelation_place
  FROM addresses a
  WHERE a.work_id = 'quran' AND a.level = 'sura' AND a.status = 'active'`;

export type SummaryRow = { number: number; names: SuraSummary["names"]; ayahs: number; revelation_place: string | null };

export function toSummary(row: SummaryRow): SuraSummary {
  return { number: row.number, names: row.names, ayahs: row.ayahs, revelationPlace: row.revelation_place };
}

// The published Russian translation shown beside the ayahs (first loaded).
export const TRANSLATION_ID = `(SELECT id FROM text_versions
    WHERE work_id = 'quran' AND language = 'ru' AND kind = 'translation' AND status = 'published'
    ORDER BY created_at, id LIMIT 1)`;

// Ayahs of the primary published Arabic version, with the sura name, the
// standard-spelling text (another published original version) and the
// translation beside them.
export const HITS = `
  SELECT a.address::text AS address, t.content AS text, alt.content AS alt, tr.content AS translation,
         s.names->>'translit' AS sura_name, count(*) OVER () AS total
  FROM texts t
  JOIN addresses a ON a.address = t.address
  JOIN addresses s ON s.address = subpath(a.address, 0, 2)
  JOIN text_versions v ON v.id = t.version_id
  LEFT JOIN texts alt ON alt.address = a.address AND alt.version_id = (
    SELECT id FROM text_versions
    WHERE work_id = 'quran' AND language = 'ar' AND kind = 'original'
      AND script = 'imlaei' AND status = 'published'
    ORDER BY id LIMIT 1)
  LEFT JOIN texts tr ON tr.address = a.address AND tr.version_id = ${TRANSLATION_ID}
  WHERE v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'
    AND a.level = 'ayah' AND a.status = 'active'`;

export type HitRow = {
  address: string;
  text: string;
  alt: string | null;
  translation: string | null;
  sura_name: string;
  total: string;
};

export function toResult(rows: HitRow[]): SearchResult {
  return {
    total: Number(rows[0]?.total ?? 0),
    hits: rows.map((row) => {
      const [, sura, ayah] = row.address.split(".");
      return {
        address: row.address,
        sura: Number(sura),
        ayah: Number(ayah),
        suraName: row.sura_name,
        text: row.text,
        alt: row.alt,
        translation: row.translation,
      };
    }),
  };
}
