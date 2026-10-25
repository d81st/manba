// Validation of the admin forms of «Жизнеописание пророка»: events with their
// dates, people with their relations, places. No database access here, so
// everything is unit-tested; that a quote stands in its passage is checked on
// saving (lib/sira-events.ts).
import { z } from "zod";
import { parseBookRef } from "./book-query.ts";
import { TERM_STATUSES, type InputProblem } from "./glossary-input.ts";

export const SIRA_STATUSES = TERM_STATUSES;
export const EVENT_KINDS = ["life", "expedition"] as const;
// "a is the <kind> of b"; spouse, sibling and cousin read the same both ways.
export const PERSON_RELATION_KINDS = ["parent", "uncle", "grandparent", "foster", "spouse", "sibling", "cousin"] as const;
export const SYMMETRIC_KINDS: readonly string[] = ["spouse", "sibling", "cousin"];

const trimmed = (max: number) => z.string().trim().max(max);
const slug = trimmed(80).regex(/^[a-z][a-z0-9-]*$/, "slug");
const optionalInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable().default(null);

const dateSchema = z.object({
  ref: trimmed(80).min(1, "ref"),
  quote: trimmed(3000).min(1, "quote"),
  holder: trimmed(200).default(""),
  year: optionalInt(-80, 20).refine((y) => y !== 0, "year"),
  month: optionalInt(1, 12),
  day: optionalInt(1, 30),
  age: optionalInt(0, 80),
  variant: z.boolean().default(false),
  note: trimmed(1000).default(""),
});

export const eventSchema = z.object({
  slug,
  kind: z.enum(EVENT_KINDS),
  status: z.enum(SIRA_STATUSES),
  title: trimmed(200).min(1, "title"),
  place: z.union([slug, z.literal("")]).default(""),
  topic: z.number().int().positive().nullable().default(null),
  position: z.number().int().min(0).max(100000).default(0),
  dates: z.array(dateSchema).max(80).default([]),
  reason: trimmed(500).default(""),
});

export type EventInput = z.infer<typeof eventSchema>;
export type EventDateInput = EventInput["dates"][number];
export type CheckedEvent = Omit<EventInput, "dates"> & { dates: (EventDateInput & { address: string })[] };

const relationSchema = z.object({
  other: slug,
  kind: z.enum(PERSON_RELATION_KINDS),
  // out: this person is the <kind> of the other; in: the other is the <kind> of this person.
  direction: z.enum(["out", "in"]),
  ref: trimmed(80).min(1, "ref"),
  quote: trimmed(3000).min(1, "quote"),
  note: trimmed(1000).default(""),
  status: z.enum(SIRA_STATUSES),
});

export const personSchema = z.object({
  slug,
  status: z.enum(SIRA_STATUSES),
  name: trimmed(200).min(1, "title"),
  nameAr: trimmed(200).min(1, "nameAr"),
  forms: trimmed(2000).default(""),
  topic: z.number().int().positive().nullable().default(null),
  relations: z.array(relationSchema).max(100).default([]),
  reason: trimmed(500).default(""),
});

export type PersonInput = z.infer<typeof personSchema>;
export type PersonRelationInput = PersonInput["relations"][number];
export type CheckedPerson = Omit<PersonInput, "forms" | "relations"> & {
  forms: string[];
  relations: (PersonRelationInput & { address: string })[];
};

export const placeSchema = z.object({
  slug,
  name: trimmed(200).min(1, "title"),
  nameAr: trimmed(200).min(1, "nameAr"),
  lat: z.number().min(-90).max(90).nullable().default(null),
  lon: z.number().min(-180).max(180).nullable().default(null),
  coordSource: trimmed(500).default(""),
  reason: trimmed(500).default(""),
});

export type PlaceInput = z.infer<typeof placeSchema>;

function issues(error: z.ZodError): InputProblem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
  }));
}

// "Вакиди 1:2" -> maghazi_waqidi.1.2; a book of the library cited by volume and page.
function checkRef(ref: string, field: string, problems: InputProblem[]) {
  const address = parseBookRef(ref);
  if (!address) problems.push({ field, code: "ref", detail: ref });
  return address ?? "";
}

export function checkEventInput(raw: unknown): { input?: CheckedEvent; problems: InputProblem[] } {
  const result = eventSchema.safeParse(raw);
  if (!result.success) return { problems: issues(result.error) };
  const problems: InputProblem[] = [];
  const dates = result.data.dates.map((d, i) => {
    if (d.day !== null && d.month === null) problems.push({ field: `dates.${i}.day`, code: "dayWithoutMonth" });
    return { ...d, address: checkRef(d.ref, `dates.${i}.ref`, problems) };
  });
  if (result.data.status === "published" && dates.length === 0) problems.push({ field: "dates", code: "datesRequired" });
  return problems.length ? { problems } : { input: { ...result.data, dates }, problems };
}

// Forms of a name, one per line or separated by commas.
export function splitForms(text: string) {
  return [...new Set(text.split(/[\n,،]+/).map((f) => f.trim()).filter(Boolean))];
}

export function checkPersonInput(raw: unknown): { input?: CheckedPerson; problems: InputProblem[] } {
  const result = personSchema.safeParse(raw);
  if (!result.success) return { problems: issues(result.error) };
  const problems: InputProblem[] = [];
  const relations = result.data.relations.map((r, i) => {
    if (r.other === result.data.slug) problems.push({ field: `relations.${i}.other`, code: "self" });
    return { ...r, address: checkRef(r.ref, `relations.${i}.ref`, problems) };
  });
  const forms = splitForms(result.data.forms);
  return problems.length ? { problems } : { input: { ...result.data, forms, relations }, problems };
}

export function checkPlaceInput(raw: unknown): { input?: PlaceInput; problems: InputProblem[] } {
  const result = placeSchema.safeParse(raw);
  if (!result.success) return { problems: issues(result.error) };
  const input = result.data;
  const problems: InputProblem[] = [];
  if ((input.lat === null) !== (input.lon === null)) problems.push({ field: "lat", code: "coordsPair" });
  else if (input.lat !== null && !input.coordSource) problems.push({ field: "coordSource", code: "coordSource" });
  return problems.length ? { problems } : { input, problems };
}

// Whether a quote stands in a passage, spacing aside.
export function quoteFound(text: string, quote: string) {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return norm(text).includes(norm(quote));
}
