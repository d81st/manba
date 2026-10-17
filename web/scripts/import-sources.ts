// Loads bundled source files into the library: once per source version.
// Runs before the site starts, after the migrations. A load that already
// happened (same import_batches.key) is skipped, so restarts change nothing.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { searchKey } from "../src/lib/arabic.ts";
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
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  process.exit(1);
});
