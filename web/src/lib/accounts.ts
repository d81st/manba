// Reading accounts for signing in and for checking a session on every request
// (the role and disabling are read from the database, not trusted from the cookie).
import "server-only";
import { db } from "@/lib/db";
import {
    normalizeLogin, verifyPassword
} from "@/lib/passwords";
import type { Account, Role } from "@/lib/session";

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
