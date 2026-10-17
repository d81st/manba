import { ru, type Messages } from "./ru";

// Interface languages are separate from source-text languages.
// Only Russian for now; add uz/en dictionaries with the same shape later.
export const locales = ["ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

const dictionaries: Record<Locale, Messages> = { ru };

export function getMessages(locale: Locale = defaultLocale): Messages {
  return dictionaries[locale];
}
