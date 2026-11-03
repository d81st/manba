"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { clientAddress } from "@/lib/login-limiter";
import { isLoginLocked, recordLoginFailure, recordLoginSuccess } from "@/lib/login-lockout";
import { safeNext } from "@/lib/safe-next";
import {
  createSessionToken,
  credentialsMatch,
  isConfigured,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";

export type LoginState = { error?: string; login?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const t = getMessages().login;
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isConfigured()) return { error: t.notConfigured, login };

  const headerList = await headers();
  const address = clientAddress(headerList.get("x-forwarded-for"), headerList.get("x-real-ip"));
  if (await isLoginLocked(address, login)) return { error: t.locked, login };

  if (!credentialsMatch(login, password)) {
    await recordLoginFailure(address, login);
    return { error: t.invalid, login };
  }
  await recordLoginSuccess(address, login);

  (await cookies()).set(SESSION_COOKIE, createSessionToken(login)!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(formData.get("next")));
}
