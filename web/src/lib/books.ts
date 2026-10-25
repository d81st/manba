import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { bookAnchor, bookLabel, bookScheme } from "@/lib/book-query";
import { db } from "@/lib/db";
import { matchConditions } from "@/lib/search-sql";
import { type Attribution, primaryVersion, shortTitle } from "@/lib/hadith";

// Books with their own references (docs/ADDRESSES.md): the Sira of Ibn Hisham,
// Kitab al-Sab'a and Ansab al-ashraf by volume and page, the Tafsir of Ibn
// Kathir by surah and ayah. Sections
// and chapters for reading; pieces of pages or comments on ayahs as texts.
export const BOOKS_TAG = "books";

const PATH = (column: string) => `string_to_array(subpath(${column}, 1)::text, '.')::int[]`;

export const BOOK_CATEGORIES = ["sira", "tafsir", "qiraat", "history"] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export async function listBookWorks(): Promise<{ id: string; title: string; titleAr: string; category: BookCategory }[]> {
  "use cache";
  cacheTag(BOOKS_TAG);
  cacheLife("hours");
  const { rows } = await db().query(
    `SELECT w.id, w.titles->>'ru' AS title, w.titles->>'ar' AS "titleAr", w.category FROM works w
     WHERE w.category = ANY($1::text[]) AND w.status = 'published'
       AND EXISTS (SELECT 1 FROM text_versions v WHERE v.work_id = w.id AND v.is_primary AND v.status = 'published')
     ORDER BY w.id`,
    [BOOK_CATEGORIES],
  );
  return rows;
}

export type BookWork = {
  id: string;
  category: BookCategory;
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
    `SELECT id, category, titles->>'ru' AS title, titles->>'ru-short' AS short, titles->>'ar' AS title_ar FROM works
     WHERE id = $1 AND category = ANY($2::text[]) AND status = 'published'`,
    [workId, BOOK_CATEGORIES],
  );
  const version = await primaryVersion(workId);
  if (!work.rows[0] || !version) return null;
  // Pages a section spans: those of its first and last piece in reading order.
  // (An array of arrays cannot be indexed into one array: addresses as text.)
  const sections = await db().query<{ number: number; title: string; first: string; last: string; chapters: number }>(
    // A surah whose heading the export lost takes its name from the Quran.
    `SELECT b.book AS number,
            CASE WHEN b.title = '' AND $2 = 'tafsir' AND b.book > 0
              THEN (SELECT q.names->>'ar' FROM addresses q WHERE q.address = ('quran.' || b.book)::extensions.ltree)
              ELSE b.title END AS title,
            (array_agg(i.address::text ORDER BY a.ordinal))[1] AS first,
            (array_agg(i.address::text ORDER BY a.ordinal DESC))[1] AS last,
            (SELECT count(*)::int FROM work_sections c
             WHERE c.version_id = b.version_id AND c.kind = 'chapter' AND c.book = b.book AND c.title <> '') AS chapters
     FROM work_sections b
     JOIN section_items i ON i.version_id = b.version_id AND i.book = b.book
     JOIN addresses a ON a.address = i.address
     WHERE b.version_id = $1 AND b.kind = 'book'
     GROUP BY b.version_id, b.book, b.title ORDER BY b.book`,
    [version.id, work.rows[0].category],
  );
  const volumes = await db().query<{ volume: number; first: number; last: number; pages: number }>(
    `SELECT split_part(address::text, '.', 2)::int AS volume,
            min(split_part(address::text, '.', 3)::int) AS first, max(split_part(address::text, '.', 3)::int) AS last
     FROM addresses WHERE work_id = $1 AND level = 'page' GROUP BY 1 ORDER BY 1`,
    [workId],
  );
  // A section of the Sira spans pages; a surah of a tafsir, comments.
  const page = (address: string) =>
    bookLabel(workId, address.split(".").slice(1, bookScheme(workId) === "page" ? 3 : 2).map(Number));
  return {
    id: work.rows[0].id,
    category: work.rows[0].category,
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

// ayahs: in a tafsir, the ayahs the comment covers (empty elsewhere).
export type BookPiece = { path: number[]; label: string; anchor: string; text: string; ayahs: number[] };
export type BookSection = {
  number: number;
  title: string;
  previous: number | null;
  next: number | null;
  page: number;
  pages: number;
  chapters: { index: number; title: string; pieces: BookPiece[] }[];
};

// Long sections (a surah of a tafsir runs to a million letters) are read in
// pages of about this many letters; a text is never cut.
const PAGE_LETTERS = 80_000;

// The page of each text of a section, in reading order.
async function sectionLayout(versionId: string, section: number) {
  const { rows } = await db().query<{ address: string; letters: number }>(
    `SELECT i.address::text, length(t.content) AS letters
     FROM section_items i
     JOIN addresses a ON a.address = i.address
     JOIN texts t ON t.address = i.address AND t.version_id = i.version_id
     WHERE i.version_id = $1 AND i.book = $2
     ORDER BY a.ordinal`,
    [versionId, section],
  );
  let page = 1;
  let used = 0;
  return rows.map((r) => {
    if (used > 0 && used + r.letters > PAGE_LETTERS) {
      page += 1;
      used = 0;
    }
    used += r.letters;
    return { address: r.address, page };
  });
}

export async function getBookSection(workId: string, section: number, page = 1): Promise<BookSection | null> {
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
  const layout = await sectionLayout(version.id, section);
  const pages = Math.max(1, layout[layout.length - 1]?.page ?? 1);
  if (page < 1 || page > pages) return null;
  const onPage = layout.filter((l) => l.page === page).map((l) => l.address);
  const chapters = await db().query<{ index: number; title: string }>(
    `SELECT chapter AS index, title FROM work_sections
     WHERE version_id = $1 AND kind = 'chapter' AND book = $2 ORDER BY chapter`,
    [version.id, section],
  );
  // Pieces in reading order, with how many pieces their page has (for the letter).
  const pieces = await db().query<{ chapter: number; path: number[]; text: string; pieces: number; ayahs: number[] }>(
    `SELECT i.chapter, ${PATH("i.address")} AS path, t.content AS text,
            (SELECT count(*)::int FROM addresses n
             WHERE n.address <@ subpath(i.address, 0, 3) AND n.level = 'passage') AS pieces,
            coalesce((SELECT array_agg(split_part(c.ayah::text, '.', 3)::int ORDER BY split_part(c.ayah::text, '.', 3)::int)
                      FROM commentary_ayahs c WHERE c.comment = i.address), '{}') AS ayahs
     FROM section_items i
     JOIN addresses a ON a.address = i.address
     JOIN texts t ON t.address = i.address AND t.version_id = i.version_id
     WHERE i.version_id = $1 AND i.book = $2 AND i.address::text = ANY($3::text[])
     ORDER BY a.ordinal`,
    [version.id, section, onPage],
  );
  const shown = new Set(pieces.rows.map((p) => p.chapter));
  return {
    number: section,
    title: head.rows[0].title,
    previous: head.rows[0].previous,
    next: head.rows[0].next,
    page,
    pages,
    chapters: chapters.rows.filter((c) => shown.has(c.index)).map((c) => ({
      ...c,
      pieces: pieces.rows
        .filter((p) => p.chapter === c.index)
        .map((p) => ({
          path: p.path,
          label: bookLabel(workId, p.path, p.pieces),
          anchor: bookAnchor(p.path),
          text: p.text,
          ayahs: p.ayahs,
        })),
    })),
  };
}

// The section of the first text at or under an address; in a tafsir, an
// ayah inside a comment's range leads to that comment.
export async function locatePage(
  workId: string,
  path: number[],
): Promise<{ section: number; page: number; path: number[] } | null> {
  const version = await primaryVersion(workId);
  if (!version) return null;
  const [address] = await resolveBookRefs(db(), [[workId, ...path].join(".")]);
  const { rows } = await db().query<{ section: number; path: number[]; address: string }>(
    `SELECT i.book AS section, ${PATH("i.address")} AS path, i.address::text
     FROM section_items i JOIN addresses a ON a.address = i.address
     WHERE i.version_id = $1 AND i.address <@ $2::extensions.ltree
     ORDER BY a.ordinal LIMIT 1`,
    [version.id, address],
  );
  const found = rows[0];
  if (!found) return null;
  const layout = await sectionLayout(version.id, found.section);
  return { section: found.section, path: found.path, page: layout.find((l) => l.address === found.address)?.page ?? 1 };
}

// A section page: /library/tafsir_ibn_kathir/s/2?page=3#p-2-255
export function sectionHref(work: string, section: number, page = 1, anchor?: string) {
  return `/library/${work}/s/${section}${page > 1 ? `?page=${page}` : ""}${anchor ? `#${anchor}` : ""}`;
}

// "Ибн Касир 2:64" names an ayah that the comment 2:63 covers: such
// references become the comment's address. Others are left as they are.
export async function resolveBookRefs(
  client: { query: (sql: string, params: unknown[]) => Promise<{ rows: { a: string; to: string }[] }> },
  addresses: string[],
): Promise<string[]> {
  const ayahRefs = addresses.filter((a) => {
    const [work, ...path] = a.split(".");
    return bookScheme(work) === "ayah" && path.length === 2 && Number(path[0]) > 0 && Number(path[1]) > 0;
  });
  if (ayahRefs.length === 0) return addresses;
  const { rows } = await client.query(
    `SELECT r.a, (
       SELECT c.comment::text FROM commentary_ayahs c JOIN addresses k ON k.address = c.comment
       WHERE c.comment <@ subpath(r.a::extensions.ltree, 0, 1)
         AND c.ayah = ('quran.' || subpath(r.a::extensions.ltree, 1)::text)::extensions.ltree
       ORDER BY k.ordinal LIMIT 1
     ) AS to
     FROM unnest($1::text[]) AS r(a)
     WHERE NOT EXISTS (SELECT 1 FROM addresses x WHERE x.address = r.a::extensions.ltree)`,
    [ayahRefs],
  );
  const map = new Map(rows.filter((r) => r.to).map((r) => [r.a, r.to]));
  return [...new Set(addresses.map((a) => map.get(a) ?? a))];
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
  const match = matchConditions("t", patterns, diacritics, 2);
  const conditions = match.sql;
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
    [version.id, ...match.params],
  );
  return {
    total: rows[0]?.total ?? 0,
    hits: rows.map((r) => ({
      path: r.path,
      label: bookLabel(workId, r.path, r.pieces),
      section: r.section,
      sectionTitle: r.section_title,
      text: r.text,
    })),
  };
}
