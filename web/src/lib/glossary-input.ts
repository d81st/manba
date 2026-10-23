// Validation of the glossary form and text helpers. No database access here,
// so everything is unit-tested.
import { z } from "zod";
import { HADITH_REFERENCE, parseVariant, referencedWork } from "./hadith-query.ts";
import { parseQuery } from "./quran-query.ts";

export const TERM_STATUSES = ["draft", "review", "published", "retired"] as const;
export const RECOGNITIONS = ["tradition", "research_majority", "minority"] as const;
export const RELATION_KINDS = ["related", "broader", "narrower", "opposite"] as const;
const MAX_RANGE = 30;

// Russian letters in links, so a Russian title gives a readable address.
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// "Nāsikh" -> "nasikh", "Джихад" -> "dzhikhad": the permanent id used in links.
export function slugify(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/[а-яё]/g, (letter) => CYRILLIC[letter] ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ʿʾ'’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return /^[a-z]/.test(slug) ? slug : slug ? `t-${slug}` : "";
}

// "2:106, 16:101-102" -> quran.2.106, quran.16.101, quran.16.102
export function parseRefs(text: string) {
  const addresses: string[] = [];
  const invalid: string[] = [];
  for (const token of text.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean)) {
    const parsed = parseQuery(token);
    if (parsed.kind !== "ayahs" || parsed.to - parsed.from >= MAX_RANGE) {
      invalid.push(token);
      continue;
    }
    for (let ayah = parsed.from; ayah <= parsed.to; ayah++) {
      const address = `quran.${parsed.sura}.${ayah}`;
      if (!addresses.includes(address)) addresses.push(address);
    }
  }
  return { addresses, invalid };
}

// quran.16.101, quran.16.102 -> "16:101-102" (for editing and display)
export function formatRefs(addresses: string[]) {
  const parts: string[] = [];
  let start: [number, number] | null = null;
  let previous: [number, number] | null = null;
  const flush = () => {
    if (!start || !previous) return;
    parts.push(start[1] === previous[1] ? `${start[0]}:${start[1]}` : `${start[0]}:${start[1]}-${previous[1]}`);
  };
  for (const address of addresses) {
    const [, sura, ayah] = address.split(".").map(Number);
    if (previous && previous[0] === sura && previous[1] + 1 === ayah) {
      previous = [sura, ayah];
      continue;
    }
    flush();
    start = previous = [sura, ayah];
  }
  flush();
  return parts.join(", ");
}

export type TextPiece =
  | { text: string }
  | { sura: number; from: number; to: number; text: string }
  | { work: string; number: number; variant: number | null; text: string };

// Splits text so that ayah addresses ("2:106", "16:101-102") and hadith
// references ("Бухари 3951") can become links.
export function linkAddresses(text: string): TextPiece[] {
  const found: { index: number; length: number; piece: TextPiece }[] = [];
  for (const match of text.matchAll(/(?<![\d:])(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?(?![\d:])/g)) {
    const sura = Number(match[1]);
    const from = Number(match[2]);
    const to = match[3] ? Number(match[3]) : from;
    if (sura < 1 || sura > 114 || from < 1 || to < from) continue;
    found.push({ index: match.index, length: match[0].length, piece: { sura, from, to, text: match[0] } });
  }
  for (const match of text.matchAll(HADITH_REFERENCE)) {
    const work = referencedWork(match[1]);
    if (!work) continue;
    const variant = match[3] ? parseVariant(match[3]) : null;
    found.push({
      index: match.index,
      length: match[0].length,
      piece: { work, number: Number(match[2]), variant, text: match[0] },
    });
  }
  found.sort((a, b) => a.index - b.index);

  const pieces: TextPiece[] = [];
  let last = 0;
  for (const { index, length, piece } of found) {
    if (index < last) continue;
    if (index > last) pieces.push({ text: text.slice(last, index) });
    pieces.push(piece);
    last = index + length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}

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

export type InputProblem = { field: string; code: string; detail?: string };

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
