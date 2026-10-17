"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { isLocked, recordFailure, recordSuccess } from "@/lib/login-limiter";
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

  const forwarded = (await headers()).get("x-forwarded-for");
  const address = forwarded?.split(",")[0]?.trim() || "local";
  if (isLocked(address)) return { error: t.locked, login };

  if (!credentialsMatch(login, password)) {
    recordFailure(address);
    return { error: t.invalid, login };
  }
  recordSuccess(address);

  (await cookies()).set(SESSION_COOKIE, createSessionToken(login)!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(formData.get("next")));
}
