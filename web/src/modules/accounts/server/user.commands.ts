// Accounts besides the main administrator (migration 043). The administrator
// creates an account with a temporary password and gives it to the person;
// at the first login the person sets their own. Every change of password,
// role or disabling raises session_version, which ends that account's older
// sessions (checked in proxy.ts). Changes go to the journal without passwords.
import "server-only";
import { db } from "@/lib/db";
import {
    checkNewPassword,
    hashPassword,
    isValidLogin,
    normalizeLogin,
    temporaryPassword,
    verifyPassword
} from "@/lib/passwords";
import type { Role } from "@/lib/session";
import type { ChangeResult, CreateResult } from "../account.types";

async function journal(id: number, action: string, value: object, actor: string) {
  await db().query(
    `INSERT INTO change_log (entity, entity_id, action, new_value, actor) VALUES ('user', $1, $2, $3, $4)`,
    [String(id), action, JSON.stringify(value), actor],
  );
}

export async function createUser(loginRaw: string, role: Role, actor: string): Promise<CreateResult> {
  const login = normalizeLogin(loginRaw);
  if (!isValidLogin(login)) return { problem: "login" };
  if (login === normalizeLogin(process.env.SITE_LOGIN ?? "")) return { problem: "reserved" };
  const password = temporaryPassword();
  const hash = await hashPassword(password);
  const { rows } = await db().query<{ id: string }>(
    `INSERT INTO users (login, password_hash, role, created_by, updated_by) VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT (login) DO NOTHING RETURNING id`,
    [login, hash, role, actor],
  );
  if (!rows[0]) return { problem: "taken" };
  await journal(Number(rows[0].id), "created", { login, role }, actor);
  return { password, login };
}

export async function resetPassword(id: number, actor: string) {
  const password = temporaryPassword();
  const hash = await hashPassword(password);
  const { rowCount } = await db().query(
    `UPDATE users SET password_hash = $2, must_change_password = true, session_version = session_version + 1,
            updated_by = $3, updated_at = now() WHERE id = $1`,
    [id, hash, actor],
  );
  if (!rowCount) return null;
  await journal(id, "updated", { password: "reset" }, actor);
  return password;
}

export async function setDisabled(id: number, disabled: boolean, actor: string) {
  await db().query(
    `UPDATE users SET disabled = $2, session_version = session_version + 1, updated_by = $3, updated_at = now() WHERE id = $1`,
    [id, disabled, actor],
  );
  await journal(id, "updated", { disabled }, actor);
}

export async function setRole(id: number, role: Role, actor: string) {
  await db().query(
    `UPDATE users SET role = $2, session_version = session_version + 1, updated_by = $3, updated_at = now() WHERE id = $1`,
    [id, role, actor],
  );
  await journal(id, "updated", { role }, actor);
}

export async function changeOwnPassword(uid: number, current: string, next: string, repeat: string): Promise<ChangeResult> {
  const problem = checkNewPassword(next, repeat, current);
  if (problem) return { problem };
  const { rows } = await db().query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [uid]);
  if (!rows[0] || !(await verifyPassword(current, rows[0].password_hash))) return { problem: "current" };
  const hash = await hashPassword(next);
  const updated = await db().query<{ session_version: number; login: string }>(
    `UPDATE users SET password_hash = $2, must_change_password = false, session_version = session_version + 1,
            updated_by = login, updated_at = now() WHERE id = $1 RETURNING session_version, login`,
    [uid, hash],
  );
  await journal(uid, "updated", { password: "changed by the owner" }, updated.rows[0].login);
  return { ver: updated.rows[0].session_version };
}
