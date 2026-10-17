import { ru, type Messages } from "./ru";

export type { Messages };

// Interface languages are separate from source-text languages.
// Only Russian for now; add uz/en dictionaries with the same shape later.
export const locales = ["ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

const dictionaries: Record<Locale, Messages> = { ru };

export function getMessages(locale: Locale = defaultLocale): Messages {
  return dictionaries[locale];
}

// "5 аятов": picks the form by the number using the locale's plural rules.
export function plural(
  count: number,
  forms: { one: string; few: string; many: string },
  locale: Locale = defaultLocale,
) {
  const rule = new Intl.PluralRules(locale).select(count);
  const form = rule === "one" ? forms.one : rule === "few" ? forms.few : forms.many;
  return `${count} ${form}`;
}
