import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { bookAnchor, bookLabel } from "@/lib/book-query";
import { db } from "@/lib/db";
import { primaryVersion } from "@/modules/hadith/server";
import { BOOKS_TAG } from "../library.constants";
import type { BookSection } from "../library.types";
import { PAGE_LETTERS, PATH } from "./library.sql";
import { resolveBookRefs } from "./book-refs.queries";

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
