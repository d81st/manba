// «Историческая линия» (migration 022): validation of the admin form and the
// approximate common-era years of a hijra year. No database access here, so
// everything is unit-tested; that a quote stands in its passage is checked on
// saving (lib/history.ts).
import { z } from "zod";
import { parseBookRef } from "./book-query.ts";
import { TERM_STATUSES, type InputProblem } from "./glossary-input.ts";

export const HISTORY_STATUSES = TERM_STATUSES;
export const HISTORY_LAYERS = ["rulers", "texts", "doctrine", "science"] as const;
export type HistoryLayer = (typeof HISTORY_LAYERS)[number];

const trimmed = (max: number) => z.string().trim().max(max);
const slug = trimmed(80).regex(/^[a-z][a-z0-9-]*$/, "slug");
const optionalInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable().default(null);

const dateSchema = z.object({
  ref: trimmed(80).min(1, "ref"),
  quote: trimmed(3000).min(1, "quote"),
  holder: trimmed(200).default(""),
  yearAh: optionalInt(-150, 1600).refine((y) => y !== 0, "year"),
  yearCe: optionalInt(400, 2200),
  month: optionalInt(1, 12),
  day: optionalInt(1, 31),
  variant: z.boolean().default(false),
  note: trimmed(1000).default(""),
});

export const historyEventSchema = z.object({
  slug,
  layer: z.enum(HISTORY_LAYERS),
  status: z.enum(HISTORY_STATUSES),
  title: trimmed(200).min(1, "title"),
  topic: z.number().int().positive().nullable().default(null),
  dates: z.array(dateSchema).max(80).default([]),
  reason: trimmed(500).default(""),
});

export type HistoryEventInput = z.infer<typeof historyEventSchema>;
export type HistoryDateInput = HistoryEventInput["dates"][number];
export type CheckedHistoryEvent = Omit<HistoryEventInput, "dates"> & {
  dates: (HistoryDateInput & { address: string })[];
};

function issues(error: z.ZodError): InputProblem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
  }));
}

// A date cites a book of the library by volume and page: "Халифа 1:121".
export function checkHistoryEventInput(raw: unknown): { input?: CheckedHistoryEvent; problems: InputProblem[] } {
  const result = historyEventSchema.safeParse(raw);
  if (!result.success) return { problems: issues(result.error) };
  const problems: InputProblem[] = [];
  const dates = result.data.dates.map((d, i) => {
    if (d.day !== null && d.month === null) problems.push({ field: `dates.${i}.day`, code: "dayWithoutMonth" });
    if (d.yearAh !== null && d.yearCe !== null) problems.push({ field: `dates.${i}.yearCe`, code: "oneYear" });
    const address = parseBookRef(d.ref);
    if (!address) problems.push({ field: `dates.${i}.ref`, code: "ref", detail: d.ref });
    return { ...d, address: address ?? "" };
  });
  if (result.data.status === "published" && !dates.some((d) => d.yearAh !== null || d.yearCe !== null)) {
    problems.push({ field: "dates", code: "datesRequired" });
  }
  return problems.length ? { problems } : { input: { ...result.data, dates }, problems };
}

// The common-era years a hijra year falls in (it is 354 or 355 days long):
// year 1 began on 16 July 622. An approximation for display, marked "≈" on
// the site: [first, last], equal when the year lies within one CE year.
const YEAR = 354.367 / 365.2425;
const START = 622 + 196.5 / 365.2425; // 16 July 622 as a fraction of the year

export function ceYears(yearAh: number): [number, number] {
  const n = yearAh > 0 ? yearAh - 1 : yearAh; // no year 0
  const start = START + n * YEAR;
  return [Math.floor(start), Math.floor(start + YEAR)];
}

export function ceLabel(yearAh: number) {
  const [a, b] = ceYears(yearAh);
  return a === b ? String(a) : `${a}/${String(b).slice(-2)}`;
}

// The year an event is placed at on the line: its first dated reading, in
// common-era years (a hijra year counts by the CE year it begins in).
export function placeYear(dates: { yearAh: number | null; yearCe: number | null; variant: boolean }[]) {
  const main = dates.find((d) => !d.variant && (d.yearAh !== null || d.yearCe !== null)) ??
    dates.find((d) => d.yearAh !== null || d.yearCe !== null);
  if (!main) return null;
  return main.yearCe ?? ceYears(main.yearAh!)[0];
}
