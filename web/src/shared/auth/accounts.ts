// Reading accounts for signing in and for checking a session on every request
// (the role and disabling are read from the database, not trusted from the cookie).
import "server-only";
import { db, isDatabaseConfigured } from "@/shared/db";
import {
    normalizeLogin, verifyPassword
} from "@/shared/auth/passwords";
import type { Account, Role, Session } from "@/shared/auth/session";

// A dummy hash so that an unknown login takes as long as a wrong password.
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function findAccount(loginRaw: string, password: string): Promise<(Account & { login: string }) | null> {
  const login = normalizeLogin(loginRaw);
  const { rows } = await db().query<{
    id: string;
    password_hash: string;
    role: Role;
    disabled: boolean;
    must_change_password: boolean;
    session_version: number;
  }>("SELECT id, password_hash, role, disabled, must_change_password, session_version FROM users WHERE login = $1", [login]);
  const row = rows[0];
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok || row.disabled) return null;
  return { login, uid: Number(row.id), role: row.role, ver: row.session_version, pc: row.must_change_password };
}

// What the proxy needs on every request of an account session.
export async function accountState(uid: number) {
  const { rows } = await db().query<{ role: Role; disabled: boolean; session_version: number; must_change_password: boolean }>(
    "SELECT role, disabled, session_version, must_change_password FROM users WHERE id = $1",
    [uid],
  );
  return rows[0] ?? null;
}

// The number every session cookie of the main administrator must carry
// (migration 050). Without the database, or if it cannot answer, 0 and "the
// cookie is fine": the owner must not be locked out by a database hiccup, and
// without the database the site shows nothing anyway.
export async function ownerSessionVersion(): Promise<number | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const { rows } = await db().query<{ value: number }>("SELECT value FROM site_state WHERE key = 'owner_session_version'");
    return rows[0]?.value ?? 0;
  } catch {
    return null;
  }
}

// A session of the main administrator is valid while its number is the current one.
export async function ownerSessionValid(session: Session) {
  const current = await ownerSessionVersion();
  return current === null || (session.ver ?? 0) === current;
}

// Signs the main administrator out on every device: older cookies stop working.
export async function endOwnerSessions() {
  if (!isDatabaseConfigured()) return;
  try {
    await db().query(
      `INSERT INTO site_state (key, value) VALUES ('owner_session_version', 1)
       ON CONFLICT (key) DO UPDATE SET value = site_state.value + 1`,
    );
  } catch (error) {
    console.error("Could not end the owner's sessions:", error instanceof Error ? error.message : "unknown");
  }
}
