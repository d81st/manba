import { defaultLocale } from "@/i18n";

export const LOCALE = defaultLocale;

export const DATES = `coalesce((SELECT json_agg(json_build_object(
    'address', d.address::text, 'quote', d.quote, 'holder', d.holder, 'yearAh', d.year_ah, 'yearCe', d.year_ce,
    'month', d.month, 'day', d.day, 'variant', d.variant, 'note', d.note)
  ORDER BY d.position, d.id) FROM history_event_dates d WHERE d.event_id = e.id), '[]')`;
