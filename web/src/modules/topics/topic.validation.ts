// Validation of the topic and side forms. No database access here, so everything is unit-tested.
import { z } from "zod";
import { parseRefs, RECOGNITIONS, type InputProblem } from "@/lib/glossary-input";
import { TOPIC_CATEGORIES, TOPIC_STATUSES } from "./topic.constants";

const trimmed = (max: number) => z.string().trim().max(max);

const positionSchema = z.object({
  sideId: z.number().int().positive(),
  holder: trimmed(200).min(1, "positionHolder"),
  recognition: z.enum(RECOGNITIONS),
  text: trimmed(8000).min(1, "positionText"),
  sourceNote: trimmed(1000).default(""),
  refs: trimmed(2000).default(""),
});

export const topicSchema = z.object({
  slug: trimmed(80).regex(/^[a-z][a-z0-9-]*$/, "slug"),
  category: z.enum(TOPIC_CATEGORIES),
  status: z.enum(TOPIC_STATUSES),
  // The place on the map (a city), by its permanent id.
  place: z.union([trimmed(80).regex(/^[a-z][a-z0-9-]*$/, "place"), z.literal("")]).default(""),
  title: trimmed(200).min(1, "title"),
  question: trimmed(1000).min(1, "question"),
  mainRefs: trimmed(8000).default(""),
  circumstances: trimmed(20000).default(""),
  circumstancesNote: trimmed(1000).default(""),
  circumstancesRefs: trimmed(8000).default(""),
  relatedRefs: trimmed(8000).default(""),
  positions: z.array(positionSchema).max(40).default([]),
  terms: z.array(z.number().int().positive()).max(50).default([]),
  related: z.array(z.number().int().positive()).max(50).default([]),
  reason: trimmed(500).default(""),
});

export type TopicInput = z.infer<typeof topicSchema>;

const REF_FIELDS = ["mainRefs", "circumstancesRefs", "relatedRefs"] as const;

// Checks that need no database: schema, references, and what any published
// topic must contain so that no passage is shown without its context.
export function checkTopicInput(raw: unknown): { input?: TopicInput; problems: InputProblem[] } {
  const result = topicSchema.safeParse(raw);
  if (!result.success) {
    return {
      problems: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
      })),
    };
  }
  const input = result.data;
  input.terms = [...new Set(input.terms)];
  input.related = [...new Set(input.related)];
  const problems: InputProblem[] = [];
  for (const field of REF_FIELDS) {
    const bad = parseRefs(input[field]).invalid;
    if (bad.length) problems.push({ field, code: "refs", detail: bad.join(", ") });
  }
  input.positions.forEach((position, i) => {
    const bad = parseRefs(position.refs).invalid;
    if (bad.length) problems.push({ field: `positions.${i}.refs`, code: "refs", detail: bad.join(", ") });
  });
  if (input.status === "published") {
    // A topic about something outside the library (manuscripts, a testimony of
    // another religion) may stand on outside sources instead: a link to the
    // catalog or scan in the note to the circumstances (decision of the author 07.11.2026).
    const outside = hasOutsideSource(input.circumstancesNote);
    if (parseRefs(input.mainRefs).addresses.length === 0 && !outside) problems.push({ field: "mainRefs", code: "mainRequired" });
    if (!input.circumstances) problems.push({ field: "circumstances", code: "circumstancesRequired" });
    if (input.positions.length === 0) problems.push({ field: "positions", code: "positionsRequired" });
  }
  return { input, problems };
}

// A web address of a catalog, scan or publication in the note.
export function hasOutsideSource(note: string) {
  return /https:\/\/\S+/.test(note);
}

export const sideSchema = z.object({
  slug: trimmed(40).regex(/^[a-z][a-z0-9-]*$/, "slug"),
  title: trimmed(100).min(1, "title"),
  position: z.coerce.number().int().min(0).max(999),
});

export type SideInput = z.infer<typeof sideSchema>;

export function checkSideInput(raw: unknown): { input?: SideInput; problems: InputProblem[] } {
  const result = sideSchema.safeParse(raw);
  if (result.success) return { input: result.data, problems: [] };
  return {
    problems: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
    })),
  };
}
