import "server-only";
import { bookPath, formatBookRef, isBook } from "@/lib/book-query";
import { db } from "@/lib/db";
import { formatHadithRef, hadithPath } from "@/lib/hadith-query";
import type { Concept, SourceHit } from "../assistant.types";
import { level, like, MAX_SOURCES, PER_CONCEPT } from "./assistant.sql";

type TextRow = {
  address: string;
  text: string;
  work: string;
  title: string;
  short: string | null;
  sunni: number | null;
  shia: number | null;
  whole?: boolean; // the word stands whole (with its prefixes), not inside another word
};

// Texts of the primary published Arabic versions whose search form has one
// of the patterns: in the Quran, or in the hadith collections (both in the
// trigram index, migration 012).
async function arabicTexts(category: "quran" | "hadith", patterns: string[]): Promise<TextRow[]> {
  if (patterns.length === 0) return [];
  const or = patterns.map((_, i) => `t.search_plain LIKE $${i + 1}`).join(" OR ");
  const versions =
    category === "quran"
      ? `v.work_id = 'quran' AND v.language = 'ar' AND v.kind = 'original'`
      : `v.is_primary AND v.language = 'ar' AND w.category = 'hadith'`;
  // A whole word: at a word start, after the prefixes و ف ب ل ك and the article.
  const whole = patterns.map((_, i) => `t.search_plain ~ ('(^| )[وفبلك]{0,2}(ال)?' || $${patterns.length + i + 1} || '( |$)')`).join(" OR ");
  const { rows } = await db().query<TextRow>(
    `SELECT * FROM (
       SELECT DISTINCT ON (t.address) t.address::text, t.content AS text, w.id AS work, w.titles->>'ru' AS title,
              w.titles->>'ru-short' AS short, w.authority_sunni AS sunni, w.authority_shia AS shia, (${whole}) AS whole
       FROM texts t
       JOIN text_versions v ON v.id = t.version_id AND v.status = 'published'
       JOIN works w ON w.id = v.work_id
       JOIN addresses a ON a.address = t.address AND a.level IN ('ayah', 'hadith', 'narration')
       WHERE (${or}) AND ${versions} AND search_indexed(t.version_id)
       ORDER BY t.address, v.is_primary DESC
       LIMIT ${PER_CONCEPT * 3}
     ) x ORDER BY whole DESC LIMIT ${PER_CONCEPT}`,
    [...patterns.map(like), ...patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))],
  );
  // Where the word stands whole somewhere, the texts with it only inside other words are left out.
  return rows.some((r) => r.whole) ? rows.filter((r) => r.whole) : rows;
}

// Ayahs whose Russian translation has one of the stems.
async function translationAyahs(all: string[]): Promise<string[]> {
  // Short stems ("пост", "убил") meet too many unrelated words of the translation.
  const stems = all.filter((s) => s.length >= 5);
  if (stems.length === 0) return [];
  const or = stems.map((_, i) => `t.search_plain LIKE $${i + 1}`).join(" OR ");
  const { rows } = await db().query<{ address: string }>(
    `SELECT t.address::text FROM texts t
     WHERE t.version_id = (SELECT id FROM text_versions WHERE work_id = 'quran' AND language = 'ru'
                           AND kind = 'translation' AND status = 'published' ORDER BY created_at, id LIMIT 1)
       AND (${or}) AND search_indexed(t.version_id)
     LIMIT ${PER_CONCEPT}`,
    stems.map(like),
  );
  return rows.map((r) => r.address);
}

export async function sources(concepts: Concept[], refs: string[]) {
  const hits = new Map<string, { row?: TextRow; concepts: Set<number> }>();
  const add = (address: string, i: number | null, row?: TextRow) => {
    const hit = hits.get(address) ?? { concepts: new Set<number>() };
    if (row) hit.row = row;
    if (i !== null) hit.concepts.add(i);
    hits.set(address, hit);
  };
  for (const address of refs) add(address, null);
  await Promise.all(
    concepts.map(async (c, i) => {
      const [quran, hadith, ru] = await Promise.all([arabicTexts("quran", c.ar), arabicTexts("hadith", c.ar), translationAyahs(c.ru)]);
      for (const row of [...quran, ...hadith]) add(row.address, i, row);
      for (const address of ru) add(address, i);
    }),
  );
  // Texts of what was found only by reference or by the translation.
  const missing = [...hits.entries()].filter(([, h]) => !h.row).map(([a]) => a);
  if (missing.length) {
    const { rows } = await db().query<TextRow>(
      `SELECT DISTINCT ON (t.address) t.address::text, t.content AS text, w.id AS work, w.titles->>'ru' AS title,
              w.titles->>'ru-short' AS short, w.authority_sunni AS sunni, w.authority_shia AS shia
       FROM texts t JOIN text_versions v ON v.id = t.version_id AND v.status = 'published' AND v.is_primary AND v.language = 'ar'
       JOIN works w ON w.id = v.work_id
       WHERE t.address <@ ANY ($1::extensions.ltree[])
       ORDER BY t.address`,
      [missing],
    );
    for (const row of rows) {
      const top = missing.find((m) => row.address === m || row.address.startsWith(`${m}.`));
      if (top) hits.set(top, { ...hits.get(top)!, row: { ...row, address: top } });
    }
  }
  const quranAddresses = [...hits.keys()].filter((a) => a.startsWith("quran."));
  const [names, translations] = await Promise.all([
    db().query<{ address: string; name: string }>(
      `SELECT a.address::text, s.names->>'translit' AS name FROM addresses a
       JOIN addresses s ON s.address = subpath(a.address, 0, 2) WHERE a.address = ANY ($1::extensions.ltree[])`,
      [quranAddresses],
    ),
    db().query<{ address: string; content: string }>(
      `SELECT t.address::text, t.content FROM texts t
       WHERE t.address = ANY ($1::extensions.ltree[]) AND t.version_id = (SELECT id FROM text_versions
         WHERE work_id = 'quran' AND language = 'ru' AND kind = 'translation' AND status = 'published' ORDER BY created_at, id LIMIT 1)`,
      [quranAddresses],
    ),
  ]);
  const suraName = new Map(names.rows.map((r) => [r.address, r.name]));
  const translation = new Map(translations.rows.map((r) => [r.address, r.content]));
  const all: SourceHit[] = [...hits.entries()].flatMap(([address, h]): SourceHit[] => {
    if (!h.row) return [];
    const work = address.split(".")[0];
    const path = address.split(".").slice(1).map(Number);
    if (work === "quran") {
      return [{
        address,
        label: `${path[0]}:${path[1]}`,
        title: suraName.get(address) ?? "",
        href: `/quran/${path[0]}#${path[0]}-${path[1]}`,
        text: h.row.text,
        translation: translation.get(address) ?? null,
        level: 1,
        concepts: [...h.concepts],
      }];
    }
    return [{
      address,
      label: isBook(work) ? formatBookRef(address) : formatHadithRef(address),
      title: h.row.short ?? h.row.title,
      href: isBook(work) ? bookPath(work, path) : hadithPath(work, path),
      text: h.row.text,
      translation: null,
      level: level(h.row.sunni, h.row.shia),
      concepts: [...h.concepts],
    }];
  });
  // Named references first, then more words of the question matched, then the
  // authority of the source.
  const rank = (s: SourceHit) => [refs.includes(s.address) ? 0 : 1, -s.concepts.length, s.level ?? 99] as const;
  const order = (a: SourceHit, b: SourceHit) => {
    const [x, y] = [rank(a), rank(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || a.address.localeCompare(b.address, "en", { numeric: true });
  };
  return {
    quran: all.filter((s) => s.address.startsWith("quran.")).sort(order).slice(0, MAX_SOURCES),
    hadith: all.filter((s) => !s.address.startsWith("quran.")).sort(order).slice(0, MAX_SOURCES),
  };
}
