import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export const HADITH_TAG = "hadith";

export type Attribution = { title: string; url: string; license: string; notice: string; version: string };

export type Collection = {
  id: string;
  title: string;
  titleAr: string;
  canon: string;
  versionId: string;
  versionTitle: string;
  verification: string;
  attribution: Attribution;
  hadiths: number;
  books: { number: number; title: string; hadiths: number; first: number | null; last: number | null }[];
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
     ORDER BY w.authority_sunni NULLS LAST, w.id`,
  );
  return rows;
}

export async function getCollection(workId: string): Promise<Collection | null> {
  "use cache";
  cacheTag(HADITH_TAG);
  cacheLife("hours");
  const work = await db().query(
    `SELECT id, titles->>'ru' AS title, titles->>'ar' AS title_ar, canon FROM works
     WHERE id = $1 AND category = 'hadith' AND status = 'published'`,
    [workId],
  );
  const version = await primaryVersion(workId);
  if (!work.rows[0] || !version) return null;
  const books = await db().query(
    `SELECT b.book AS number, b.title,
            count(i.address)::int AS hadiths,
            min(split_part(i.address::text, '.', 2)::int) AS first,
            max(split_part(i.address::text, '.', 2)::int) AS last
     FROM work_sections b
     LEFT JOIN section_items i ON i.version_id = b.version_id AND i.book = b.book
     WHERE b.version_id = $1 AND b.kind = 'book'
     GROUP BY b.book, b.title ORDER BY b.book`,
    [version.id],
  );
  return {
    id: work.rows[0].id,
    title: work.rows[0].title,
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
    hadiths: books.rows.reduce((sum, b) => sum + b.hadiths, 0),
    books: books.rows,
  };
}

export type BookHadith = { number: number; text: string; numbering: string };
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
  const hadiths = await db().query<{ chapter: number; number: number; text: string; numbering: string }>(
    `SELECT i.chapter, split_part(i.address::text, '.', 2)::int AS number, t.content AS text, i.numbering
     FROM section_items i
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
      hadiths: hadiths.rows.filter((h) => h.chapter === c.index),
    })),
  };
}

// Where a hadith number is, or the nearest numbers when the source has none.
export async function locateHadith(
  workId: string,
  number: number,
): Promise<{ book: number } | { book: null; before: number | null; after: number | null } | null> {
  const version = await primaryVersion(workId);
  if (!version) return null;
  const found = await db().query<{ book: number }>(
    "SELECT book FROM section_items WHERE version_id = $1 AND address = $2::extensions.ltree",
    [version.id, `${workId}.${number}`],
  );
  if (found.rows[0]) return { book: found.rows[0].book };
  const near = await db().query<{ before: number | null; after: number | null }>(
    `SELECT max(n) FILTER (WHERE n < $2) AS before, min(n) FILTER (WHERE n > $2) AS after
     FROM (SELECT split_part(address::text, '.', 2)::int AS n FROM section_items WHERE version_id = $1) s`,
    [version.id, number],
  );
  return { book: null, ...near.rows[0] };
}

export type HadithHit = { work: string; workTitle: string; number: number; book: number; text: string };
export const HADITH_SEARCH_LIMIT = 100;

// Hadiths of all published collections whose search form contains every pattern.
export async function searchHadith(
  patterns: string[],
  diacritics: boolean,
): Promise<{ hits: HadithHit[]; total: number }> {
  const column = diacritics ? "t.search_vocalized" : "t.search_plain";
  const conditions = patterns.map((_, i) => `${column} LIKE $${i + 1}`).join(" AND ");
  const { rows } = await db().query<HadithHit & { total: number }>(
    `SELECT w.id AS work, w.titles->>'ru' AS "workTitle", split_part(t.address::text, '.', 2)::int AS number,
            i.book, t.content AS text, count(*) OVER ()::int AS total
     FROM texts t
     JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
     JOIN works w ON w.id = v.work_id AND w.category = 'hadith'
     JOIN section_items i ON i.version_id = t.version_id AND i.address = t.address
     JOIN addresses a ON a.address = t.address
     WHERE ${conditions}
     ORDER BY w.authority_sunni NULLS LAST, w.id, a.ordinal
     LIMIT ${HADITH_SEARCH_LIMIT}`,
    patterns,
  );
  const hits = rows.map((row) => ({
    work: row.work,
    workTitle: row.workTitle,
    number: row.number,
    book: row.book,
    text: row.text,
  }));
  return { hits, total: rows[0]?.total ?? 0 };
}
