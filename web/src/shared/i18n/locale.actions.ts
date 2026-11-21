"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/shared/auth/safe-next";
import { LOCALE_COOKIE, parseLocale } from "./locale";

// A year. The cookie is only the interface language.
const YEAR = 60 * 60 * 24 * 365;

export async function setLocale(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  if (formData.get("locale") !== locale) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: YEAR,
    // The page reads it before paint to set the document language. It is not a secret.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  redirect(await back());
}

async function back() {
  const referer = (await headers()).get("referer");
  if (!referer) return "/";
  try {
    const url = new URL(referer);
    return safeNext(`${url.pathname}${url.search}`);
  } catch {
    return "/";
  }
}
