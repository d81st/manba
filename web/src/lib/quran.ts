import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { matchConditions } from "@/lib/search-sql";

export type SuraSummary = {
  number: number;
  names: { ar: string; translit: string; en: string };
  ayahs: number;
  revelationPlace: string | null; // traditional classification
};

export type Segment = {
  address: string;
  level: "ayah" | "basmala";
  number: number;
  text: string;
  translation: string | null; // the Russian translation, with its markup (lib/translation-markup.ts)
};

export type Attribution = { title: string; url: string; license: string; version: string };

export type TranslationInfo = Attribution & { versionTitle: string; verification: string };

export type Sura = SuraSummary & {
  segments: Segment[];
  attribution: Attribution | null;
  translation: TranslationInfo | null;
};

// The Russian translation shown under the ayahs: the published one first loaded.
const TRANSLATION = `
  SELECT v.id, v.title AS version_title, v.verification, s.title, s.url, s.license, s.version
  FROM text_versions v JOIN sources s ON s.id = v.source_id
  WHERE v.work_id = 'quran' AND v.language = 'ru' AND v.kind = 'translation' AND v.status = 'published'
  ORDER BY v.created_at, v.id LIMIT 1`;

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
  const translation = await db().query<Attribution & { id: string; version_title: string; verification: string }>(TRANSLATION);
  const tr = translation.rows[0] ?? null;
  const segments = await db().query<{ address: string; level: Segment["level"]; text: string; translation: string | null }>(
    `SELECT a.address::text AS address, a.level, t.content AS text, r.content AS translation
     FROM addresses a
     JOIN texts t ON t.address = a.address
     JOIN text_versions v ON v.id = t.version_id
     LEFT JOIN texts r ON r.address = a.address AND r.version_id = $2
     WHERE a.address <@ $1::ltree AND a.level IN ('basmala', 'ayah') AND a.status = 'active'
       AND v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'
     ORDER BY a.ordinal`,
    [address, tr?.id ?? ""],
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
    translation: tr
      ? { title: tr.title, url: tr.url, license: tr.license, version: tr.version, versionTitle: tr.version_title, verification: tr.verification }
      : null,
  };
}

export type SearchHit = {
  address: string;
  sura: number;
  ayah: number;
  suraName: string;
  text: string; // primary version (Uthmani)
  alt: string | null; // the same ayah in standard spelling, if loaded
  translation: string | null; // the Russian translation, with its markup
};
export type SearchResult = { hits: SearchHit[]; total: number };

export const SEARCH_LIMIT = 200;

// The published Russian translation shown beside the ayahs (first loaded).
const TRANSLATION_ID = `(SELECT id FROM text_versions
    WHERE work_id = 'quran' AND language = 'ru' AND kind = 'translation' AND status = 'published'
    ORDER BY created_at, id LIMIT 1)`;

// Ayahs of the primary published Arabic version, with the sura name, the
// standard-spelling text (another published original version) and the
// translation beside them.
const HITS = `
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

type HitRow = {
  address: string;
  text: string;
  alt: string | null;
  translation: string | null;
  sura_name: string;
  total: string;
};

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
        translation: row.translation,
      };
    }),
  };
}

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

export type MapSura = {
  number: number;
  name: string; // transliteration
  ar: string;
  place: string | null; // traditional classification
  order: number | null; // traditional order of revelation
  words: number[]; // words per ayah in the Uthmani text (pause marks excluded)
  juz: number[]; // juz of each ayah
};

export async function getMapData(): Promise<MapSura[]> {
  "use cache";
  cacheTag("quran");
  cacheLife("hours");

  const suras = await db().query<{
    number: number;
    names: SuraSummary["names"];
    place: string | null;
    order: string | null;
  }>(
    `SELECT split_part(a.address::text, '.', 2)::int AS number, a.names,
            (SELECT value FROM classifications c WHERE c.address = a.address
               AND c.kind = 'revelation_place' AND c.recognition = 'tradition' LIMIT 1) AS place,
            (SELECT value FROM classifications c WHERE c.address = a.address
               AND c.kind = 'revelation_order' AND c.recognition = 'tradition' LIMIT 1) AS order
     FROM addresses a
     WHERE a.work_id = 'quran' AND a.level = 'sura' AND a.status = 'active'
     ORDER BY 1`,
  );
  const ayahs = await db().query<{ sura: number; ordinal: number; words: number }>(
    `SELECT split_part(a.address::text, '.', 2)::int AS sura, a.ordinal,
            coalesce(array_length(string_to_array(nullif(t.search_plain, ''), ' '), 1), 0) AS words
     FROM addresses a
     JOIN texts t ON t.address = a.address
     JOIN text_versions v ON v.id = t.version_id
     WHERE a.work_id = 'quran' AND a.level = 'ayah' AND a.status = 'active'
       AND v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'
     ORDER BY a.ordinal`,
  );
  const juzStarts = await db().query<{ number: number; ordinal: number }>(
    `SELECT d.number, a.ordinal FROM divisions d JOIN addresses a ON a.address = d.starts_at
     WHERE d.work_id = 'quran' AND d.scheme = 'juz' ORDER BY a.ordinal`,
  );

  const byNumber = new Map<number, MapSura>(
    suras.rows.map((row) => [
      row.number,
      {
        number: row.number,
        name: row.names.translit,
        ar: row.names.ar,
        place: row.place,
        order: row.order ? Number(row.order) : null,
        words: [],
        juz: [],
      },
    ]),
  );
  let juzIndex = -1;
  for (const ayah of ayahs.rows) {
    while (juzIndex + 1 < juzStarts.rows.length && juzStarts.rows[juzIndex + 1].ordinal <= ayah.ordinal) {
      juzIndex += 1;
    }
    const sura = byNumber.get(ayah.sura);
    if (!sura) continue;
    sura.words.push(ayah.words);
    sura.juz.push(juzStarts.rows[juzIndex]?.number ?? 0);
  }
  return [...byNumber.values()];
}

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
