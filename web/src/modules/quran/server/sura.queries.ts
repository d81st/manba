import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Attribution, Segment, Sura, SuraSummary } from "../quran.types";
import { SURA_SUMMARY, type SummaryRow, toSummary, TRANSLATION } from "./quran.sql";

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
