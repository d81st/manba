// Parsing of hadith search queries and of hadith references in text, such as
// "Бухари 3951". No database access here, so everything is unit-tested.
import { hasDiacritics, searchKey } from "./arabic.ts";
import { MAX_QUERY_LENGTH } from "./quran-query.ts";

// How collections are named in references; only loaded collections are listed.
export const COLLECTION_NAMES: Record<string, string[]> = {
  bukhari: ["бухари", "bukhari"],
};
export const DEFAULT_COLLECTION = "bukhari";

const MAX_WORDS = 10;
const ARABIC_LETTER = /[ء-يٱ-ۓۺ-ۿ]/;

export type HadithQuery =
  | { kind: "empty" }
  | { kind: "number"; work: string; number: number }
  | { kind: "text"; words: string[]; diacritics: boolean }
  | { kind: "unsupported" };

function toAsciiDigits(text: string) {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

function workOf(name: string) {
  const key = name.toLowerCase().replace(/^(?:аль|ал|al)-/, "");
  return Object.entries(COLLECTION_NAMES).find(([, names]) => names.includes(key))?.[0];
}

export function parseHadithQuery(input: string, work = DEFAULT_COLLECTION): HadithQuery {
  const query = toAsciiDigits(input.trim().slice(0, MAX_QUERY_LENGTH));
  if (!query) return { kind: "empty" };

  // "3951", "Бухари 3951", "аль-Бухари № 3951", "bukhari.3951"
  const number = query.match(/^(?:([\p{L}-]+)\s*[.\s]\s*(?:№\s*)?)?(\d{1,5})$/u);
  if (number) {
    const named = number[1] ? workOf(number[1]) : work;
    if (named) return { kind: "number", work: named, number: Number(number[2]) };
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

// "Сахих аль-Бухари 3951", "Бухари № 3951": a collection name, then a number.
const NAMES = Object.values(COLLECTION_NAMES).flat().join("|");
export const HADITH_REFERENCE = new RegExp(
  `(?<![\\p{L}])(?:(?:аль|ал|al)-)?(${NAMES})\\s*(?:№\\s*)?(\\d{1,5})(?![\\d:])`,
  "giu",
);

export function referencedWork(name: string) {
  return workOf(name);
}
