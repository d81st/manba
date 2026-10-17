import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export type SuraSummary = {
  number: number;
  names: { ar: string; translit: string; en: string };
  ayahs: number;
  revelationPlace: string | null; // traditional classification
};

export type Segment = { address: string; level: "ayah" | "basmala"; number: number; text: string };

export type Attribution = { title: string; url: string; license: string; version: string };

export type Sura = SuraSummary & { segments: Segment[]; attribution: Attribution | null };

const SURA_SUMMARY = `
  SELECT split_part(a.address::text, '.', 2)::int AS number,
         a.names,
         (SELECT count(*)::int FROM addresses x
           WHERE x.level = 'ayah' AND x.address <@ a.address) AS ayahs,
         (SELECT c.value FROM classifications c
           WHERE c.address = a.address AND c.kind = 'revelation_place'
             AND c.recognition = 'tradition' LIMIT 1) AS revelation_place
  FROM addresses a
  WHERE a.work_id = 'quran' AND a.level = 'sura' AND a.status = 'active'`;

type SummaryRow = { number: number; names: SuraSummary["names"]; ayahs: number; revelation_place: string | null };

function toSummary(row: SummaryRow): SuraSummary {
  return { number: row.number, names: row.names, ayahs: row.ayahs, revelationPlace: row.revelation_place };
}

export async function listSuras(): Promise<SuraSummary[]> {
  "use cache";
  cacheTag("quran");
  cacheLife("hours");
  const { rows } = await db().query<SummaryRow>(`${SURA_SUMMARY} ORDER BY 1`);
  return rows.map(toSummary);
}

export async function getSura(number: number): Promise<Sura | null> {
  "use cache";
  cacheTag("quran");
  cacheLife("hours");
  const address = `quran.${number}`;
  const summary = await db().query<SummaryRow>(`${SURA_SUMMARY} AND a.address = $1::ltree`, [address]);
  if (!summary.rows[0]) return null;

  // The primary published Arabic version: Hafs, Uthmani script.
  const segments = await db().query<{ address: string; level: Segment["level"]; text: string }>(
    `SELECT a.address::text AS address, a.level, t.content AS text
     FROM addresses a
     JOIN texts t ON t.address = a.address
     JOIN text_versions v ON v.id = t.version_id
     WHERE a.address <@ $1::ltree AND a.level IN ('basmala', 'ayah') AND a.status = 'active'
       AND v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'
     ORDER BY a.ordinal`,
    [address],
  );
  const source = await db().query<Attribution>(
    `SELECT s.title, s.url, s.license, s.version
     FROM text_versions v JOIN sources s ON s.id = v.source_id
     WHERE v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'`,
  );

  return {
    ...toSummary(summary.rows[0]),
    segments: segments.rows.map((row) => ({
      ...row,
      number: Number(row.address.split(".")[2]),
    })),
    attribution: source.rows[0] ?? null,
  };
}

export type SearchHit = {
  address: string;
  sura: number;
  ayah: number;
  suraName: string;
  text: string; // primary version (Uthmani)
  alt: string | null; // the same ayah in standard spelling, if loaded
};
export type SearchResult = { hits: SearchHit[]; total: number };

export const SEARCH_LIMIT = 200;

// Ayahs of the primary published Arabic version, with the sura name and the
// standard-spelling text (another published original version) beside them.
const HITS = `
  SELECT a.address::text AS address, t.content AS text, alt.content AS alt,
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
  WHERE v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'
    AND a.level = 'ayah' AND a.status = 'active'`;

type HitRow = { address: string; text: string; alt: string | null; sura_name: string; total: string };

function toResult(rows: HitRow[]): SearchResult {
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
      };
    }),
  };
}

// An ayah matches when every pattern is found in any published original
// Arabic version (Uthmani or standard spelling). "diacritics" picks the
// vocalized search column.
export async function searchText(patterns: string[], diacritics: boolean): Promise<SearchResult> {
  const column = diacritics ? "m.search_vocalized" : "m.search_plain";
  const { rows } = await db().query<HitRow>(
    `${HITS} AND a.address IN (
       SELECT m.address FROM texts m JOIN text_versions mv ON mv.id = m.version_id
       WHERE mv.work_id = 'quran' AND mv.language = 'ar' AND mv.kind = 'original'
         AND mv.status = 'published' AND ${column} LIKE ALL ($1::text[]))
     ORDER BY a.ordinal LIMIT ${SEARCH_LIMIT}`,
    [patterns],
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
