"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/shared/auth/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/shared/auth/session";
import type { ChangeResult } from "../account.types";
import { clientAddress } from "../login.limiter";
import { isLoginLocked, recordLoginFailure, recordLoginSuccess } from "./login-lockout";
import { changeOwnPassword } from "./user.commands";

export type PasswordState = { problem?: NonNullable<ChangeResult["problem"]> | "mainAdmin"; saved?: boolean };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await requireSession();
  if (!session.uid) return { problem: "mainAdmin" };
  const headerList = await headers();
  const address = clientAddress(headerList.get("x-forwarded-for"), headerList.get("x-real-ip"));
  // A wrong current password is the same kind of guess as a wrong login, and
  // checking it costs a slow hash. The login lock stops both.
  if (await isLoginLocked(address, session.login)) return { problem: "locked" };
  const result = await changeOwnPassword(
    session.uid,
    String(formData.get("current") ?? ""),
    String(formData.get("next") ?? ""),
    String(formData.get("repeat") ?? ""),
  );
  if (result.problem === "current") await recordLoginFailure(address, session.login);
  if (result.problem) return { problem: result.problem };
  await recordLoginSuccess(address, session.login);
  // The old cookie stopped working with the new session_version: issue a new one.
  (await cookies()).set(
    SESSION_COOKIE,
    createSessionToken(session.login, { role: session.role, uid: session.uid, ver: result.ver!, pc: false })!,
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE },
  );
  if (session.pc) redirect("/");
  return { saved: true };
}
