import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { COLLECTION_ORDER, hadithPath, refLabel, type Scheme, schemeOf } from "@/lib/hadith-query";

export const HADITH_TAG = "hadith";

// Name before a number: "Абу Дауд 12". Works loaded before short names were
// stored drop the "Сахих".
export function shortTitle(title: string, short: string | null) {
  return short ?? title.replace(/^Сахих /, "");
}

export type Attribution = { title: string; url: string; license: string; notice: string; version: string };

export type Collection = {
  id: string;
  title: string;
  shortTitle: string;
  titleAr: string;
  canon: string;
  scheme: Scheme;
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

// A text of another collection with shared wording, found automatically
// (data/sources/links/README.md): a measure, not a claim of one hadith.
export type SimilarText = { label: string; href: string; share: number; checked: boolean };

export type BookHadith = {
  path: number[]; // the address after the work id: [3951], [8, 2], [4, 60, 3]
  variants: number; // texts under the same first number in the whole collection
  text: string;
  numbering: string;
  similar: SimilarText[];
};
export type BookChapter = {
  index: number;
  title: string;
  intro: string;
  unnumbered: string;
  continued: boolean; // began on an earlier page: its heading is repeated, its intro is not
  hadiths: BookHadith[];
};
export type Book = {
  number: number;
  title: string;
  chapters: BookChapter[];
  previous: number | null;
  next: number | null;
  page: number;
  pages: number;
};

// Long books are read in pages of this many texts (the largest part of the
// Musnad has over eleven thousand).
export const BOOK_PAGE_SIZE = 200;

// The address after the work id, as numbers.
const PATH = (column: string) => `string_to_array(subpath(${column}, 1)::text, '.')::int[]`;

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

// Link to a page of a book, with the anchor of a hadith on it.
export function bookPageHref(work: string, book: number, page = 1, anchor?: string) {
  return `/hadith/${work}/book/${book}${page > 1 ? `?page=${page}` : ""}${anchor ? `#${anchor}` : ""}`;
}

export type HadithHit = {
  work: string;
  workTitle: string; // short name: "Абу Дауд"
  path: number[];
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
  const order = `$${patterns.length + 1}::text[]`;
  const { rows } = await db().query<HadithHit & { total: number; workShort: string | null }>(
    `SELECT h.*, ${PATH("h.address")} AS path,
            (SELECT count(*)::int FROM section_items s
             WHERE s.version_id = h.version_id AND s.address <@ subpath(h.address, 0, 2)) AS variants
     FROM (
       SELECT w.id AS work, w.titles->>'ru' AS "workTitle", w.titles->>'ru-short' AS "workShort",
              t.version_id, t.address, i.book, t.content AS text, count(*) OVER ()::int AS total,
              w.authority_sunni AS authority, a.ordinal
       FROM texts t
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
       JOIN works w ON w.id = v.work_id AND w.category = 'hadith'
       JOIN section_items i ON i.version_id = t.version_id AND i.address = t.address
       JOIN addresses a ON a.address = t.address
       WHERE ${conditions}
       ORDER BY w.authority_sunni NULLS LAST, array_position(${order}, w.id) NULLS LAST, w.id, a.ordinal
       LIMIT ${HADITH_SEARCH_LIMIT}
     ) h
     ORDER BY h.authority NULLS LAST, array_position(${order}, h.work) NULLS LAST, h.work, h.ordinal`,
    [...patterns, COLLECTION_ORDER],
  );
  const hits = rows.map((row) => ({
    work: row.work,
    workTitle: shortTitle(row.workTitle, row.workShort),
    path: row.path,
    variants: row.variants,
    book: row.book,
    text: row.text,
  }));
  return { hits, total: rows[0]?.total ?? 0 };
}

// A hadith referred to from a topic or a term: its text, or the texts under
// it (the narrations of a number), the first few of them.
export type HadithRef = {
  address: string;
  title: string; // "Муслим 8"
  href: string;
  items: { label: string; text: string }[]; // label only when there are several
  more: number; // texts under it not shown
};
const REF_ITEMS = 10;

export async function getHadithRefs(addresses: string[]): Promise<Map<string, HadithRef>> {
  const refs = new Map<string, HadithRef>();
  if (addresses.length === 0) return refs;
  const { rows } = await db().query<{
    ref: string;
    title: string;
    short: string | null;
    path: number[];
    variants: number;
    text: string;
    total: number;
  }>(
    // One lookup per reference: joined as a whole, the planner scanned every
    // hadith text (seconds for a topic with a hundred references).
    `SELECT r.ref, w.titles->>'ru' AS title, w.titles->>'ru-short' AS short,
            ${PATH("x.address")} AS path, x.content AS text, x.total,
            CASE WHEN x.level = 'narration' THEN (
              SELECT count(*)::int FROM addresses n
              WHERE n.address <@ subpath(x.address, 0, 2) AND n.level = 'narration'
            ) ELSE 1 END AS variants
     FROM unnest($1::text[]) AS r(ref)
     CROSS JOIN LATERAL (
       SELECT a.address, a.level, a.ordinal, t.content, v.work_id, count(*) OVER ()::int AS total
       FROM addresses a
       JOIN texts t ON t.address = a.address
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
       WHERE a.address <@ r.ref::extensions.ltree
       ORDER BY a.ordinal LIMIT ${REF_ITEMS}
     ) x
     JOIN works w ON w.id = x.work_id AND w.category = 'hadith'
     ORDER BY r.ref, x.ordinal`,
    [addresses],
  );
  for (const row of rows) {
    const [work, ...rest] = row.ref.split(".");
    const scheme = schemeOf(work);
    let ref = refs.get(row.ref);
    if (!ref) {
      const path = rest.map(Number);
      ref = {
        address: row.ref,
        title: `${shortTitle(row.title, row.short)} ${refLabel(scheme, path)}`,
        href: hadithPath(work, path),
        items: [],
        more: row.total - Math.min(row.total, REF_ITEMS),
      };
      refs.set(row.ref, ref);
    }
    const several = row.total > 1;
    ref.items.push({ label: several ? refLabel(scheme, row.path, row.variants) : "", text: row.text });
  }
  return refs;
}
