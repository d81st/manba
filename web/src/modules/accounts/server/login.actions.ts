"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMessages } from "@/shared/i18n";
import { clientAddress } from "../login.limiter";
import { isLoginLocked, recordLoginFailure, recordLoginSuccess } from "./login-lockout";
import { isDatabaseConfigured } from "@/shared/db";
import { safeNext } from "@/shared/auth/safe-next";
import {
    createSessionToken,
    credentialsMatch,
    isConfigured,
    SESSION_COOKIE,
    SESSION_MAX_AGE,
} from "@/shared/auth/session";
import { findAccount } from "@/shared/auth/accounts";

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

  // The main administrator from the server settings, then the accounts.
  let token: string | null = null;
  let mustChange = false;
  if (credentialsMatch(login, password)) {
    token = createSessionToken(login);
  } else if (isDatabaseConfigured()) {
    const account = await findAccount(login, password);
    if (account) {
      token = createSessionToken(account.login, account);
      mustChange = account.pc;
    }
  }
  if (!token) {
    await recordLoginFailure(address, login);
    return { error: t.invalid, login };
  }
  await recordLoginSuccess(address, login);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  if (mustChange) redirect("/account/password");
  redirect(safeNext(formData.get("next")));
}
