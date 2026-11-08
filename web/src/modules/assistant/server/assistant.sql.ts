// Shared pieces of the assistant queries (internal to the module's server side).
import "server-only";
import { defaultLocale } from "@/i18n";

export const LOCALE = defaultLocale;

export const PER_CONCEPT = 40;

export const MAX_SOURCES = 30;

export const like = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const level = (sunni: number | null, shia: number | null) => {
  const known = [sunni, shia].filter((x): x is number => x !== null);
  return known.length ? Math.min(...known) : null;
};
