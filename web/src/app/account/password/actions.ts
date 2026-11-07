"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { changeOwnPassword, type ChangeResult } from "@/lib/users";

export type PasswordState = { problem?: NonNullable<ChangeResult["problem"]> | "mainAdmin"; saved?: boolean };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await requireSession();
  if (!session.uid) return { problem: "mainAdmin" };
  const result = await changeOwnPassword(
    session.uid,
    String(formData.get("current") ?? ""),
    String(formData.get("next") ?? ""),
    String(formData.get("repeat") ?? ""),
  );
  if (result.problem) return { problem: result.problem };
  // The old cookie stopped working with the new session_version: issue a new one.
  (await cookies()).set(
    SESSION_COOKIE,
    createSessionToken(session.login, { role: session.role, uid: session.uid, ver: result.ver!, pc: false })!,
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE },
  );
  if (session.pc) redirect("/");
  return { saved: true };
}
