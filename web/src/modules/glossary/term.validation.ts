// Validation of the glossary form. No database access here, so everything is unit-tested.
import { z } from "zod";
import { RECOGNITIONS, TERM_STATUSES, type InputProblem } from "@/lib/input";
import { parseRefs } from "@/lib/refs";
import { RELATION_KINDS } from "./term.constants";

const trimmed = (max: number) => z.string().trim().max(max);

const definitionSchema = z.object({
  holder: trimmed(200).min(1, "definitionHolder"),
  recognition: z.enum(RECOGNITIONS),
  text: trimmed(4000).min(1, "definitionText"),
  sourceNote: trimmed(500).default(""),
  refs: trimmed(2000).default(""),
});

export const termSchema = z.object({
  slug: trimmed(80).regex(/^[a-z][a-z0-9-]*$/, "slug"),
  arabic: trimmed(200).min(1, "arabic"),
  transliteration: trimmed(200).min(1, "transliteration"),
  translation: trimmed(200).min(1, "translation"),
  short: trimmed(600).min(1, "short"),
  detail: trimmed(20000).default(""),
  isBasic: z.boolean().default(false),
  basicOrder: z.number().int().positive().nullable().default(null),
  status: z.enum(TERM_STATUSES),
  refs: trimmed(4000).default(""),
  related: z
    .array(z.object({ id: z.number().int().positive(), kind: z.enum(RELATION_KINDS) }))
    .max(50)
    .default([]),
  definitions: z.array(definitionSchema).max(20).default([]),
  reason: trimmed(500).default(""),
});

export type TermInput = z.infer<typeof termSchema>;

// Checks that need no database: schema, references, first-50 order.
export function checkTermInput(raw: unknown): { input?: TermInput; problems: InputProblem[] } {
  const result = termSchema.safeParse(raw);
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
  const badRefs = parseRefs(input.refs).invalid;
  if (badRefs.length) problems.push({ field: "refs", code: "refs", detail: badRefs.join(", ") });
  input.definitions.forEach((definition, i) => {
    const bad = parseRefs(definition.refs).invalid;
    if (bad.length) problems.push({ field: `definitions.${i}.refs`, code: "refs", detail: bad.join(", ") });
  });
  if (input.isBasic && !input.basicOrder) problems.push({ field: "basicOrder", code: "basicOrder" });
  if (!input.isBasic) input.basicOrder = null;
  return { input, problems };
}
