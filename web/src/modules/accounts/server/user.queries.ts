import "server-only";
import { db } from "@/shared/db";
import type { UserRow } from "../account.types";

export async function listUsers(): Promise<UserRow[]> {
  const { rows } = await db().query<UserRow>(
    `SELECT id::int, login, role, disabled, must_change_password AS "mustChangePassword",
            to_char(created_at, 'YYYY-MM-DD') AS "createdAt", created_by AS "createdBy"
     FROM users ORDER BY login`,
  );
  return rows;
}
