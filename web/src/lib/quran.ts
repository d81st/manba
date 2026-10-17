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
