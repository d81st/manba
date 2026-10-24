// Loads bundled source files into the library: once per source version.
// Runs before the site starts, after the migrations. A load that already
// happened (same import_batches.key) is skipped, so restarts change nothing.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { searchKey } from "../src/lib/arabic.ts";
import { type Numbering, parseOpenitiHadith } from "../src/lib/import/openiti-hadith.ts";
import { parseOpenitiKafi } from "../src/lib/import/openiti-kafi.ts";
import { parseOpenitiNarrations } from "../src/lib/import/openiti-narrations.ts";
import { parseOpenitiRunning } from "../src/lib/import/openiti-running.ts";
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
  layout: "shamela" | "narrations" | "kafi" | "running";
  key: string;
  sourceId: string;
  sourceTitle: string;
  sourceVersion: string;
  notice: string;
  work: {
    id: string;
    canon: "sunni" | "shia";
    titles: Record<string, string>;
    authoritySunni: number | null;
    authorityShia?: number;
  };
  versionId: string;
  versionTitle: string;
  minItems: number; // the load stops if fewer texts are recognised
  retrievedAt: string;
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
  work: { id: "bukhari", canon: "sunni", titles: { ar: "صحيح البخاري", ru: "Сахих аль-Бухари", "ru-short": "аль-Бухари" }, authoritySunni: 2 },
  versionId: "bukhari.ar.tawq-najat",
  versionTitle: "Арабский текст: изд. Дар Таук ан-Наджат (1422 г. х.), нумерация М. Ф. Абд аль-Баки (OpenITI)",
  minItems: 7000,
  retrievedAt: "2026-10-18",
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
  work: { id: "muslim", canon: "sunni", titles: { ar: "صحيح مسلم", ru: "Сахих Муслим", "ru-short": "Муслим" }, authoritySunni: 2 },
  versionId: "muslim.ar.ihya-turath",
  retrievedAt: "2026-10-23",
  versionTitle: "Арабский текст: изд. Дар Ихья ат-Турас аль-Араби (Бейрут), под ред. и с нумерацией М. Ф. Абд аль-Баки (OpenITI)",
  minItems: 7000,
};

// The four Sunan, each in the edition whose numbering is the one in common
// use (Abd al-Baqi numbered only Ibn Majah of them).
const OPENITI_COMMITS = { "0275AH": "44e1c36 (2025-11-28)", "0300AH": "01a1544 (2025-11-28)", "0325AH": "089e665 (2025-12-01)" };

function sunan(options: {
  file: string;
  repo: keyof typeof OPENITI_COMMITS;
  edition: string;
  work: HadithSource["work"];
  versionId: string;
  versionTitle: string;
  minItems: number;
}): HadithSource {
  const uri = options.file.replace(/\.(?:mARkdown|completed)$/, "");
  const commit = OPENITI_COMMITS[options.repo];
  return {
    file: options.file,
    layout: "narrations",
    key: `openiti:${uri}:${commit.split(" ")[0]}`,
    sourceId: `openiti.${options.work.id.replace(/_/g, "-")}-${uri.split(".").pop()!.replace(/-ara\d+$/, "").toLowerCase()}`,
    sourceTitle: `OpenITI · ${uri}`,
    sourceVersion: `OpenITI/${options.repo} ${commit}`,
    notice: `${OPENITI_CITATION}. Text: ${uri} — ${options.edition} (al-Jami' al-Kabir export), with the edition's numbering. License: ${OPENITI_LICENSE} (https://creativecommons.org/licenses/by-nc-sa/4.0/).`,
    work: options.work,
    versionId: options.versionId,
    versionTitle: options.versionTitle,
    minItems: options.minItems,
    retrievedAt: "2026-10-23",
  };
}

// Level 3 for the Sunan until a specialist confirms the levels (docs/PLAN.md).
const ABU_DAWUD = sunan({
  file: "0275AbuDawudSijistani.Sunan.JK000142-ara1",
  repo: "0275AH",
  edition: "Sunan Abi Dawud, ed. Muhammad Muhyi al-Din Abd al-Hamid, Dar al-Fikr",
  work: {
    id: "abu_dawud",
    canon: "sunni",
    titles: { ar: "سنن أبي داود", ru: "Сунан Абу Дауда", "ru-short": "Абу Дауд" },
    authoritySunni: 3,
  },
  versionId: "abu_dawud.ar.abd-al-hamid",
  versionTitle: "Арабский текст: изд. Мухаммада Мухйи ад-Дина Абд аль-Хамида (Дар аль-Фикр), его нумерация (OpenITI)",
  minItems: 5000,
});
const TIRMIDHI = sunan({
  file: "0279Tirmidhi.Sunan.JK000140-ara1.completed",
  repo: "0300AH",
  edition: "Sunan al-Tirmidhi (al-Jami'), ed. Ahmad Muhammad Shakir et al., Dar Ihya al-Turath al-Arabi",
  work: {
    id: "tirmidhi",
    canon: "sunni",
    titles: { ar: "سنن الترمذي", ru: "Сунан ат-Тирмизи", "ru-short": "ат-Тирмизи" },
    authoritySunni: 3,
  },
  versionId: "tirmidhi.ar.shakir",
  versionTitle: "Арабский текст: изд. Ахмада Мухаммада Шакира и др. (Дар Ихья ат-Турас аль-Араби), нумерация издания (OpenITI)",
  minItems: 3900,
});
const NASAI = sunan({
  file: "0303Nasai.SunanSughra.JK000130-ara1.mARkdown",
  repo: "0325AH",
  edition: "al-Mujtaba (Sunan al-Nasa'i al-Sughra), ed. Abd al-Fattah Abu Ghudda, Maktab al-Matbu'at al-Islamiyya, Aleppo",
  work: {
    id: "nasai",
    canon: "sunni",
    titles: { ar: "سنن النسائي", ru: "Сунан ан-Насаи", "ru-short": "ан-Насаи" },
    authoritySunni: 3,
  },
  versionId: "nasai.ar.abu-ghudda",
  versionTitle: "Арабский текст «аль-Муджтаба»: изд. Абд аль-Фаттаха Абу Гудды (Халеб), его нумерация (OpenITI)",
  minItems: 5700,
});
const IBN_MAJAH = sunan({
  file: "0273IbnMaja.Sunan.JK000141-ara1",
  repo: "0275AH",
  edition: "Sunan Ibn Majah, ed. Muhammad Fu'ad Abd al-Baqi, Dar al-Fikr",
  work: {
    id: "ibn_majah",
    canon: "sunni",
    titles: { ar: "سنن ابن ماجه", ru: "Сунан Ибн Маджи", "ru-short": "Ибн Маджа" },
    authoritySunni: 3,
  },
  versionId: "ibn_majah.ar.abd-al-baqi",
  versionTitle: "Арабский текст: изд. М. Ф. Абд аль-Баки (Дар аль-Фикр), его нумерация (OpenITI)",
  minItems: 4300,
});

// The Musnad of Ahmad ibn Hanbal in al-Arna'ut's edition, numbered straight
// through (1-27647); hadiths the editors added are "N/k", address ahmad.N.k.
// Level 4 for the Sunni canon until a specialist confirms the levels.
const AHMAD: HadithSource = {
  file: "0241IbnHanbal.Musnad.Shamela0025794-ara1.mARkdown",
  layout: "running",
  key: "openiti:0241IbnHanbal.Musnad.Shamela0025794-ara1:0cc00c0",
  sourceId: "openiti.ahmad-shamela0025794",
  sourceTitle: "OpenITI · 0241IbnHanbal.Musnad.Shamela0025794-ara1",
  sourceVersion: "OpenITI/0250AH 0cc00c0 (2025-11-28)",
  notice: `${OPENITI_CITATION}. Text: 0241IbnHanbal.Musnad.Shamela0025794-ara1 — Musnad Ahmad ibn Hanbal, ed. Shu'ayb al-Arna'ut, Adil Murshid et al., Mu'assasat al-Risala, Beirut, 1995-2001, with the edition's numbering. License: ${OPENITI_LICENSE} (https://creativecommons.org/licenses/by-nc-sa/4.0/).`,
  work: {
    id: "ahmad",
    canon: "sunni",
    titles: { ar: "مسند أحمد", ru: "Муснад Ахмада", "ru-short": "Ахмад" },
    authoritySunni: 4,
  },
  versionId: "ahmad.ar.arnaut",
  versionTitle: "Арабский текст: изд. Шуайба аль-Арнаута, Адиля Муршида и др. («Муассасат ар-Рисаля», Бейрут, 1995–2001), нумерация издания (OpenITI)",
  minItems: 27000,
  retrievedAt: "2026-10-24",
};

// al-Kafi, the first of the four Shia books: hadiths are numbered inside each
// chapter, so the address is book.chapter.number (docs/ADDRESSES.md). Level 2
// for the Shia canon until a specialist confirms the levels (docs/PLAN.md).
const KAFI: HadithSource = {
  file: "0329IbnYacqubKulayni.Kafi.Shia001122Vols-ara1.mARkdown",
  layout: "kafi",
  key: "openiti:0329IbnYacqubKulayni.Kafi.Shia001122Vols-ara1:3f52b87",
  sourceId: "openiti.kafi-shia001122vols",
  sourceTitle: "OpenITI · 0329IbnYacqubKulayni.Kafi.Shia001122Vols-ara1",
  sourceVersion: "OpenITI/0350AH 3f52b87 (2025-11-28)",
  notice: `${OPENITI_CITATION}. Text: 0329IbnYacqubKulayni.Kafi.Shia001122Vols-ara1 — al-Kafi of al-Kulayni, ed. Ali Akbar al-Ghaffari, Dar al-Kutub al-Islamiyya, Tehran, 1968 (8 vols). License: ${OPENITI_LICENSE} (https://creativecommons.org/licenses/by-nc-sa/4.0/).`,
  work: {
    id: "kafi",
    canon: "shia",
    titles: { ar: "الكافي", ru: "аль-Кафи", "ru-short": "аль-Кафи" },
    authoritySunni: null,
    authorityShia: 2,
  },
  versionId: "kafi.ar.ghaffari",
  versionTitle: "Арабский текст: изд. Али Акбара аль-Гаффари (Дар аль-Кутуб аль-Исламийя, Тегеран, 1968), нумерация хадисов внутри глав (OpenITI)",
  minItems: 15000,
  retrievedAt: "2026-10-24",
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
  containers: { path: number[]; level: string }[]; // addresses that group texts: a hadith, a book, a chapter
  unnumbered: { book: number; chapter: number; paragraphs: string[] }[];
  levels: { key: string; names: Record<string, string> }[];
  summary: Record<string, unknown>;
  missing: number;
};

const HADITH_LEVEL = { key: "hadith", names: { ar: "حديث", ru: "хадис" } };
const NARRATION_LEVEL = { key: "narration", names: { ar: "رواية", ru: "передача" } };
const BOOK_LEVEL = { key: "book", names: { ar: "كتاب", ru: "книга" } };
const CHAPTER_LEVEL = { key: "chapter", names: { ar: "باب", ru: "глава" } };

function prepare(src: HadithSource, text: string): PreparedCollection {
  if (src.layout === "kafi") {
    const data = parseOpenitiKafi(text);
    const report = data.report;
    return {
      books: data.books,
      chapters: data.chapters,
      items: data.hadiths.map((h) => ({
        path: [h.book, h.chapter, h.number],
        ordinal: h.ordinal,
        book: h.book,
        chapter: h.chapter,
        paragraphs: h.paragraphs,
        numbering: "marker",
      })),
      containers: [
        ...data.books.map((b) => ({ path: [b.number], level: "book" })),
        ...data.chapters.map((c) => ({ path: [c.book, c.index], level: "chapter" })),
      ],
      unnumbered: [],
      levels: [BOOK_LEVEL, CHAPTER_LEVEL, HADITH_LEVEL],
      summary: {
        books: data.books.length,
        chapters: data.chapters.length,
        hadiths: report.hadiths,
        inline: report.inline,
        gaps: report.gaps.reduce((sum, g) => sum + g.numbers.length, 0),
        ignored: report.ignored.length,
        runOn: report.runOn,
      },
      missing: report.gaps.reduce((sum, g) => sum + g.numbers.length, 0),
    };
  }
  if (src.layout === "running") {
    const data = parseOpenitiRunning(text);
    const report = data.report;
    return {
      books: data.books,
      chapters: data.chapters,
      items: data.hadiths.map((h) => ({
        path: h.part === null ? [h.number] : [h.number, h.part],
        ordinal: h.ordinal,
        book: h.book,
        chapter: h.chapter,
        paragraphs: h.paragraphs,
        numbering: "marker",
      })),
      containers: [],
      unnumbered: [],
      levels: [HADITH_LEVEL],
      summary: {
        books: data.books.length,
        chapters: data.chapters.length,
        hadiths: report.hadiths,
        inline: report.inline,
        missing: report.missing,
        ignored: report.ignored.length,
        parts: report.parts,
        bullets: report.bullets,
        footnotes: report.footnotes,
      },
      missing: report.missing.length,
    };
  }
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
  // Narrations get their own addresses only where a number has several.
  const nested = data.narrations.some((n) => n.variant > 1);
  return {
    books: data.books,
    chapters: data.chapters,
    items: data.narrations.map((n) => ({
      path: nested ? [n.number, n.variant] : [n.number],
      ordinal: n.ordinal,
      book: n.book,
      chapter: n.chapter,
      paragraphs: n.paragraphs,
      numbering: "marker",
    })),
    containers: nested ? [...new Set(data.narrations.map((n) => n.number))].map((n) => ({ path: [n], level: "hadith" })) : [],
    unnumbered: [],
    levels: nested ? [HADITH_LEVEL, NARRATION_LEVEL] : [HADITH_LEVEL],
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
      inferredBooks: report.inferredBooks,
      repeatMarks: report.repeatMarks,
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
      [src.sourceId, src.sourceTitle, OPENITI_LICENSE, src.notice, src.sourceVersion, src.retrievedAt],
    );
    const batch = await client.query(
      `INSERT INTO import_batches (key, source_id, actor, summary) VALUES ($1, $2, 'import:openiti', $3) RETURNING id`,
      [src.key, src.sourceId, json(data.summary)],
    );
    const batchId = batch.rows[0].id;

    await client.query(
      `INSERT INTO works (id, canon, category, titles, levels, authority_sunni, authority_shia, status)
       VALUES ($1, $2, 'hadith', $3, $4, $5, $6, 'published')
       ON CONFLICT (id) DO NOTHING`,
      [
        src.work.id,
        src.work.canon,
        json(src.work.titles),
        json(data.levels),
        src.work.authoritySunni,
        src.work.authorityShia ?? null,
      ],
    );
    // Containers: a hadith number that groups its narrations, a book, a chapter.
    await client.query(
      `INSERT INTO addresses (address, work_id, level, batch_id)
       SELECT a::extensions.ltree, $3, l, $4 FROM unnest($1::text[], $2::text[]) AS t(a, l)`,
      [data.containers.map((c) => address(c.path)), data.containers.map((c) => c.level), src.work.id, batchId],
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

// Pairs of hadiths of different collections with shared wording
// (data/sources/links/README.md): a measure shown as such, not a claim.
const SIMILAR_TEXTS = {
  key: "manba:similar-texts:v1",
  file: "similar-texts-v1.tsv",
  method: "similar-texts:v1",
  minPairs: 40_000,
};

async function importSimilarTexts(client: pg.Client) {
  const src = SIMILAR_TEXTS;
  const done = await client.query("SELECT 1 FROM import_batches WHERE key = $1", [src.key]);
  if (done.rowCount) {
    console.log(`Import skipped: ${src.key} is already loaded.`);
    return;
  }
  const pairs = readFileSync(join(DATA_DIR, "links", src.file), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      const [a, b, share] = line.split("\t");
      if (!/^[a-z_]+(\.\d+)+$/.test(a) || !/^[a-z_]+(\.\d+)+$/.test(b) || !/^(0\.\d\d|1\.00)$/.test(share)) {
        throw new Error(`${src.file}:${i + 1}: not "address, address, share"`);
      }
      if (a.split(".")[0] === b.split(".")[0]) throw new Error(`${src.file}:${i + 1}: both texts in one collection`);
      return { a, b, share };
    });
  if (pairs.length < src.minPairs) throw new Error(`${src.file}: only ${pairs.length} pairs`);
  if (new Set(pairs.map((p) => `${p.a} ${p.b}`)).size !== pairs.length) throw new Error(`${src.file}: repeated pairs`);

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO sources (id, title, url, license, license_text, version, retrieved_at)
       VALUES ('manba.similar-texts', 'Похожие тексты в разных сборниках хадисов (автоматическое сравнение)',
               'https://github.com/d81st/manba/tree/main/data/sources/links', $1, $2, 'v1', '2026-10-24')
       ON CONFLICT (id) DO NOTHING`,
      [
        OPENITI_LICENSE,
        "Вычислено проектом из текстов OpenITI (CC BY-NC-SA 4.0); распространяется на тех же условиях.",
      ],
    );
    const batch = await client.query(
      `INSERT INTO import_batches (key, source_id, actor, summary)
       VALUES ($1, 'manba.similar-texts', 'import:links', $2) RETURNING id`,
      [src.key, json({ pairs: pairs.length })],
    );
    const batchId = batch.rows[0].id;
    // Addresses must exist and hold a text: a pair never points nowhere.
    const missing = await client.query(
      `SELECT a FROM unnest($1::text[]) AS a
       WHERE NOT EXISTS (SELECT 1 FROM texts t WHERE t.address = a::extensions.ltree) LIMIT 5`,
      [[...new Set(pairs.flatMap((p) => [p.a, p.b]))]],
    );
    if (missing.rowCount) throw new Error(`${src.file}: no text at ${missing.rows.map((r) => r.a).join(", ")}`);
    await client.query(
      `INSERT INTO hadith_links (a, b, kind, share, method, batch_id)
       SELECT a::extensions.ltree, b::extensions.ltree, 'similar_text', s, $4, $5
       FROM unnest($1::text[], $2::text[], $3::numeric[]) AS t(a, b, s)`,
      [pairs.map((p) => p.a), pairs.map((p) => p.b), pairs.map((p) => p.share), src.method, batchId],
    );
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
       VALUES ('import_batch', $1, 'created', $2, $3, 'import:links')`,
      [src.key, json({ batchId, pairs: pairs.length }), "Похожие тексты в разных сборниках хадисов (способ 1)"],
    );
    await client.query("COMMIT");
    console.log(`Import done: ${src.key} (${pairs.length} pairs).`);
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
    for (const src of [ABU_DAWUD, TIRMIDHI, NASAI, IBN_MAJAH, AHMAD, KAFI]) await importOpenitiHadith(client, src);
    await importSimilarTexts(client);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  process.exit(1);
});
