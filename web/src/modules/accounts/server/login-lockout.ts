import "server-only";
import { db, isDatabaseConfigured } from "@/shared/db";
import { isLocked, WINDOW_MS, type FailureCounts } from "../login.limiter";

const WINDOW_SECONDS = WINDOW_MS / 1000;

function note(error: unknown) {
  console.error("Login lockout unavailable:", error instanceof Error ? error.message : "unknown");
}

async function failureCounts(address: string, login: string): Promise<FailureCounts | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const { rows } = await db().query<{
      pair: number;
      login_count: number;
      address_count: number;
      total: number;
    }>(
      `SELECT
         count(*) FILTER (WHERE address = $1 AND login = $2)::int AS pair,
         count(*) FILTER (WHERE login = $2)::int AS login_count,
         count(*) FILTER (WHERE address = $1)::int AS address_count,
         count(*)::int AS total
       FROM auth_failures
       WHERE created_at > now() - ($3::int * interval '1 second')`,
      [address, login, WINDOW_SECONDS],
    );
    const row = rows[0];
    return { pair: row.pair, login: row.login_count, address: row.address_count, total: row.total };
  } catch (error) {
    // A database hiccup must not lock the owner out of an otherwise open form.
    note(error);
    return null;
  }
}

export async function isLoginLocked(address: string, login: string) {
  const counts = await failureCounts(address, login);
  return counts ? isLocked(counts) : false;
}

export async function recordLoginFailure(address: string, login: string) {
  if (!isDatabaseConfigured()) return;
  try {
    await db().query("INSERT INTO auth_failures (address, login) VALUES ($1, $2)", [
      address.slice(0, 200),
      login.slice(0, 200),
    ]);
    await db().query("DELETE FROM auth_failures WHERE created_at < now() - interval '2 days'");
  } catch (error) {
    note(error);
  }
}

// A correct password clears this address and this login. Failures of other
// logins from other addresses stay, so one success does not reset every attack.
export async function recordLoginSuccess(address: string, login: string) {
  if (!isDatabaseConfigured()) return;
  try {
    await db().query("DELETE FROM auth_failures WHERE address = $1 OR login = $2", [
      address.slice(0, 200),
      login.slice(0, 200),
    ]);
  } catch (error) {
    note(error);
  }
}
