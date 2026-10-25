import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { bookAnchor, pageLabel } from "@/lib/book-query";
import { db } from "@/lib/db";
import { type Attribution, primaryVersion, shortTitle } from "@/lib/hadith";

// Books cited by volume and page of their edition (the Sira of Ibn Hisham):
// sections and chapters for reading, pieces of pages as texts.
export const BOOKS_TAG = "books";

const PATH = (column: string) => `string_to_array(subpath(${column}, 1)::text, '.')::int[]`;

export async function listBookWorks(): Promise<{ id: string; title: string; titleAr: string }[]> {
  "use cache";
  cacheTag(BOOKS_TAG);
  cacheLife("hours");
  const { rows } = await db().query(
    `SELECT w.id, w.titles->>'ru' AS title, w.titles->>'ar' AS "titleAr" FROM works w
     WHERE w.category = 'sira' AND w.status = 'published'
       AND EXISTS (SELECT 1 FROM text_versions v WHERE v.work_id = w.id AND v.is_primary AND v.status = 'published')
     ORDER BY w.id`,
  );
  return rows;
}

export type BookWork = {
  id: string;
  title: string;
  shortTitle: string;
  titleAr: string;
  versionTitle: string;
  verification: string;
  attribution: Attribution;
  pages: number;
  volumes: { volume: number; first: number; last: number }[];
  sections: { number: number; title: string; first: string; last: string; chapters: number }[];
};

export async function getBookWork(workId: string): Promise<BookWork | null> {
  "use cache";
  cacheTag(BOOKS_TAG);
  cacheLife("hours");
  const work = await db().query(
    `SELECT id, titles->>'ru' AS title, titles->>'ru-short' AS short, titles->>'ar' AS title_ar FROM works
     WHERE id = $1 AND category = 'sira' AND status = 'published'`,
    [workId],
  );
  const version = await primaryVersion(workId);
  if (!work.rows[0] || !version) return null;
  // Pages a section spans: those of its first and last piece in reading order.
  // (An array of arrays cannot be indexed into one array: addresses as text.)
  const sections = await db().query<{ number: number; title: string; first: string; last: string; chapters: number }>(
    `SELECT b.book AS number, b.title,
            (array_agg(i.address::text ORDER BY a.ordinal))[1] AS first,
            (array_agg(i.address::text ORDER BY a.ordinal DESC))[1] AS last,
            (SELECT count(*)::int FROM work_sections c
             WHERE c.version_id = b.version_id AND c.kind = 'chapter' AND c.book = b.book AND c.title <> '') AS chapters
     FROM work_sections b
     JOIN section_items i ON i.version_id = b.version_id AND i.book = b.book
     JOIN addresses a ON a.address = i.address
     WHERE b.version_id = $1 AND b.kind = 'book'
     GROUP BY b.version_id, b.book, b.title ORDER BY b.book`,
    [version.id],
  );
  const volumes = await db().query<{ volume: number; first: number; last: number; pages: number }>(
    `SELECT split_part(address::text, '.', 2)::int AS volume,
            min(split_part(address::text, '.', 3)::int) AS first, max(split_part(address::text, '.', 3)::int) AS last
     FROM addresses WHERE work_id = $1 AND level = 'page' GROUP BY 1 ORDER BY 1`,
    [workId],
  );
  const page = (address: string) => pageLabel(address.split(".").slice(1, 3).map(Number));
  return {
    id: work.rows[0].id,
    title: work.rows[0].title,
    shortTitle: shortTitle(work.rows[0].title, work.rows[0].short),
    titleAr: work.rows[0].title_ar,
    versionTitle: version.title,
    verification: version.verification,
    attribution: {
      title: version.source_title,
      url: version.url,
      license: version.license,
      notice: version.notice,
      version: version.version,
    },
    pages: volumes.rows.reduce((n, v) => n + v.last - v.first + 1, 0),
    volumes: volumes.rows.map(({ volume, first, last }) => ({ volume, first, last })),
    sections: sections.rows.map((s) => ({
      number: s.number,
      title: s.title,
      first: page(s.first),
      last: page(s.last),
      chapters: s.chapters,
    })),
  };
}

export type BookPiece = { path: number[]; label: string; anchor: string; text: string };
export type BookSection = {
  number: number;
  title: string;
  previous: number | null;
  next: number | null;
  chapters: { index: number; title: string; pieces: BookPiece[] }[];
};

export async function getBookSection(workId: string, section: number): Promise<BookSection | null> {
  "use cache";
  cacheTag(BOOKS_TAG);
  cacheLife("hours");
  const version = await primaryVersion(workId);
  if (!version) return null;
  const head = await db().query(
    `SELECT title,
            (SELECT max(book) FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book < $2) AS previous,
            (SELECT min(book) FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book > $2) AS next
     FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book = $2`,
    [version.id, section],
  );
  if (!head.rows[0]) return null;
  const chapters = await db().query<{ index: number; title: string }>(
    `SELECT chapter AS index, title FROM work_sections
     WHERE version_id = $1 AND kind = 'chapter' AND book = $2 ORDER BY chapter`,
    [version.id, section],
  );
  // Pieces in reading order, with how many pieces their page has (for the letter).
  const pieces = await db().query<{ chapter: number; path: number[]; text: string; pieces: number }>(
    `SELECT i.chapter, ${PATH("i.address")} AS path, t.content AS text,
            (SELECT count(*)::int FROM addresses n
             WHERE n.address <@ subpath(i.address, 0, 3) AND n.level = 'passage') AS pieces
     FROM section_items i
     JOIN addresses a ON a.address = i.address
     JOIN texts t ON t.address = i.address AND t.version_id = i.version_id
     WHERE i.version_id = $1 AND i.book = $2
     ORDER BY a.ordinal`,
    [version.id, section],
  );
  return {
    number: section,
    title: head.rows[0].title,
    previous: head.rows[0].previous,
    next: head.rows[0].next,
    chapters: chapters.rows.map((c) => ({
      ...c,
      pieces: pieces.rows
        .filter((p) => p.chapter === c.index)
        .map((p) => ({ path: p.path, label: pageLabel(p.path, p.pieces), anchor: bookAnchor(p.path), text: p.text })),
    })),
  };
}

// The section of the first piece at or under a page or piece address.
export async function locatePage(workId: string, path: number[]): Promise<{ section: number; path: number[] } | null> {
  const version = await primaryVersion(workId);
  if (!version) return null;
  const { rows } = await db().query<{ section: number; path: number[] }>(
    `SELECT i.book AS section, ${PATH("i.address")} AS path
     FROM section_items i JOIN addresses a ON a.address = i.address
     WHERE i.version_id = $1 AND i.address <@ $2::extensions.ltree
     ORDER BY a.ordinal LIMIT 1`,
    [version.id, [workId, ...path].join(".")],
  );
  return rows[0] ?? null;
}

export const BOOK_SEARCH_LIMIT = 100;
export type BookHit = { path: number[]; label: string; section: number; sectionTitle: string; text: string };

// Pieces of a book whose search form contains every pattern, in reading order.
export async function searchBook(
  workId: string,
  patterns: string[],
  diacritics: boolean,
): Promise<{ hits: BookHit[]; total: number }> {
  const version = await primaryVersion(workId);
  if (!version) return { hits: [], total: 0 };
  const column = diacritics ? "t.search_vocalized" : "t.search_plain";
  const conditions = patterns.map((_, i) => `${column} LIKE $${i + 2}`).join(" AND ");
  const { rows } = await db().query<{
    path: number[];
    pieces: number;
    section: number;
    section_title: string;
    text: string;
    total: number;
  }>(
    `SELECT h.*, ${PATH("h.address")} AS path,
            (SELECT count(*)::int FROM addresses n
             WHERE n.address <@ subpath(h.address, 0, 3) AND n.level = 'passage') AS pieces,
            (SELECT title FROM work_sections s
             WHERE s.version_id = $1 AND s.kind = 'book' AND s.book = h.section) AS section_title
     FROM (
       SELECT t.address, i.book AS section, t.content AS text, a.ordinal, count(*) OVER ()::int AS total
       FROM texts t
       JOIN section_items i ON i.version_id = t.version_id AND i.address = t.address
       JOIN addresses a ON a.address = t.address
       WHERE t.version_id = $1 AND ${conditions}
       ORDER BY a.ordinal
       LIMIT ${BOOK_SEARCH_LIMIT}
     ) h
     ORDER BY h.ordinal`,
    [version.id, ...patterns],
  );
  return {
    total: rows[0]?.total ?? 0,
    hits: rows.map((r) => ({
      path: r.path,
      label: pageLabel(r.path, r.pieces),
      section: r.section,
      sectionTitle: r.section_title,
      text: r.text,
    })),
  };
}
