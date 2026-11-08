import { defaultLocale } from "@/shared/i18n";

// Shared pieces of the topic queries (internal to the module's server side).
export const LOCALE = defaultLocale;

export type RefRole = "main" | "related" | "circumstances" | "position";

export const SUMMARY = `
  SELECT t.id::int, t.slug, t.category, t.status, x.title, x.question,
         t.updated_at::text AS "updatedAt", t.updated_by AS "updatedBy", pl.slug AS place
  FROM topics t JOIN topic_texts x ON x.topic_id = t.id AND x.locale = '${LOCALE}'
  LEFT JOIN places pl ON pl.id = t.place_id`;
