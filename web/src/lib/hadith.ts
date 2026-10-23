import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { COLLECTION_ORDER } from "@/lib/hadith-query";

export const HADITH_TAG = "hadith";

// Name before a number: "Абу Дауд 12". Works loaded before short names were
// stored drop the "Сахих".
function shortTitle(title: string, short: string | null) {
  return short ?? title.replace(/^Сахих /, "");
}

export type Attribution = { title: string; url: string; license: string; notice: string; version: string };

export type Collection = {
  id: string;
  title: string;
  shortTitle: string;
  titleAr: string;
  canon: string;
  versionId: string;
  versionTitle: string;
  verification: string;
  attribution: Attribution;
  hadiths: number; // distinct hadith numbers
  narrations: number | null; // texts, when narrations of one hadith have their own addresses
  books: {
    number: number;
    title: string;
    hadiths: number;
    narrations: number | null;
    first: number | null;
    last: number | null;
  }[];
};

const PRIMARY = `
  SELECT v.id, v.title, v.verification, s.title AS source_title, s.url, s.license,
         s.license_text AS notice, s.version
  FROM text_versions v JOIN sources s ON s.id = v.source_id
  WHERE v.work_id = $1 AND v.language = 'ar' AND v.is_primary AND v.status = 'published'`;

type PrimaryRow = {
  id: string;
  title: string;
  verification: string;
  source_title: string;
  url: string;
  license: string;
  notice: string;
  version: string;
};

async function primaryVersion(workId: string) {
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
  // Numbers of the first and last text in reading order: a repeated hadith
  // keeps its earlier number, so min/max would mislead.
  const books = await db().query(
    `SELECT b.book AS number, b.title,
            count(DISTINCT split_part(i.address::text, '.', 2))::int AS hadiths,
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
  const totals = await db().query<{ hadiths: number; texts: number; nested: boolean }>(
    `SELECT count(DISTINCT split_part(address::text, '.', 2))::int AS hadiths, count(*)::int AS texts,
            bool_or(nlevel(address) > 2) AS nested
     FROM section_items WHERE version_id = $1`,
    [version.id],
  );
  return {
    id: work.rows[0].id,
    title: work.rows[0].title,
    shortTitle: shortTitle(work.rows[0].title, work.rows[0].short),
    titleAr: work.rows[0].title_ar,
    canon: work.rows[0].canon,
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
    narrations: totals.rows[0].nested ? totals.rows[0].texts : null,
    books: books.rows.map(({ texts, ...book }) => ({ ...book, narrations: totals.rows[0].nested ? texts : null })),
  };
}

export type BookHadith = {
  number: number;
  variant: number | null; // narration of the hadith, when narrations have their own addresses
  variants: number; // narrations with this number in the whole collection
  text: string;
  numbering: string;
};
export type BookChapter = {
  index: number;
  title: string;
  intro: string;
  unnumbered: string;
  hadiths: BookHadith[];
};
export type Book = { number: number; title: string; chapters: BookChapter[]; previous: number | null; next: number | null };

export async function getBook(workId: string, book: number): Promise<Book | null> {
  "use cache";
  cacheTag(HADITH_TAG);
  cacheLife("hours");
  const version = await primaryVersion(workId);
  if (!version) return null;
  const head = await db().query(
    `SELECT title,
            (SELECT max(book) FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book < $2) AS previous,
            (SELECT min(book) FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book > $2) AS next
     FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book = $2`,
    [version.id, book],
  );
  if (!head.rows[0]) return null;
  const chapters = await db().query(
    `SELECT chapter AS index, title, intro, unnumbered FROM work_sections
     WHERE version_id = $1 AND kind = 'chapter' AND book = $2 ORDER BY chapter`,
    [version.id, book],
  );
  const hadiths = await db().query<BookHadith & { chapter: number }>(
    `WITH counts AS (
       SELECT split_part(address::text, '.', 2)::int AS number, count(*)::int AS variants
       FROM section_items WHERE version_id = $1 GROUP BY 1
     )
     SELECT i.chapter, c.number, c.variants, t.content AS text, i.numbering,
            CASE WHEN nlevel(i.address) > 2 THEN split_part(i.address::text, '.', 3)::int END AS variant
     FROM section_items i
     JOIN counts c ON c.number = split_part(i.address::text, '.', 2)::int
     JOIN addresses a ON a.address = i.address
     JOIN texts t ON t.address = i.address AND t.version_id = i.version_id
     WHERE i.version_id = $1 AND i.book = $2
     ORDER BY a.ordinal`,
    [version.id, book],
  );
  return {
    number: book,
    title: head.rows[0].title,
    previous: head.rows[0].previous,
    next: head.rows[0].next,
    chapters: chapters.rows.map((c) => ({
      ...c,
      hadiths: hadiths.rows
        .filter((h) => h.chapter === c.index)
        .map((h) => ({ number: h.number, variant: h.variant, variants: h.variants, text: h.text, numbering: h.numbering })),
    })),
  };
}

// Where a hadith (its first narration) or one narration is, or the nearest
// numbers when the source has none. A letter the hadith does not have leads
// to its first narration.
export async function locateHadith(
  workId: string,
  number: number,
  variant: number | null,
): Promise<
  { book: number; variant: number | null } | { book: null; before: number | null; after: number | null } | null
> {
  const version = await primaryVersion(workId);
  if (!version) return null;
  const hadith = `${workId}.${number}`;
  const found = await db().query<{ book: number; variant: number | null }>(
    `SELECT i.book, CASE WHEN nlevel(i.address) > 2 THEN split_part(i.address::text, '.', 3)::int END AS variant
     FROM section_items i JOIN addresses a ON a.address = i.address
     WHERE i.version_id = $1 AND i.address <@ $2::extensions.ltree
       AND ($3::text IS NULL OR i.address = $3::extensions.ltree)
     ORDER BY a.ordinal LIMIT 1`,
    [version.id, hadith, variant === null ? null : `${hadith}.${variant}`],
  );
  if (found.rows[0]) return found.rows[0];
  if (variant !== null) return locateHadith(workId, number, null);
  const near = await db().query<{ before: number | null; after: number | null }>(
    `SELECT max(n) FILTER (WHERE n < $2) AS before, min(n) FILTER (WHERE n > $2) AS after
     FROM (SELECT split_part(address::text, '.', 2)::int AS n FROM section_items WHERE version_id = $1) s`,
    [version.id, number],
  );
  return { book: null, ...near.rows[0] };
}

export type HadithHit = {
  work: string;
  workTitle: string; // short name: "Абу Дауд"
  number: number;
  variant: number | null;
  variants: number;
  book: number;
  text: string;
};
export const HADITH_SEARCH_LIMIT = 100;

// Hadiths of all published collections whose search form contains every pattern.
export async function searchHadith(
  patterns: string[],
  diacritics: boolean,
): Promise<{ hits: HadithHit[]; total: number }> {
  const column = diacritics ? "t.search_vocalized" : "t.search_plain";
  const conditions = patterns.map((_, i) => `${column} LIKE $${i + 1}`).join(" AND ");
  const { rows } = await db().query<HadithHit & { total: number; workShort: string | null }>(
    `SELECT h.*,
            (SELECT count(*)::int FROM section_items s
             WHERE s.version_id = h.version_id AND s.address <@ subpath(h.address, 0, 2)) AS variants
     FROM (
       SELECT w.id AS work, w.titles->>'ru' AS "workTitle", w.titles->>'ru-short' AS "workShort",
              t.version_id, t.address,
              split_part(t.address::text, '.', 2)::int AS number,
              CASE WHEN nlevel(t.address) > 2 THEN split_part(t.address::text, '.', 3)::int END AS variant,
              i.book, t.content AS text, count(*) OVER ()::int AS total,
              w.authority_sunni AS authority, a.ordinal
       FROM texts t
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
       JOIN works w ON w.id = v.work_id AND w.category = 'hadith'
       JOIN section_items i ON i.version_id = t.version_id AND i.address = t.address
       JOIN addresses a ON a.address = t.address
       WHERE ${conditions}
       ORDER BY w.authority_sunni NULLS LAST, array_position($${patterns.length + 1}::text[], w.id) NULLS LAST,
                w.id, a.ordinal
       LIMIT ${HADITH_SEARCH_LIMIT}
     ) h
     ORDER BY h.authority NULLS LAST, array_position($${patterns.length + 1}::text[], h.work) NULLS LAST,
              h.work, h.ordinal`,
    [...patterns, COLLECTION_ORDER],
  );
  const hits = rows.map((row) => ({
    work: row.work,
    workTitle: shortTitle(row.workTitle, row.workShort),
    number: row.number,
    variant: row.variant,
    variants: row.variants,
    book: row.book,
    text: row.text,
  }));
  return { hits, total: rows[0]?.total ?? 0 };
}
