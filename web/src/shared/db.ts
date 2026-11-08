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
      // Live data in "public", source texts in "library", ltree and pg_trgm in
      // "extensions", whatever the host's database default (Neon, Supabase,
      // local Postgres). The pool waits for this hook before it hands a new
      // connection out, so the first query already sees "library"; if it
      // fails, the connection is closed and the caller gets the error.
      onConnect: async (client) => {
        await client.query(SEARCH_PATH);
      },
    });
  }
  return store.dbPool;
}
