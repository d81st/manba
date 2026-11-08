import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { COLLECTION_ORDER, hadithPath, refLabel, schemeOf } from "@/lib/hadith-query";
import { BOOK_PAGE_SIZE, HADITH_TAG } from "../hadith.constants";
import { shortTitle } from "../hadith.format";
import type { Book, BookChapter, BookHadith, SimilarText } from "../hadith.types";
import { PATH } from "./hadith.sql";
import { primaryVersion } from "./collection.queries";

export async function getBook(workId: string, book: number, page = 1): Promise<Book | null> {
  "use cache";
  cacheTag(HADITH_TAG);
  cacheLife("hours");
  const version = await primaryVersion(workId);
  if (!version) return null;
  const head = await db().query(
    `SELECT title,
            (SELECT max(book) FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book < $2) AS previous,
            (SELECT min(book) FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book > $2) AS next,
            (SELECT count(*)::int FROM section_items WHERE version_id = $1 AND book = $2) AS texts
     FROM work_sections WHERE version_id = $1 AND kind = 'book' AND book = $2`,
    [version.id, book],
  );
  if (!head.rows[0]) return null;
  const pages = Math.max(1, Math.ceil(head.rows[0].texts / BOOK_PAGE_SIZE));
  if (page < 1 || page > pages) return null;
  const chapters = await db().query<Omit<BookChapter, "continued" | "hadiths">>(
    `SELECT chapter AS index, title, intro, unnumbered FROM work_sections
     WHERE version_id = $1 AND kind = 'chapter' AND book = $2 ORDER BY chapter`,
    [version.id, book],
  );
  const hadiths = await db().query<Omit<BookHadith, "similar"> & { chapter: number }>(
    `WITH page AS (
       SELECT i.address, i.chapter, i.numbering, a.ordinal
       FROM section_items i JOIN addresses a ON a.address = i.address
       WHERE i.version_id = $1 AND i.book = $2
       ORDER BY a.ordinal LIMIT $3 OFFSET $4
     ),
     counts AS (
       SELECT subpath(s.address, 0, 2) AS head, count(*)::int AS variants
       FROM section_items s
       WHERE s.version_id = $1 AND subpath(s.address, 0, 2) IN (SELECT subpath(address, 0, 2) FROM page)
       GROUP BY 1
     )
     SELECT p.chapter, ${PATH("p.address")} AS path, c.variants, t.content AS text, p.numbering
     FROM page p
     JOIN counts c ON c.head = subpath(p.address, 0, 2)
     JOIN texts t ON t.address = p.address AND t.version_id = $1
     ORDER BY p.ordinal`,
    [version.id, book, BOOK_PAGE_SIZE, (page - 1) * BOOK_PAGE_SIZE],
  );
  const similar = await similarTexts(hadiths.rows.map((h) => [workId, ...h.path].join(".")));
  // Chapters on this page: those of its texts and the empty ones between
  // them; on the first and last pages also the empty ones before and after.
  const rows = hadiths.rows;
  const first = rows[0]?.chapter ?? 1;
  const last = rows[rows.length - 1]?.chapter ?? Number.MAX_SAFE_INTEGER;
  const startedBefore = page > 1 && rows.length > 0;
  return {
    number: book,
    title: head.rows[0].title,
    previous: head.rows[0].previous,
    next: head.rows[0].next,
    page,
    pages,
    chapters: chapters.rows
      .filter((c) => (c.index >= first || page === 1) && (c.index <= last || page === pages))
      .map((c) => {
        const continued = startedBefore && c.index === first;
        const goesOn = page < pages && c.index === last;
        return {
          ...c,
          intro: continued ? "" : c.intro,
          unnumbered: goesOn ? "" : c.unnumbered,
          continued,
          hadiths: rows
            .filter((h) => h.chapter === c.index)
            .map((h) => ({
              path: h.path,
              variants: h.variants,
              text: h.text,
              numbering: h.numbering,
              similar: similar.get([workId, ...h.path].join(".")) ?? [],
            })),
        };
      }),
  };
}

// Texts of other collections with shared wording, for each address, in the
// order of the collections and of their numbers.
async function similarTexts(addresses: string[]): Promise<Map<string, SimilarText[]>> {
  const result = new Map<string, SimilarText[]>();
  if (addresses.length === 0) return result;
  const { rows } = await db().query<{
    address: string;
    work: string;
    title: string;
    short: string | null;
    path: number[];
    variants: number;
    share: string;
    checked: boolean;
  }>(
    // Pairs a person marked "not the same hadith" are left out; confirmed ones are flagged.
    `WITH page AS (SELECT unnest($1::text[])::extensions.ltree AS address),
     pairs AS (
       SELECT p.address, l.id, l.b AS other, l.share FROM page p JOIN hadith_links l ON l.a = p.address
       UNION ALL
       SELECT p.address, l.id, l.a, l.share FROM page p JOIN hadith_links l ON l.b = p.address
     ),
     verdicts AS (
       SELECT DISTINCT ON (r.link_id) r.link_id, r.verdict FROM hadith_link_reviews r
       WHERE r.link_id IN (SELECT id FROM pairs) ORDER BY r.link_id, r.id DESC
     )
     SELECT x.address::text, w.id AS work, w.titles->>'ru' AS title, w.titles->>'ru-short' AS short,
            ${PATH("x.other")} AS path, x.share::text AS share, coalesce(v.verdict = 'same', false) AS checked,
            CASE WHEN o.level = 'narration' THEN (
              SELECT count(*)::int FROM addresses n
              WHERE n.address <@ subpath(x.other, 0, 2) AND n.level = 'narration'
            ) ELSE 1 END AS variants
     FROM pairs x
     LEFT JOIN verdicts v ON v.link_id = x.id
     JOIN addresses o ON o.address = x.other
     JOIN works w ON w.id = o.work_id
     WHERE v.verdict IS DISTINCT FROM 'different'
     ORDER BY x.address, array_position($2::text[], w.id), o.ordinal`,
    [addresses, COLLECTION_ORDER],
  );
  for (const row of rows) {
    const list = result.get(row.address) ?? [];
    list.push({
      label: `${shortTitle(row.title, row.short)} ${refLabel(schemeOf(row.work), row.path, row.variants)}`,
      href: hadithPath(row.work, row.path),
      share: Number(row.share),
      checked: row.checked,
    });
    result.set(row.address, list);
  }
  return result;
}

// Where a hadith is: the first text at or under its address (a hadith's
// first narration, a chapter's first hadith), with the page of its book.
// A narration the hadith does not have leads to the hadith; for a lone
// number with no text, the nearest numbers.
export async function locateHadith(
  workId: string,
  path: number[],
): Promise<
  | { book: number; page: number; path: number[] }
  | { book: null; before: number | null; after: number | null }
  | null
> {
  const version = await primaryVersion(workId);
  if (!version) return null;
  const found = await db().query<{ book: number; path: number[]; rank: number }>(
    `SELECT i.book, ${PATH("i.address")} AS path,
            (SELECT count(*)::int FROM section_items s JOIN addresses b ON b.address = s.address
             WHERE s.version_id = i.version_id AND s.book = i.book AND b.ordinal < a.ordinal) AS rank
     FROM section_items i JOIN addresses a ON a.address = i.address
     WHERE i.version_id = $1 AND i.address <@ $2::extensions.ltree
     ORDER BY a.ordinal LIMIT 1`,
    [version.id, [workId, ...path].join(".")],
  );
  const hit = found.rows[0];
  if (hit) return { book: hit.book, page: Math.floor(hit.rank / BOOK_PAGE_SIZE) + 1, path: hit.path };
  if (schemeOf(workId) === "narration" && path.length === 2) return locateHadith(workId, path.slice(0, 1));
  if (schemeOf(workId) === "chapter" || path.length > 1) return { book: null, before: null, after: null };
  const near = await db().query<{ before: number | null; after: number | null }>(
    `SELECT max(n) FILTER (WHERE n < $2) AS before, min(n) FILTER (WHERE n > $2) AS after
     FROM (SELECT split_part(address::text, '.', 2)::int AS n FROM section_items WHERE version_id = $1) s`,
    [version.id, path[0]],
  );
  return { book: null, ...near.rows[0] };
}
