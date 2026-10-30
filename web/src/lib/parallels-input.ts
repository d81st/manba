// Validation of the admin form of «Истоки и связи»: a link between passages of
// Islam's sources and of another religion's texts (db/migrations/017). No
// database access here, so everything is unit-tested; that the addresses
// exist is checked on saving (lib/parallels.ts).
import { z } from "zod";
import { isExternal, parseExternalRef } from "./external.ts";
import { parseRefs, TERM_STATUSES, type InputProblem } from "./glossary-input.ts";

export const PARALLEL_STATUSES = TERM_STATUSES;
export const TRADITIONS = ["judaism", "christianity", "zoroastrianism", "arabia", "greek", "roman", "persian", "other"] as const;
export const PARALLEL_KINDS = ["quote", "retelling", "motif", "concept"] as const;
export const DEGREES = ["borrowing", "parallel"] as const;
export const BASES = ["research", "text", "both"] as const;
export const PARALLEL_REF_FIELDS = ["islamRefs", "externalRefs", "basisRefs", "traditionRefs", "researchRefs"] as const;
export type ParallelRefField = (typeof PARALLEL_REF_FIELDS)[number];
// Field of the form -> role of parallel_refs.
export const REF_ROLES: Record<ParallelRefField, string> = {
  islamRefs: "islam",
  externalRefs: "external",
  basisRefs: "basis",
  traditionRefs: "tradition",
  researchRefs: "research",
};

const trimmed = (max: number) => z.string().trim().max(max);

export const parallelSchema = z.object({
  slug: trimmed(80).regex(/^[a-z][a-z0-9-]*$/, "slug"),
  status: z.enum(PARALLEL_STATUSES),
  title: trimmed(200).min(1, "title"),
  tradition: z.enum(TRADITIONS),
  kind: z.enum(PARALLEL_KINDS),
  degree: z.enum(DEGREES),
  basis: z.enum(BASES),
  islamRefs: trimmed(2000).default(""),
  externalRefs: trimmed(2000).default(""),
  basisRefs: trimmed(2000).default(""),
  basisNote: trimmed(4000).default(""),
  traditionReading: trimmed(8000).default(""),
  traditionRefs: trimmed(2000).default(""),
  traditionNote: trimmed(1000).default(""),
  researchReading: trimmed(8000).default(""),
  researchRefs: trimmed(2000).default(""),
  researchNote: trimmed(1000).default(""),
  reason: trimmed(500).default(""),
});

export type ParallelInput = z.infer<typeof parallelSchema>;
export type CheckedParallel = ParallelInput & { refs: Record<ParallelRefField, string[]> };

// References of any kind, separated by commas: ayahs ("5:45"), hadiths and
// books ("Бухари 3635", "Ибн Касир 33:45"), texts of other religions
// ("Исход 21:23-25", "Мишна Санхедрин 4:5").
export function parseAnyRefs(text: string) {
  const addresses: string[] = [];
  const invalid: string[] = [];
  const add = (found: string[]) => found.forEach((a) => addresses.includes(a) || addresses.push(a));
  for (const token of text.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean)) {
    const outside = parseExternalRef(token);
    if (outside) {
      add(outside);
      continue;
    }
    const own = parseRefs(token);
    if (own.invalid.length || own.addresses.length === 0) invalid.push(token);
    else add(own.addresses);
  }
  return { addresses, invalid };
}

const external = (address: string) => isExternal(address.split(".")[0]);

export function checkParallelInput(raw: unknown): { input?: CheckedParallel; problems: InputProblem[] } {
  const result = parallelSchema.safeParse(raw);
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
  const refs = {} as Record<ParallelRefField, string[]>;
  for (const field of PARALLEL_REF_FIELDS) {
    const { addresses, invalid } = parseAnyRefs(input[field]);
    if (invalid.length) problems.push({ field, code: "refs", detail: invalid.join(", ") });
    refs[field] = addresses;
  }
  // Each side holds only its own texts.
  if (refs.islamRefs.some(external)) problems.push({ field: "islamRefs", code: "islamSide" });
  if (refs.externalRefs.some((a) => !external(a))) problems.push({ field: "externalRefs", code: "externalSide" });

  // A link is published only with both sides, a basis and both readings.
  if (input.status === "published") {
    if (refs.islamRefs.length === 0) problems.push({ field: "islamRefs", code: "required" });
    if (refs.externalRefs.length === 0) problems.push({ field: "externalRefs", code: "required" });
    if (refs.basisRefs.length === 0 && !input.basisNote) problems.push({ field: "basisNote", code: "basisRequired" });
    if (input.basis !== "text" && !input.basisNote) problems.push({ field: "basisNote", code: "studyRequired" });
    if (!input.traditionReading) problems.push({ field: "traditionReading", code: "required" });
    if (!input.researchReading) problems.push({ field: "researchReading", code: "required" });
  }
  return problems.length ? { problems } : { input: { ...input, refs }, problems };
}
