import "server-only";
import { cookies } from "next/headers";
import { workUnitAsyncStorage } from "next/dist/server/app-render/work-unit-async-storage.external";
import { installLocaleReader } from "./active-locale";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./locale";

// getMessages() is called while rendering, including from modules that already
// hold the dictionary in a constant. cookies() is async, so the synchronous
// lookup reads the same request store cookies() awaits.
installLocaleReader(() => {
  const store = workUnitAsyncStorage.getStore();
  if (!store || (store.type !== "request" && store.type !== "prerender-runtime")) return "ru";
  return parseLocale(store.cookies.get(LOCALE_COOKIE)?.value);
});

export async function requestLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}
