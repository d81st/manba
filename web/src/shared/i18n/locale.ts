// Interface language. Source texts stay in the language they were recorded in.
export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export const LOCALE_COOKIE = "manba_locale";

export function isLocale(value: unknown): value is Locale {
  return value === "ru" || value === "en";
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}
