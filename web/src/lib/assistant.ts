import "server-only";
import { defaultLocale } from "@/i18n";
import { searchKey } from "@/lib/arabic";
import { analyzeQuestion, type Analysis, missKey, namesMatch, stemRu } from "@/lib/assistant-query";
import { bookPath, formatBookRef, isBook } from "@/lib/book-query";
import { db } from "@/lib/db";
import { formatHadithRef, hadithPath } from "@/lib/hadith-query";
import { plainKey } from "@/lib/plain-key";

// «Ассистент по источникам», first phase (docs/PLAN.md, migration 024): the
// words of a question, widened by the glossary and the synonyms, are searched
// in the sources and the encyclopedia; results are ordered by the authority of
// the source, then by how many words of the question they match. The
// assistant writes no text: every result is a fragment or a page of the site.

const LOCALE = defaultLocale;
const PER_CONCEPT = 40;
const MAX_SOURCES = 30;

// One subject of the question: its words to search for in Arabic and in Russian.
export type Concept = { label: string; ar: string[]; ru: string[]; from: string[] };

export type SourceHit = {
  address: string;
  label: string; // "2:255", "аль-Бухари 1"
  title: string; // sura or collection
  href: string;
  text: string;
  translation: string | null;
  level: number | null; // authority: 1 — the Quran
  concepts: number[]; // indexes of the concepts it matches
};

export type PageHit = { kind: "term" | "topic" | "history" | "sira" | "quiz"; title: string; href: string; hint: string; concepts: number[] };

export type GraphEdge = { from: string; to: string };

export type AssistantResult = {
  analysis: Analysis;
  concepts: Concept[];
  quran: SourceHit[];
  hadith: SourceHit[];
  pages: PageHit[];
  edges: GraphEdge[]; // between pages (term:slug, topic:slug) and sources (address)
};

const like = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// The subjects of the question, widened by the glossary (Russian name or
// transliteration -> Arabic) and the moderator's synonyms.
async function concepts(analysis: Analysis): Promise<{ concepts: Concept[]; terms: { slug: string; title: string; index: number }[] }> {
  const list: Concept[] = analysis.words.map((w) =>
    w.script === "ar" ? { label: w.text, ar: [w.key], ru: [], from: [] } : { label: w.text, ar: [], ru: [w.key], from: [] },
  );
  const terms: { slug: string; title: string; index: number }[] = [];
  if (analysis.words.length === 0) return { concepts: list, terms };
  const [termRows, synonymRows] = await Promise.all([
    db().query<{ slug: string; arabic: string; translit: string; title: string }>(
      `SELECT m.slug, m.arabic, m.transliteration AS translit, x.translation AS title
       FROM terms m JOIN term_texts x ON x.term_id = m.id AND x.locale = $1 WHERE m.status = 'published'`,
      [LOCALE],
    ),
    db().query<{ phrase: string; forms: string[] }>("SELECT phrase, forms FROM assistant_synonyms"),
  ]);
  const at = (name: string) => {
    // The concept of the first question word that the name matches.
    const i = analysis.words.findIndex((w) => namesMatch(name, [w]));
    return i >= 0 ? i : analysis.words.findIndex(() => namesMatch(name, analysis.words));
  };
  for (const term of termRows.rows) {
    const arKey = searchKey(term.arabic);
    let i = [term.title, term.translit].map(at).find((x) => x >= 0) ?? -1;
    if (i < 0) i = analysis.words.findIndex((w) => w.script === "ar" && w.key.length >= 3 && arKey.includes(w.key));
    if (i < 0) continue;
    if (arKey.length >= 3 && !list[i].ar.includes(arKey)) list[i].ar.push(arKey);
    list[i].from.push(`term:${term.slug}`);
    terms.push({ slug: term.slug, title: term.title, index: i });
  }
  for (const synonym of synonymRows.rows) {
    const i = at(synonym.phrase);
    if (i < 0) continue;
    for (const form of synonym.forms) {
      if (/[؀-ۿ]/.test(form)) {
        const key = searchKey(form);
        if (key.length >= 3 && !list[i].ar.includes(key)) list[i].ar.push(key);
      } else {
        for (const word of plainKey(form).split(" ").filter((w) => w.length >= 3)) {
          const stem = stemRu(word);
          if (!list[i].ru.includes(stem)) list[i].ru.push(stem);
        }
      }
    }
  }
  return { concepts: list, terms };
}

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

const level = (sunni: number | null, shia: number | null) => {
  const known = [sunni, shia].filter((x): x is number => x !== null);
  return known.length ? Math.min(...known) : null;
};

async function sources(concepts: Concept[], refs: string[]) {
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

// Pages of the encyclopedia whose title (or question) has a word of the question.
async function pages(concepts: Concept[], terms: { slug: string; title: string; index: number }[]): Promise<PageHit[]> {
  const found = new Map<string, PageHit>();
  const add = (hit: Omit<PageHit, "concepts">, i: number) => {
    const old = found.get(hit.href);
    if (old) {
      if (!old.concepts.includes(i)) old.concepts.push(i);
    } else found.set(hit.href, { ...hit, concepts: [i] });
  };
  for (const t of terms) add({ kind: "term", title: t.title, href: `/glossary/${t.slug}`, hint: "" }, t.index);
  await Promise.all(
    concepts.map(async (c, i) => {
      const stems = c.ru.filter((s) => s.length >= 3);
      if (stems.length === 0) return;
      const patterns = stems.map(like);
      const any = (column: string, from: number) => stems.map((_, k) => `${column} ILIKE $${from + k}`).join(" OR ");
      const [topics, history, sira, quiz] = await Promise.all([
        db().query<{ slug: string; title: string; question: string }>(
          `SELECT t.slug, x.title, x.question FROM topics t JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1
           WHERE t.status = 'published' AND (${any("x.title", 2)} OR ${any("x.question", 2)}) LIMIT 20`,
          [LOCALE, ...patterns],
        ),
        db().query<{ slug: string; title: string }>(
          `SELECT e.slug, x.title FROM history_events e JOIN history_event_texts x ON x.event_id = e.id AND x.locale = $1
           WHERE e.status = 'published' AND (${any("x.title", 2)}) LIMIT 20`,
          [LOCALE, ...patterns],
        ),
        db().query<{ slug: string; title: string }>(
          `SELECT e.slug, x.title FROM sira_events e JOIN sira_event_texts x ON x.event_id = e.id AND x.locale = $1
           WHERE e.status = 'published' AND (${any("x.title", 2)}) LIMIT 20`,
          [LOCALE, ...patterns],
        ),
        db().query<{ id: number; prompt: string }>(
          `SELECT q.id::int, x.prompt FROM quiz_questions q JOIN quiz_question_texts x ON x.question_id = q.id AND x.locale = $1
           WHERE q.status = 'published' AND (${any("x.prompt", 2)}) LIMIT 10`,
          [LOCALE, ...patterns],
        ),
      ]);
      for (const r of topics.rows) add({ kind: "topic", title: r.title, href: `/topics/${r.slug}`, hint: r.question }, i);
      for (const r of history.rows) add({ kind: "history", title: r.title, href: `/history#${r.slug}`, hint: "" }, i);
      for (const r of sira.rows) add({ kind: "sira", title: r.title, href: `/sira/events/${r.slug}`, hint: "" }, i);
      for (const r of quiz.rows) add({ kind: "quiz", title: r.prompt, href: `/tests#q-${r.id}`, hint: "" }, i);
    }),
  );
  const order = { term: 0, topic: 1, history: 2, sira: 3, quiz: 4 };
  return [...found.values()].sort((a, b) => b.concepts.length - a.concepts.length || order[a.kind] - order[b.kind]);
}

// Links between what was found: a term or a topic and the fragments it cites.
async function edges(pageHits: PageHit[], addresses: string[]): Promise<GraphEdge[]> {
  if (addresses.length === 0) return [];
  const termSlugs = pageHits.filter((p) => p.kind === "term").map((p) => p.href.split("/").pop()!);
  const topicSlugs = pageHits.filter((p) => p.kind === "topic").map((p) => p.href.split("/").pop()!);
  const { rows } = await db().query<{ from: string; to: string }>(
    `SELECT DISTINCT 'term:' || m.slug AS from, r.address::text AS to FROM term_refs r JOIN terms m ON m.id = r.term_id
     WHERE m.slug = ANY ($1) AND r.address::text = ANY ($3)
     UNION
     SELECT DISTINCT 'topic:' || t.slug, r.address::text FROM topic_refs r JOIN topics t ON t.id = r.topic_id
     WHERE t.slug = ANY ($2) AND r.address::text = ANY ($3)`,
    [termSlugs, topicSlugs, addresses],
  );
  return rows;
}

export async function ask(question: string): Promise<AssistantResult> {
  const analysis = analyzeQuestion(question);
  const { concepts: list, terms } = await concepts(analysis);
  const [{ quran, hadith }, pageHits] = await Promise.all([sources(list, analysis.refs), pages(list, terms)]);
  const graphEdges = await edges(pageHits, [...quran, ...hadith].map((s) => s.address));
  return { analysis, concepts: list, quran, hadith, pages: pageHits, edges: graphEdges };
}

// Counts a question with no answer by its words only (migration 024).
export async function recordMiss(analysis: Analysis) {
  const key = missKey(analysis);
  if (!key) return;
  await db().query(
    `INSERT INTO assistant_misses (words) VALUES ($1)
     ON CONFLICT (words) DO UPDATE SET count = assistant_misses.count + 1, last_month = date_trunc('month', now())::date`,
    [key],
  );
}

// ============ Admin ============

export type Synonym = { id: number; phrase: string; forms: string[]; note: string };

export async function listSynonyms(): Promise<Synonym[]> {
  const { rows } = await db().query<Synonym>("SELECT id::int, phrase, forms, note FROM assistant_synonyms ORDER BY phrase");
  return rows;
}

export async function listMisses(): Promise<{ words: string; count: number; lastMonth: string }[]> {
  const { rows } = await db().query(
    `SELECT words, count, to_char(last_month, 'MM.YYYY') AS "lastMonth" FROM assistant_misses ORDER BY count DESC, words LIMIT 100`,
  );
  return rows;
}

export async function saveSynonym(id: number | null, input: { phrase: string; forms: string[]; note: string }, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const taken = await client.query("SELECT 1 FROM assistant_synonyms WHERE phrase = $1 AND id IS DISTINCT FROM $2", [input.phrase, id]);
    if (taken.rowCount) {
      await client.query("ROLLBACK");
      return { problems: [{ field: "phrase", code: "phraseTaken" }] };
    }
    const before = id ? (await client.query("SELECT phrase, forms, note FROM assistant_synonyms WHERE id = $1", [id])).rows[0] : null;
    let synonymId = id;
    if (id) {
      await client.query("UPDATE assistant_synonyms SET phrase = $2, forms = $3, note = $4, updated_by = $5, updated_at = now() WHERE id = $1", [
        id,
        input.phrase,
        input.forms,
        input.note,
        actor,
      ]);
    } else {
      synonymId = (
        await client.query(
          "INSERT INTO assistant_synonyms (phrase, forms, note, created_by, updated_by) VALUES ($1, $2, $3, $4, $4) RETURNING id::int",
          [input.phrase, input.forms, input.note, actor],
        )
      ).rows[0].id;
    }
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('assistant_synonym', $1, $2, $3, $4, '', $5)`,
      [String(synonymId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(input), actor],
    );
    await client.query("COMMIT");
    return { problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSynonym(id: number, actor: string) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const before = (await client.query("DELETE FROM assistant_synonyms WHERE id = $1 RETURNING phrase, forms, note", [id])).rows[0];
    if (before) {
      await client.query(
        `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
         VALUES ('assistant_synonym', $1, 'deleted', $2, NULL, '', $3)`,
        [String(id), JSON.stringify(before), actor],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
