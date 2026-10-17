import "server-only";
import pg from "pg";

// One pool per server process; kept on globalThis so dev reloads reuse it.
const store = globalThis as unknown as { dbPool?: pg.Pool };

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  if (!store.dbPool) {
    store.dbPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase requires TLS; its certificate is not in the default CA store.
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      // Supabase already looks up "extensions" (ltree); a plain local or CI
      // Postgres gets the same lookup path at connection start.
      options: process.env.DATABASE_SSL === "true" ? undefined : "-c search_path=public,extensions",
      max: 5,
    });
  }
  return store.dbPool;
}
