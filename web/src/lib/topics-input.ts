// Validation of the topic form. No database access here, so everything is unit-tested.
import { z } from "zod";
import { parseRefs, RECOGNITIONS, TERM_STATUSES, type InputProblem } from "./glossary-input.ts";

export const TOPIC_STATUSES = TERM_STATUSES;
// Topics of the section «История текста Корана» (quran_text) are also listed
// on its own page, /quran-text.
export const TOPIC_CATEGORIES = ["general", "hard", "quran_text"] as const;
// Ayahs shown before and after each main passage.
export const CONTEXT_AYAHS = 3;

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
  title: trimmed(200).min(1, "title"),
  question: trimmed(1000).min(1, "question"),
  mainRefs: trimmed(2000).default(""),
  circumstances: trimmed(20000).default(""),
  circumstancesNote: trimmed(1000).default(""),
  circumstancesRefs: trimmed(2000).default(""),
  relatedRefs: trimmed(2000).default(""),
  positions: z.array(positionSchema).max(40).default([]),
  terms: z.array(z.number().int().positive()).max(50).default([]),
  related: z.array(z.number().int().positive()).max(50).default([]),
  reason: trimmed(500).default(""),
});

export type TopicInput = z.infer<typeof topicSchema>;

const REF_FIELDS = ["mainRefs", "circumstancesRefs", "relatedRefs"] as const;

// Checks that need no database: schema, references, and what a published hard
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
  if (input.category === "hard" && input.status === "published") {
    if (parseRefs(input.mainRefs).addresses.length === 0) problems.push({ field: "mainRefs", code: "mainRequired" });
    if (!input.circumstances) problems.push({ field: "circumstances", code: "circumstancesRequired" });
    if (input.positions.length === 0) problems.push({ field: "positions", code: "positionsRequired" });
  }
  return { input, problems };
}

// Consecutive ayahs of one sura, so a passage can be shown with the ayahs around it.
export type Passage = { sura: number; from: number; to: number };

export function passagesOf(addresses: string[]): Passage[] {
  const passages: Passage[] = [];
  for (const address of addresses) {
    const [, sura, ayah] = address.split(".").map(Number);
    const last = passages.at(-1);
    if (last && last.sura === sura && last.to + 1 === ayah) last.to = ayah;
    else passages.push({ sura, from: ayah, to: ayah });
  }
  return passages;
}

export const sideSchema = z.object({
  slug: trimmed(40).regex(/^[a-z][a-z0-9-]*$/, "slug"),
  title: trimmed(100).min(1, "title"),
  position: z.coerce.number().int().min(0).max(999),
});

export function checkSideInput(raw: unknown): { input?: z.infer<typeof sideSchema>; problems: InputProblem[] } {
  const result = sideSchema.safeParse(raw);
  if (result.success) return { input: result.data, problems: [] };
  return {
    problems: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
    })),
  };
}
