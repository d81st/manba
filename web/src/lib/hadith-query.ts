// Parsing of hadith search queries and of hadith references in text, such as
// "Бухари 3951". No database access here, so everything is unit-tested.
import { hasDiacritics, searchKey } from "./arabic.ts";
import { MAX_QUERY_LENGTH } from "./quran-query.ts";

// How collections are named in references; only loaded collections are
// listed, in the traditional order of the six books.
export const COLLECTION_NAMES: Record<string, string[]> = {
  bukhari: ["бухари", "bukhari"],
  muslim: ["муслим", "муслима", "muslim"],
  abu_dawud: ["абу дауд", "абу дауда", "абу-дауд", "abu dawud", "abu dawood"],
  tirmidhi: ["тирмизи", "tirmidhi"],
  nasai: ["насаи", "nasai"],
  ibn_majah: ["ибн маджа", "ибн маджи", "ибн маджах", "ibn majah", "ibn maja"],
};
export const COLLECTION_ORDER = Object.keys(COLLECTION_NAMES);

// The Arabic article before a name: "аль-Бухари", "ат-Тирмизи", "an-Nasai".
const ARTICLE = "(?:аль|ал|ат|ан|ас|аш|ад|аз|ар|al|at|an|as|ash|ad|az|ar)-";
export const DEFAULT_COLLECTION = "bukhari";

const MAX_WORDS = 10;
const ARABIC_LETTER = /[ء-يٱ-ۓۺ-ۿ]/;

export type HadithQuery =
  | { kind: "empty" }
  | { kind: "number"; work: string; number: number; variant: number | null }
  | { kind: "text"; words: string[]; diacritics: boolean }
  | { kind: "unsupported" };

function toAsciiDigits(text: string) {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

// Narrations that share a hadith number are told apart by letters, as in
// "Муслим 8b": a..z, then aa, ab, ... In Russian text the letters of the
// Russian alphabet are read in their own order: "8б" is the second one.
const RUSSIAN_LETTERS = "абвгдежзиклмнопрстуфхцчшщэюя";

export function variantLetters(variant: number) {
  let label = "";
  for (let n = variant; n > 0; n = Math.floor((n - 1) / 26)) {
    label = String.fromCharCode(97 + ((n - 1) % 26)) + label;
  }
  return label;
}

export function parseVariant(letters: string): number | null {
  const lower = letters.toLowerCase();
  if (/^[a-z]{1,2}$/.test(lower)) {
    return [...lower].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 96, 0);
  }
  const index = lower.length === 1 ? RUSSIAN_LETTERS.indexOf(lower) : -1;
  return index >= 0 ? index + 1 : null;
}

// "8" for a hadith with one narration, "8b" for the second of several.
export function hadithLabel(number: number, variant: number | null, variants = 2) {
  return variant !== null && variants > 1 ? `${number}${variantLetters(variant)}` : String(number);
}

// Permanent link of a hadith or of one of its narrations: /hadith/muslim/8b.
export function hadithPath(work: string, number: number, variant: number | null = null) {
  return `/hadith/${work}/${number}${variant === null ? "" : variantLetters(variant)}`;
}

// Anchor of a hadith or narration on its book page.
export function hadithAnchor(number: number, variant: number | null) {
  return variant === null ? `h-${number}` : `h-${number}-${variant}`;
}

function workOf(name: string) {
  const key = name
    .toLowerCase()
    .replace(new RegExp(`^${ARTICLE}`), "")
    .replace(/\s+/g, " ");
  return Object.entries(COLLECTION_NAMES).find(([, names]) => names.includes(key))?.[0];
}

export function parseHadithQuery(input: string, work = DEFAULT_COLLECTION): HadithQuery {
  const query = toAsciiDigits(input.trim().slice(0, MAX_QUERY_LENGTH));
  if (!query) return { kind: "empty" };

  // "3951", "Бухари 3951", "аль-Бухари № 3951", "bukhari.3951", "Муслим 8b", "muslim.8.2"
  const number = query.match(/^(?:([\p{L}-]+(?:\s+[\p{L}-]+)?)\s*[.\s]\s*(?:№\s*)?)?(\d{1,5})(?:\.(\d{1,3})|\s?(\p{L}{1,2}))?$/u);
  if (number) {
    const named = number[1] ? workOf(number[1]) : work;
    const variant = number[3] ? Number(number[3]) : number[4] ? parseVariant(number[4]) : null;
    if (named && variant !== 0 && (variant !== null || !number[4])) {
      return { kind: "number", work: named, number: Number(number[2]), variant };
    }
  }

  if (!ARABIC_LETTER.test(query)) return { kind: "unsupported" };
  const diacritics = hasDiacritics(query);
  const words = [
    ...new Set(
      query
        .split(/\s+/)
        .map((word) => searchKey(word, { diacritics }))
        .filter((word) => ARABIC_LETTER.test(word)),
    ),
  ].slice(0, MAX_WORDS);
  if (words.length === 0) return { kind: "unsupported" };
  return { kind: "text", words, diacritics };
}

// "Сахих аль-Бухари 3951", "Бухари № 3951", "Муслим 8b": a collection name,
// a number and, for a narration, its letter.
const NAMES = Object.values(COLLECTION_NAMES)
  .flat()
  .map((name) => name.replace(/ /g, "\\s+"))
  .join("|");
export const HADITH_REFERENCE = new RegExp(
  `(?<![\\p{L}])(?:${ARTICLE})?(${NAMES})\\s*(?:№\\s*)?(\\d{1,5})([a-z]{1,2}|[а-я])?(?![\\p{L}\\d:])`,
  "giu",
);

export function referencedWork(name: string) {
  return workOf(name);
}
