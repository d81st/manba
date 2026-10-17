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
      max: 5,
    });
    // Same lookup path as Supabase, so ltree types and operators resolve.
    store.dbPool.on("connect", (client) => {
      client.query("SET search_path TO public, extensions").catch(() => {});
    });
  }
  return store.dbPool;
}
