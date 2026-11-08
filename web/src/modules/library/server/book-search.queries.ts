import "server-only";
import { bookLabel } from "@/shared/addresses/book-query";
import { db } from "@/shared/db";
import { matchConditions } from "@/shared/text/search-sql";
import { primaryVersion } from "@/modules/hadith/server";
import { BOOK_SEARCH_LIMIT } from "../library.constants";
import type { BookHit } from "../library.types";
import { PATH } from "./library.sql";

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
