import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { bookLabel, bookScheme } from "@/shared/addresses/book-query";
import { db } from "@/shared/db";
import { shortTitle } from "@/modules/hadith";
import { primaryVersion } from "@/modules/hadith/server";
import { BOOK_CATEGORIES, BOOKS_TAG, type BookCategory } from "../library.constants";
import type { BookWork } from "../library.types";

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
