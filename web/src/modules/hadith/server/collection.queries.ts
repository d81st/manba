import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { COLLECTION_ORDER, schemeOf } from "@/shared/addresses/hadith-query";
import { HADITH_TAG } from "../hadith.constants";
import { shortTitle } from "../hadith.format";
import type { Collection } from "../hadith.types";
import { PRIMARY, type PrimaryRow } from "./hadith.sql";

export async function primaryVersion(workId: string) {
  const { rows } = await db().query<PrimaryRow>(PRIMARY, [workId]);
  return rows[0] ?? null;
}

export async function listCollections(): Promise<{ id: string; title: string; titleAr: string; canon: string }[]> {
  "use cache";
  cacheTag(HADITH_TAG);
  cacheLife("hours");
  const { rows } = await db().query(
    `SELECT w.id, w.titles->>'ru' AS title, w.titles->>'ar' AS "titleAr", w.canon FROM works w
     WHERE w.category = 'hadith' AND w.status = 'published'
       AND EXISTS (SELECT 1 FROM text_versions v WHERE v.work_id = w.id AND v.is_primary AND v.status = 'published')
     ORDER BY w.authority_sunni NULLS LAST, array_position($1::text[], w.id) NULLS LAST, w.id`,
    [COLLECTION_ORDER],
  );
  return rows;
}

export async function getCollection(workId: string): Promise<Collection | null> {
  "use cache";
  cacheTag(HADITH_TAG);
  cacheLife("hours");
  const work = await db().query(
    `SELECT id, titles->>'ru' AS title, titles->>'ru-short' AS short, titles->>'ar' AS title_ar, canon FROM works
     WHERE id = $1 AND category = 'hadith' AND status = 'published'`,
    [workId],
  );
  const version = await primaryVersion(workId);
  if (!work.rows[0] || !version) return null;
  const scheme = schemeOf(workId);
  // Every text is a hadith, except where narrations share a number.
  const hadith = scheme === "narration" ? "split_part(i.address::text, '.', 2)" : "i.address::text";
  // Numbers of the first and last text in reading order: a repeated hadith
  // keeps its earlier number, so min/max would mislead.
  const books = await db().query(
    `SELECT b.book AS number, b.title,
            count(DISTINCT ${hadith})::int AS hadiths,
            count(i.address)::int AS texts,
            (array_agg(split_part(i.address::text, '.', 2)::int ORDER BY a.ordinal))[1] AS first,
            (array_agg(split_part(i.address::text, '.', 2)::int ORDER BY a.ordinal DESC))[1] AS last
     FROM work_sections b
     LEFT JOIN section_items i ON i.version_id = b.version_id AND i.book = b.book
     LEFT JOIN addresses a ON a.address = i.address
     WHERE b.version_id = $1 AND b.kind = 'book'
     GROUP BY b.book, b.title ORDER BY b.book`,
    [version.id],
  );
  const totals = await db().query<{ hadiths: number; texts: number }>(
    `SELECT count(DISTINCT ${hadith})::int AS hadiths, count(*)::int AS texts
     FROM section_items i WHERE i.version_id = $1`,
    [version.id],
  );
  const narrations = scheme === "narration";
  return {
    id: work.rows[0].id,
    title: work.rows[0].title,
    shortTitle: shortTitle(work.rows[0].title, work.rows[0].short),
    titleAr: work.rows[0].title_ar,
    canon: work.rows[0].canon,
    scheme,
    versionId: version.id,
    versionTitle: version.title,
    verification: version.verification,
    attribution: {
      title: version.source_title,
      url: version.url,
      license: version.license,
      notice: version.notice,
      version: version.version,
    },
    hadiths: totals.rows[0].hadiths,
    narrations: narrations ? totals.rows[0].texts : null,
    books: books.rows.map(({ texts, first, last, ...book }) => ({
      ...book,
      narrations: narrations ? texts : null,
      first: scheme === "chapter" ? null : first,
      last: scheme === "chapter" ? null : last,
    })),
  };
}
