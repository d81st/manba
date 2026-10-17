// Applies pending SQL migrations from db/migrations in order, each in its own
// transaction. Runs before the site starts (Render's free plan has no
// pre-deploy step). Adapted from the gameclub project.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "db",
  "migrations",
);
// Arbitrary advisory-lock key: two instances never migrate at the same time.
const LOCK_KEY = 4_812_001;

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("Migrations skipped: DATABASE_URL is not set.");
    return;
  }

  const client = new pg.Client({
    connectionString,
    // Supabase requires TLS; its certificate is not in the default CA store.
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
  await client.connect();
  // Same lookup path as Supabase, so extension types and operators resolve.
  await client.query("SET search_path TO public, extensions");

  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await client.query("ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY");

    const { rows } = await client.query("SELECT name FROM _migrations");
    const done = new Set(rows.map((row) => row.name));
    const pending = listMigrations().filter((m) => !done.has(m.name));

    for (const migration of pending) {
      try {
        await client.query("BEGIN");
        await client.query(migration.sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [
          migration.name,
        ]);
        await client.query("COMMIT");
        console.log(`Migration applied: ${migration.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${migration.name} failed: ${error.message}`);
      }
    }
    if (pending.length === 0) console.log("Migrations: database is up to date.");
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
