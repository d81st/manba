// «Тесты» (migration 023): validation of the question form and the level of a
// question. No database access here, so everything is unit-tested; that the
// fragments exist is checked on saving (lib/quiz.ts).
import { z } from "zod";
import { parseRefs, TERM_STATUSES, type InputProblem } from "./glossary-input.ts";

export const QUIZ_STATUSES = TERM_STATUSES;
export const MAX_OPTIONS = 8;

const trimmed = (max: number) => z.string().trim().max(max);

export const questionSchema = z.object({
  status: z.enum(QUIZ_STATUSES),
  prompt: trimmed(2000).min(1, "prompt"),
  note: trimmed(4000).default(""),
  options: z
    .array(z.object({ text: trimmed(1000).min(1, "optionText"), correct: z.boolean().default(false) }))
    .max(MAX_OPTIONS)
    .default([]),
  refs: trimmed(2000).default(""),
  topic: z.number().int().positive().nullable().default(null),
  term: z.number().int().positive().nullable().default(null),
  reason: trimmed(500).default(""),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CheckedQuestion = QuestionInput & { addresses: string[] };

// A published question needs two answers at least, a right one among them and
// the fragments that confirm it (docs/PLAN.md, «Тесты»).
export function checkQuestionInput(raw: unknown): { input?: CheckedQuestion; problems: InputProblem[] } {
  const result = questionSchema.safeParse(raw);
  if (!result.success) {
    return {
      problems: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
      })),
    };
  }
  const input = result.data;
  const problems: InputProblem[] = [];
  const { addresses, invalid } = parseRefs(input.refs);
  if (invalid.length) problems.push({ field: "refs", code: "refs", detail: invalid.join(", ") });
  if (input.status === "published") {
    if (input.options.length < 2) problems.push({ field: "options", code: "optionsRequired" });
    else if (!input.options.some((o) => o.correct)) problems.push({ field: "options", code: "correctRequired" });
    if (addresses.length === 0) problems.push({ field: "refs", code: "refsRequired" });
  }
  const texts = input.options.map((o) => o.text.toLowerCase());
  if (new Set(texts).size !== texts.length) problems.push({ field: "options", code: "optionRepeated" });
  return problems.length ? { problems } : { input: { ...input, addresses }, problems };
}

// The level of a question: the highest authority (the smallest number) of its
// fragments, in each canon; null when no fragment has a level there.
export function questionLevel(works: { sunni: number | null; shia: number | null }[]) {
  const best = (values: (number | null)[]) => {
    const known = values.filter((v): v is number => v !== null);
    return known.length ? Math.min(...known) : null;
  };
  return { sunni: best(works.map((w) => w.sunni)), shia: best(works.map((w) => w.shia)) };
}

// One number to filter by: the better of the two canons.
export function levelKey(level: { sunni: number | null; shia: number | null }) {
  const known = [level.sunni, level.shia].filter((v): v is number => v !== null);
  return known.length ? Math.min(...known) : null;
}
