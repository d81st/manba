// Loads bundled source files into the library: once per source version.
// Runs before the site starts, after the migrations. A load that already
// happened (same import_batches.key) is skipped, so restarts change nothing.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { searchKey } from "../src/lib/arabic.ts";
import { type Numbering, parseOpenitiHadith } from "../src/lib/import/openiti-hadith.ts";
import { parseOpenitiNarrations } from "../src/lib/import/openiti-narrations.ts";
import { parseTanzil } from "../src/lib/import/tanzil.ts";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "sources");
const ACTOR = "import:tanzil";
const RETRIEVED_AT = "2026-10-17";

// pg sends JS arrays as Postgres arrays, so JSON values go as strings.
const json = (value: unknown) => JSON.stringify(value);

async function importTanzil(client: pg.Client) {
  const dir = join(DATA_DIR, "tanzil");
  const data = parseTanzil(
    readFileSync(join(dir, "quran-uthmani.xml"), "utf8"),
    readFileSync(join(dir, "quran-data.xml"), "utf8"),
  );
  const key = `tanzil:quran-uthmani:${data.textVersion}`;

  const done = await client.query("SELECT 1 FROM import_batches WHERE key = $1", [key]);
  if (done.rowCount) {
    console.log(`Import skipped: ${key} is already loaded.`);
    return;
  }

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO sources (id, title, url, license, license_text, version, retrieved_at) VALUES
         ('tanzil.quran-uthmani', 'Tanzil Quran Text (Uthmani)', 'https://tanzil.net', 'CC BY 3.0', $1, $2, $5),
         ('tanzil.quran-data', 'Tanzil Quran Metadata', 'https://tanzil.net/docs/quran_metadata', 'CC BY', $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [data.notice, data.textVersion, data.metaNotice, data.metaVersion, RETRIEVED_AT],
    );
    const batch = await client.query(
      `INSERT INTO import_batches (key, source_id, actor, summary)
       VALUES ($1, 'tanzil.quran-uthmani', $2, $3) RETURNING id`,
      [
        key,
        ACTOR,
        json({ suras: data.suras.length, segments: data.segments.length, divisions: data.divisions.length }),
      ],
    );
    const batchId = batch.rows[0].id;

    await client.query(
      `INSERT INTO works (id, canon, category, titles, levels, authority_sunni, authority_shia, status)
       VALUES ('quran', 'common', 'quran', $1, $2, 1, 1, 'published')
       ON CONFLICT (id) DO NOTHING`,
      [
        json({ ar: "القرآن الكريم", ru: "Коран" }),
        json([
          { key: "sura", names: { ar: "سورة", ru: "сура" } },
          { key: "ayah", names: { ar: "آية", ru: "аят" } },
        ]),
      ],
    );

    // Containers: one address per sura.
    await client.query(
      `INSERT INTO addresses (address, work_id, level, names, batch_id)
       SELECT a::extensions.ltree, 'quran', 'sura', n, $3
       FROM unnest($1::text[], $2::jsonb[]) AS t(a, n)`,
      [data.suras.map((s) => s.address), data.suras.map((s) => JSON.stringify(s.names)), batchId],
    );
    // Citable segments: basmalas and ayahs in reading order.
    await client.query(
      `INSERT INTO addresses (address, work_id, level, ordinal, batch_id)
       SELECT a::extensions.ltree, 'quran', l, o, $4
       FROM unnest($1::text[], $2::text[], $3::int[]) AS t(a, l, o)`,
      [
        data.segments.map((s) => s.address),
        data.segments.map((s) => s.level),
        data.segments.map((s) => s.ordinal),
        batchId,
      ],
    );

    await client.query(
      `INSERT INTO text_versions
         (id, work_id, language, kind, title, riwaya, script, source_id, verification, is_primary, status, batch_id)
       VALUES ('quran.ar.hafs', 'quran', 'ar', 'original', $1, 'hafs', 'uthmani',
               'tanzil.quran-uthmani', 'source_verified', true, 'draft', $2)`,
      [`Хафс от Асима, письмо усмани (Tanzil ${data.textVersion})`, batchId],
    );
    await client.query(
      `INSERT INTO texts (address, version_id, content, search_plain, search_vocalized, batch_id)
       SELECT a::extensions.ltree, 'quran.ar.hafs', c, p, v, $5
       FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(a, c, p, v)`,
      [
        data.segments.map((s) => s.address),
        data.segments.map((s) => s.text),
        data.segments.map((s) => searchKey(s.text)),
        data.segments.map((s) => searchKey(s.text, { diacritics: true })),
        batchId,
      ],
    );
    // Published only after every text is in place.
    await client.query("UPDATE text_versions SET status = 'published' WHERE id = 'quran.ar.hafs'");

    await client.query(
      `INSERT INTO divisions (work_id, scheme, number, starts_at, source_id, batch_id)
       SELECT 'quran', s, n, a::extensions.ltree, 'tanzil.quran-data', $4
       FROM unnest($1::text[], $2::int[], $3::text[]) AS t(s, n, a)`,
      [
        data.divisions.map((d) => d.scheme),
        data.divisions.map((d) => d.number),
        data.divisions.map((d) => d.startsAt),
        batchId,
      ],
    );

    // Place and order of revelation as given by Tanzil: the traditional view.
    // Research chronologies are added later as separate rows beside it.
    const note = "Данные Tanzil (традиционная классификация)";
    await client.query(
      `INSERT INTO classifications (address, kind, value, recognition, source_id, note, batch_id)
       SELECT a::extensions.ltree, k, v, 'tradition', 'tanzil.quran-data', $4, $5
       FROM unnest($1::text[], $2::text[], $3::text[]) AS t(a, k, v)`,
      [
        data.suras.flatMap((s) => [s.address, s.address]),
        data.suras.flatMap(() => ["revelation_place", "revelation_order"]),
        data.suras.flatMap((s) => [s.revelationPlace, String(s.revelationOrder)]),
        note,
        batchId,
      ],
    );

    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
       VALUES ('import_batch', $1, 'created', $2, 'Загрузка текста Корана из Tanzil', $3)`,
      [key, json({ batchId, version: "quran.ar.hafs", segments: data.segments.length }), ACTOR],
    );
    await client.query("COMMIT");
    console.log(`Import done: ${key} (${data.segments.length} segments).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

// The same Hafs text in standard (imlaei) spelling, for search: people type
// words the usual way, which the Uthmani script often spells differently.
// Optional: loaded when data/sources/tanzil/quran-simple.xml is present.
async function importTanzilSimple(client: pg.Client) {
  const dir = join(DATA_DIR, "tanzil");
  const file = join(dir, "quran-simple.xml");
  if (!existsSync(file)) return;
  const data = parseTanzil(readFileSync(file, "utf8"), readFileSync(join(dir, "quran-data.xml"), "utf8"));
  const key = `tanzil:quran-simple:${data.textVersion}`;

  const done = await client.query("SELECT 1 FROM import_batches WHERE key = $1", [key]);
  if (done.rowCount) {
    console.log(`Import skipped: ${key} is already loaded.`);
    return;
  }

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO sources (id, title, url, license, license_text, version, retrieved_at)
       VALUES ('tanzil.quran-simple', 'Tanzil Quran Text (Simple)', 'https://tanzil.net', 'CC BY 3.0', $1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [data.notice, data.textVersion, RETRIEVED_AT],
    );
    const batch = await client.query(
      `INSERT INTO import_batches (key, source_id, actor, summary)
       VALUES ($1, 'tanzil.quran-simple', $2, $3) RETURNING id`,
      [key, ACTOR, json({ segments: data.segments.length })],
    );
    const batchId = batch.rows[0].id;
    await client.query(
      `INSERT INTO text_versions
         (id, work_id, language, kind, title, riwaya, script, source_id, verification, is_primary, status, batch_id)
       VALUES ('quran.ar.hafs-simple', 'quran', 'ar', 'original', $1, 'hafs', 'imlaei',
               'tanzil.quran-simple', 'source_verified', false, 'draft', $2)`,
      [`Хафс от Асима, обычное письмо (Tanzil Simple ${data.textVersion})`, batchId],
    );
    // Addresses come from the Uthmani load; a missing one fails the foreign key.
    await client.query(
      `INSERT INTO texts (address, version_id, content, search_plain, search_vocalized, batch_id)
       SELECT a::extensions.ltree, 'quran.ar.hafs-simple', c, p, v, $5
       FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(a, c, p, v)`,
      [
        data.segments.map((s) => s.address),
        data.segments.map((s) => s.text),
        data.segments.map((s) => searchKey(s.text)),
        data.segments.map((s) => searchKey(s.text, { diacritics: true })),
        batchId,
      ],
    );
    await client.query("UPDATE text_versions SET status = 'published' WHERE id = 'quran.ar.hafs-simple'");
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
       VALUES ('import_batch', $1, 'created', $2, 'Текст Корана в обычном письме для поиска', $3)`,
      [key, json({ batchId, version: "quran.ar.hafs-simple", segments: data.segments.length }), ACTOR],
    );
    await client.query("COMMIT");
    console.log(`Import done: ${key} (${data.segments.length} segments).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

// A hadith collection from the OpenITI corpus, in one of two layouts.
type HadithSource = {
  file: string; // in data/sources/openiti, kept byte for byte
  layout: "shamela" | "narrations";
  key: string;
  sourceId: string;
  sourceTitle: string;
  sourceVersion: string;
  notice: string;
  work: { id: string; canon: "sunni" | "shia"; titles: Record<string, string>; authoritySunni: number | null };
  versionId: string;
  versionTitle: string;
  minItems: number; // the load stops if fewer texts are recognised
};

const OPENITI_LICENSE = "CC BY-NC-SA 4.0";
const OPENITI_CITATION =
  "Romanov, Maxim, and Masoumeh Seydi. OpenITI: A Machine-Readable Corpus of Islamicate Texts. Zenodo. doi:10.5281/zenodo.3082463";

const BUKHARI: HadithSource = {
  file: "0256Bukhari.Sahih.Shamela0001681-ara1",
  layout: "shamela",
  key: "openiti:0256Bukhari.Sahih.Shamela0001681-ara1:44e1c36",
  sourceId: "openiti.bukhari-shamela0001681",
  sourceTitle: "OpenITI · 0256Bukhari.Sahih.Shamela0001681-ara1",
  sourceVersion: "OpenITI/0275AH 44e1c36 (2025-11-28)",
  notice: `${OPENITI_CITATION}. Text: 0256Bukhari.Sahih.Shamela0001681-ara1 — Sahih al-Bukhari, ed. Muhammad Zuhayr al-Nasir, Dar Tawq al-Najat, 1422 AH, with the numbering of Muhammad Fu'ad Abd al-Baqi. License: ${OPENITI_LICENSE} (https://creativecommons.org/licenses/by-nc-sa/4.0/).`,
  work: { id: "bukhari", canon: "sunni", titles: { ar: "صحيح البخاري", ru: "Сахих аль-Бухари" }, authoritySunni: 2 },
  versionId: "bukhari.ar.tawq-najat",
  versionTitle: "Арабский текст: изд. Дар Таук ан-Наджат (1422 г. х.), нумерация М. Ф. Абд аль-Баки (OpenITI)",
  minItems: 7000,
};

const MUSLIM: HadithSource = {
  file: "0261Muslim.Sahih.JK000109-ara1",
  layout: "narrations",
  key: "openiti:0261Muslim.Sahih.JK000109-ara1:44e1c36",
  sourceId: "openiti.muslim-jk000109",
  sourceTitle: "OpenITI · 0261Muslim.Sahih.JK000109-ara1",
  sourceVersion: "OpenITI/0275AH 44e1c36 (2025-11-28)",
  notice: `${OPENITI_CITATION}. Text: 0261Muslim.Sahih.JK000109-ara1 — Sahih Muslim, ed. Muhammad Fu'ad Abd al-Baqi, Dar Ihya al-Turath al-Arabi, Beirut (al-Jami' al-Kabir export), with the editor's numbering. License: ${OPENITI_LICENSE} (https://creativecommons.org/licenses/by-nc-sa/4.0/).`,
  // Level 2 like al-Bukhari until a specialist confirms the levels (docs/PLAN.md).
  work: { id: "muslim", canon: "sunni", titles: { ar: "صحيح مسلم", ru: "Сахих Муслим" }, authoritySunni: 2 },
  versionId: "muslim.ar.ihya-turath",
  versionTitle: "Арабский текст: изд. Дар Ихья ат-Турас аль-Араби (Бейрут), под ред. и с нумерацией М. Ф. Абд аль-Баки (OpenITI)",
  minItems: 7000,
};

// What both layouts give the loader: a text per address, in reading order.
type HadithItem = {
  path: number[]; // [number] or [number, narration]
  ordinal: number;
  book: number;
  chapter: number;
  paragraphs: string[];
  numbering: Numbering;
};
type PreparedCollection = {
  books: { number: number; title: string }[];
  chapters: { book: number; index: number; title: string; intro: string[] }[];
  items: HadithItem[];
  containers: number[]; // hadith numbers whose narrations have their own addresses
  unnumbered: { book: number; chapter: number; paragraphs: string[] }[];
  levels: { key: string; names: Record<string, string> }[];
  summary: Record<string, unknown>;
  missing: number;
};

const HADITH_LEVEL = { key: "hadith", names: { ar: "حديث", ru: "хадис" } };
const NARRATION_LEVEL = { key: "narration", names: { ar: "رواية", ru: "передача" } };

function prepare(src: HadithSource, text: string): PreparedCollection {
  if (src.layout === "shamela") {
    const data = parseOpenitiHadith(text);
    const report = data.report;
    return {
      books: data.books,
      chapters: data.chapters,
      items: data.hadiths.map((h) => ({ ...h, path: [h.number] })),
      containers: [],
      unnumbered: report.unassigned,
      levels: [HADITH_LEVEL],
      summary: {
        books: data.books.length,
        chapters: data.chapters.length,
        hadiths: data.hadiths.length,
        markers: report.markers,
        inferredGap: report.inferredGap,
        inferredDisplaced: report.inferredDisplaced,
        missing: report.missing,
        appended: report.appended,
        unassigned: report.unassigned.length,
      },
      missing: report.missing.length,
    };
  }
  const data = parseOpenitiNarrations(text);
  const report = data.report;
  return {
    books: data.books,
    chapters: data.chapters,
    items: data.narrations.map((n) => ({
      path: [n.number, n.variant],
      ordinal: n.ordinal,
      book: n.book,
      chapter: n.chapter,
      paragraphs: n.paragraphs,
      numbering: "marker",
    })),
    containers: [...new Set(data.narrations.map((n) => n.number))],
    unnumbered: [],
    levels: [HADITH_LEVEL, NARRATION_LEVEL],
    summary: {
      books: data.books.length,
      chapters: data.chapters.length,
      narrations: report.narrations,
      numbers: report.numbers,
      missing: report.missing,
      backReferences: report.backReferences.length,
      glued: report.glued,
      numberedHeadings: report.numberedHeadings.length,
      textHeadings: report.textHeadings.length,
      appended: report.appended,
    },
    missing: report.missing.length,
  };
}

async function importOpenitiHadith(client: pg.Client, src: HadithSource) {
  const done = await client.query("SELECT 1 FROM import_batches WHERE key = $1", [src.key]);
  if (done.rowCount) {
    console.log(`Import skipped: ${src.key} is already loaded.`);
    return;
  }
  const data = prepare(src, readFileSync(join(DATA_DIR, "openiti", src.file), "utf8"));
  if (data.items.length < src.minItems) {
    throw new Error(`${src.file}: only ${data.items.length} texts recognised`);
  }
  const address = (path: number[]) => [src.work.id, ...path].join(".");
  const content = (paragraphs: string[]) => paragraphs.join("\n\n");
  const items = data.items;

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO sources (id, title, url, license, license_text, version, retrieved_at)
       VALUES ($1, $2, 'https://github.com/OpenITI/0275AH', $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [src.sourceId, src.sourceTitle, OPENITI_LICENSE, src.notice, src.sourceVersion, "2026-10-18"],
    );
    const batch = await client.query(
      `INSERT INTO import_batches (key, source_id, actor, summary) VALUES ($1, $2, 'import:openiti', $3) RETURNING id`,
      [src.key, src.sourceId, json(data.summary)],
    );
    const batchId = batch.rows[0].id;

    await client.query(
      `INSERT INTO works (id, canon, category, titles, levels, authority_sunni, authority_shia, status)
       VALUES ($1, $2, 'hadith', $3, $4, $5, NULL, 'published')
       ON CONFLICT (id) DO NOTHING`,
      [src.work.id, src.work.canon, json(src.work.titles), json(data.levels), src.work.authoritySunni],
    );
    // Containers: a hadith number that groups its narrations.
    await client.query(
      `INSERT INTO addresses (address, work_id, level, batch_id)
       SELECT a::extensions.ltree, $2, 'hadith', $3 FROM unnest($1::text[]) AS t(a)`,
      [data.containers.map((n) => address([n])), src.work.id, batchId],
    );
    const level = data.levels[data.levels.length - 1].key;
    await client.query(
      `INSERT INTO addresses (address, work_id, level, ordinal, batch_id)
       SELECT a::extensions.ltree, $3, $4, o, $5 FROM unnest($1::text[], $2::int[]) AS t(a, o)`,
      [items.map((h) => address(h.path)), items.map((h) => h.ordinal), src.work.id, level, batchId],
    );
    await client.query(
      `INSERT INTO text_versions
         (id, work_id, language, kind, title, source_id, verification, is_primary, status, batch_id)
       VALUES ($1, $2, 'ar', 'original', $3, $4, 'unverified', true, 'draft', $5)`,
      [src.versionId, src.work.id, src.versionTitle, src.sourceId, batchId],
    );
    const texts = items.map((h) => content(h.paragraphs));
    await client.query(
      `INSERT INTO texts (address, version_id, content, search_plain, search_vocalized, batch_id)
       SELECT a::extensions.ltree, $5, c, p, v, $6
       FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(a, c, p, v)`,
      [
        items.map((h) => address(h.path)),
        texts,
        texts.map((t) => searchKey(t)),
        texts.map((t) => searchKey(t, { diacritics: true })),
        src.versionId,
        batchId,
      ],
    );
    await client.query(
      `INSERT INTO section_items (version_id, address, book, chapter, numbering, batch_id)
       SELECT $5, a::extensions.ltree, b, c, n, $6
       FROM unnest($1::text[], $2::int[], $3::int[], $4::text[]) AS t(a, b, c, n)`,
      [
        items.map((h) => address(h.path)),
        items.map((h) => h.book),
        items.map((h) => h.chapter),
        items.map((h) => h.numbering),
        src.versionId,
        batchId,
      ],
    );

    // Books, then chapters in reading order; unnumbered narration stays with its chapter.
    const unnumbered = new Map<string, string[]>();
    for (const item of data.unnumbered) {
      const key = `${item.book}.${item.chapter}`;
      unnumbered.set(key, [...(unnumbered.get(key) ?? []), ...item.paragraphs]);
    }
    const sections = [
      ...data.books.map((b) => ({ kind: "book", book: b.number, chapter: null, title: b.title, intro: "", extra: "" })),
      ...data.chapters.map((c) => ({
        kind: "chapter",
        book: c.book,
        chapter: c.index,
        title: c.title,
        intro: content(c.intro),
        extra: content(unnumbered.get(`${c.book}.${c.index}`) ?? []),
      })),
    ].sort((x, y) => x.book - y.book || (x.chapter ?? 0) - (y.chapter ?? 0));
    await client.query(
      `INSERT INTO work_sections (version_id, kind, book, chapter, ordinal, title, intro, unnumbered, batch_id)
       SELECT $7, k, b, c, o, t, i, u, $8
       FROM unnest($1::text[], $2::int[], $3::int[], $4::text[], $5::text[], $6::text[])
         WITH ORDINALITY AS s(k, b, c, t, i, u, o)`,
      [
        sections.map((s) => s.kind),
        sections.map((s) => s.book),
        sections.map((s) => s.chapter),
        sections.map((s) => s.title),
        sections.map((s) => s.intro),
        sections.map((s) => s.extra),
        src.versionId,
        batchId,
      ],
    );
    await client.query("UPDATE text_versions SET status = 'published' WHERE id = $1", [src.versionId]);
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
       VALUES ('import_batch', $1, 'created', $2, $3, 'import:openiti')`,
      [
        src.key,
        json({ batchId, version: src.versionId, texts: items.length, missing: data.missing }),
        `Загрузка: ${src.work.titles.ru} (OpenITI)`,
      ],
    );
    await client.query("COMMIT");
    console.log(`Import done: ${src.key} (${items.length} texts; ${data.missing} numbers missing).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("Import skipped: DATABASE_URL is not set.");
    return;
  }
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    await client.query("SET search_path TO public, extensions");
    await importTanzil(client);
    await importTanzilSimple(client);
    await importOpenitiHadith(client, BUKHARI);
    await importOpenitiHadith(client, MUSLIM);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  process.exit(1);
});
