import { defaultLocale } from "@/shared/i18n";
import type { RelationKind } from "../term.types";

// Shared pieces of the glossary queries (internal to the module's server side).
export const LOCALE = defaultLocale;

// The same link seen from the other term.
export const INVERSE: Record<RelationKind, RelationKind> = {
  related: "related",
  opposite: "opposite",
  broader: "narrower",
  narrower: "broader",
};

export const SUMMARY = `
  SELECT t.id::int, t.slug, t.arabic, t.transliteration, x.translation, x.short, t.status,
         t.is_basic AS "isBasic", t.basic_order AS "basicOrder",
         t.updated_at::text AS "updatedAt", t.updated_by AS "updatedBy"
  FROM terms t JOIN term_texts x ON x.term_id = t.id AND x.locale = '${LOCALE}'`;
