import "server-only";
import { db } from "@/lib/db";
import { EXTERNAL_WORKS, type ExternalWork, externalBook } from "@/lib/external";

// Reading the texts of other religions: the books of a work with their
// chapters, and a chapter with its original and translation side by side.

export async function getExternalContents(work: ExternalWork) {
  const { rows } = await db().query<{ book: number; chapters: number }>(
    `SELECT split_part(address::text, '.', 2)::int AS book, count(*)::int AS chapters
     FROM addresses WHERE work_id = $1 AND level = 'chapter' GROUP BY 1 ORDER BY 1`,
    [work],
  );
  return rows.flatMap((r) => {
    const book = externalBook(work, r.book);
    return book ? [{ ...book, chapters: r.chapters }] : [];
  });
}

export type ExternalVerse = { n: number; address: string; original: string; translation: string };

export async function getExternalChapter(work: ExternalWork, book: number, chapter: number) {
  const prefix = `${work}.${book}.${chapter}`;
  const [texts, chapters] = await Promise.all([
    db().query<{ address: string; kind: string; content: string }>(
      `SELECT t.address::text, v.kind, t.content
       FROM addresses a
       JOIN texts t ON t.address = a.address
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published'
       WHERE a.address <@ $1::extensions.ltree AND a.level <> 'chapter'
       ORDER BY a.ordinal`,
      [prefix],
    ),
    db().query<{ n: number }>(
      `SELECT split_part(address::text, '.', 3)::int AS n FROM addresses
       WHERE work_id = $1 AND level = 'chapter' AND subpath(address, 0, 2) = $2::extensions.ltree`,
      [work, `${work}.${book}`],
    ),
  ]);
  const verses = new Map<string, ExternalVerse>();
  for (const r of texts.rows) {
    const verse = verses.get(r.address) ?? { n: Number(r.address.split(".")[3]), address: r.address, original: "", translation: "" };
    if (r.kind === "original") verse.original = r.content;
    else verse.translation = r.content;
    verses.set(r.address, verse);
  }
  const numbers = chapters.rows.map((r) => r.n).sort((a, b) => a - b);
  if (verses.size === 0) return null;
  return {
    verses: [...verses.values()],
    chapters: numbers.length,
    previous: numbers.includes(chapter - 1) ? chapter - 1 : null,
    next: numbers.includes(chapter + 1) ? chapter + 1 : null,
    hasTranslation: [...verses.values()].some((v) => v.translation),
    dir: EXTERNAL_WORKS[work].dir,
    language: EXTERNAL_WORKS[work].language,
  };
}
