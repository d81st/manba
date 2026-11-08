import { defaultLocale } from "@/i18n";
import { formatExternalRefs } from "@/lib/external";
import { formatRefs } from "@/lib/refs";
import type { ParallelSummary } from "../parallel.types";

export const LOCALE = defaultLocale;

export const SUMMARY = `
  SELECT p.id::int, p.slug, x.title, p.tradition, p.kind, p.degree, p.basis, p.status,
         coalesce(array_agg(r.address::text ORDER BY r.position) FILTER (WHERE r.role = 'islam'), '{}') AS islam,
         coalesce(array_agg(r.address::text ORDER BY r.position) FILTER (WHERE r.role = 'external'), '{}') AS external
  FROM parallels p
  JOIN parallel_texts x ON x.parallel_id = p.id AND x.locale = '${LOCALE}'
  LEFT JOIN parallel_refs r ON r.parallel_id = p.id AND r.role IN ('islam', 'external')`;

export type SummaryRow = Omit<ParallelSummary, "islam" | "external"> & { islam: string[]; external: string[] };

export const toSummary = (row: SummaryRow): ParallelSummary => ({
  ...row,
  islam: formatRefs(row.islam),
  external: formatExternalRefs(row.external),
});
