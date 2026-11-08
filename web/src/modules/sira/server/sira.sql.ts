import { defaultLocale } from "@/i18n";

export const LOCALE = defaultLocale;

export const TOPIC = `CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object('id', t.id::int, 'slug', t.slug, 'published', t.status = 'published') END`;
