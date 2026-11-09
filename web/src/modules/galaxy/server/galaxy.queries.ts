import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { HADITH_TAG } from "@/modules/hadith";
import { BOOK_CATEGORIES } from "@/modules/library";
import { PARALLELS_TAG } from "@/modules/origins";
import { listSuras } from "@/modules/quran/server";
import { TOPICS_TAG } from "@/modules/topics";
import { listPublishedTopics } from "@/modules/topics/server";
import { db } from "@/shared/db";
import { getMessages, plural } from "@/shared/i18n";
import { buildGalaxy, type Line, type Star } from "../galaxy.build";
import { kindOfCategory, MIN_SHARED_TEXTS } from "../galaxy.constants";
import type { Galaxy } from "../galaxy.types";

const t = getMessages().galaxy;
const BOOKS: readonly string[] = BOOK_CATEGORIES;

// Each text of the hadith collections with the book it is in.
const IN_BOOK = `
  SELECT DISTINCT ON (i.address) i.address, v.work_id AS work, i.book
  FROM section_items i JOIN text_versions v ON v.id = i.version_id
  JOIN works w ON w.id = v.work_id
  WHERE v.is_primary AND v.language = 'ar' AND v.status = 'published' AND w.category = 'hadith'`;

// The star an address belongs to: its sura, its book of a hadith collection,
// otherwise its work. ("m" is a row of IN_BOOK joined on the address.)
const STAR_OF = (column: string) => `CASE
  WHEN subpath(${column}, 0, 1)::text = 'quran' THEN 'sura:' || split_part(${column}::text, '.', 2)
  WHEN m.book IS NOT NULL THEN 'book:' || m.work || '.' || m.book
  ELSE 'work:' || subpath(${column}, 0, 1)::text END`;

const texts = (n: number) => plural(n, t.fragments);

// The galaxy of the library: every published work, the suras of the Quran,
// the books of the hadith collections and the published topics; lines are
// only what the data holds (similar hadiths in two books, a topic citing a
// text, a commentary on a sura, a parallel of «Истоки»). Laid out once here.
export async function getGalaxy(): Promise<Galaxy> {
  "use cache";
  cacheTag(HADITH_TAG, TOPICS_TAG, PARALLELS_TAG, "quran");
  cacheLife("hours");
  const [works, suras, topics, books, similar, cites, commentary, parallels] = await Promise.all([
    db().query<{ id: string; canon: string; category: string; title: string; texts: number }>(
      `WITH counts AS (
         SELECT DISTINCT ON (work_id) work_id, n FROM (
           SELECT work_id, level, count(*)::int AS n FROM addresses WHERE status = 'active' GROUP BY 1, 2
         ) x ORDER BY work_id, n DESC
       )
       SELECT w.id, w.canon, w.category, w.titles->>'ru' AS title, coalesce(c.n, 0) AS texts
       FROM works w LEFT JOIN counts c ON c.work_id = w.id
       WHERE w.status = 'published' ORDER BY w.id`,
    ),
    listSuras(),
    listPublishedTopics(),
    db().query<{ work: string; short: string; book: number; title: string; texts: number }>(
      `SELECT v.work_id AS work, coalesce(w.titles->>'ru-short', w.titles->>'ru') AS short, s.book, s.title,
              (SELECT count(*)::int FROM section_items i WHERE i.version_id = v.id AND i.book = s.book) AS texts
       FROM work_sections s JOIN text_versions v ON v.id = s.version_id JOIN works w ON w.id = v.work_id
       WHERE s.kind = 'book' AND w.category = 'hadith' AND w.status = 'published'
         AND v.is_primary AND v.language = 'ar' AND v.status = 'published'
       ORDER BY v.work_id, s.book`,
    ),
    db().query<{ source: string; target: string; count: number }>(
      `WITH m AS (${IN_BOOK})
       SELECT least(x, y) AS source, greatest(x, y) AS target, count(*)::int AS count FROM (
         SELECT 'book:' || a.work || '.' || a.book AS x, 'book:' || b.work || '.' || b.book AS y
         FROM hadith_links l JOIN m a ON a.address = l.a JOIN m b ON b.address = l.b
         WHERE a.work <> b.work
       ) pairs
       GROUP BY 1, 2 HAVING count(*) >= $1`,
      [MIN_SHARED_TEXTS],
    ),
    db().query<{ source: string; target: string; count: number }>(
      `WITH m AS (${IN_BOOK})
       SELECT 'topic:' || t.slug AS source, ${STAR_OF("r.address")} AS target, count(*)::int AS count
       FROM topics t JOIN topic_refs r ON r.topic_id = t.id LEFT JOIN m ON m.address = r.address
       WHERE t.status = 'published'
       GROUP BY 1, 2`,
    ),
    db().query<{ source: string; target: string; count: number }>(
      `SELECT 'work:' || subpath(comment, 0, 1)::text AS source, 'sura:' || split_part(ayah::text, '.', 2) AS target,
              count(*)::int AS count
       FROM commentary_ayahs GROUP BY 1, 2`,
    ),
    db().query<{ source: string; target: string; count: number }>(
      `WITH m AS (${IN_BOOK})
       SELECT ${STAR_OF("i.address")} AS source, 'work:' || subpath(e.address, 0, 1)::text AS target, count(DISTINCT p.id)::int AS count
       FROM parallels p
       JOIN parallel_refs i ON i.parallel_id = p.id AND i.role = 'islam'
       JOIN parallel_refs e ON e.parallel_id = p.id AND e.role = 'external'
       LEFT JOIN m ON m.address = i.address
       WHERE p.status = 'published'
       GROUP BY 1, 2`,
    ),
  ]);

  const stars: Star[] = [
    ...works.rows.map((w) => {
      const kind = kindOfCategory(w.canon, w.category);
      const href =
        kind === "quran" ? "/quran" : kind === "hadith" ? `/hadith/${w.id}` : kind === "external" ? `/external/${w.id}` : BOOKS.includes(w.category) ? `/library/${w.id}` : "/library";
      return { id: `work:${w.id}`, kind, label: w.title, href, hint: `${t.work} · ${texts(w.texts)}`, work: true, texts: w.texts };
    }),
    ...suras.map((s) => ({
      id: `sura:${s.number}`,
      kind: "quran" as const,
      label: `${s.number}. ${s.names.translit}`,
      href: `/quran/${s.number}`,
      hint: `${t.sura} · ${s.names.ar} · ${plural(s.ayahs, t.ayahs)}`,
      work: false,
      texts: s.ayahs,
    })),
    ...books.rows.map((b) => ({
      id: `book:${b.work}.${b.book}`,
      kind: "hadith" as const,
      label: `${b.short} · ${t.book} ${b.book}`,
      href: `/hadith/${b.work}/book/${b.book}`,
      hint: `${b.title} · ${texts(b.texts)}`,
      work: false,
      texts: b.texts,
    })),
    ...topics.map((tp) => ({
      id: `topic:${tp.slug}`,
      kind: "topic" as const,
      label: tp.title,
      href: `/topics/${tp.slug}`,
      hint: tp.question,
      work: false,
      texts: 0,
    })),
  ];
  const lines: Line[] = [
    ...suras.map((s) => ({ source: "work:quran", target: `sura:${s.number}`, kind: "part", count: 1 })),
    ...books.rows.map((b) => ({ source: `work:${b.work}`, target: `book:${b.work}.${b.book}`, kind: "part", count: 1 })),
    ...similar.rows.map((r) => ({ ...r, kind: "similar" })),
    ...cites.rows.map((r) => ({ ...r, kind: "cites" })),
    ...commentary.rows.map((r) => ({ ...r, kind: "commentary" })),
    ...parallels.rows.map((r) => ({ ...r, kind: "parallel" })),
  ];
  return buildGalaxy(stars, lines);
}
