import "server-only";
import pg from "pg";

// One pool per server process; kept on globalThis so dev reloads reuse it.
const store = globalThis as unknown as { dbPool?: pg.Pool };

const SEARCH_PATH = "SET search_path TO public, library, extensions";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  if (!store.dbPool) {
    store.dbPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase requires TLS; its certificate is not in the default CA store.
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
    // Live data in "public", source texts in "library", ltree and pg_trgm in
    // "extensions". Set on every new connection, so it does not depend on the
    // database default of the host (Neon, Supabase, local Postgres).
    store.dbPool.on("connect", (client) => {
      client.query(SEARCH_PATH).catch(() => {});
    });
  }
  return store.dbPool;
}
