// Parsing of Quran search queries and highlighting of matches. No database
// access here, so everything is unit-tested.
import { hasDiacritics, searchKey } from "./arabic.ts";
import { plainKey } from "./plain-key.ts";

export const MAX_QUERY_LENGTH = 200;
const MAX_WORDS = 10;
const MAX_RANGE = 300;

export type ParsedQuery =
  | { kind: "empty" }
  | { kind: "sura"; sura: number }
  | { kind: "ayahs"; sura: number; from: number; to: number }
  | { kind: "text"; words: string[]; diacritics: boolean }
  | { kind: "translation"; words: string[] } // Russian words: searched in the translation
  | { kind: "unsupported" }
  | { kind: "invalid" };

const ARABIC_LETTER = /[ء-يٱ-ۓۺ-ۿ]/;
const CYRILLIC_LETTER = /[а-яё]/i;
const ADDRESS_WORDS = /^(?:коран|quran|qur'?an|сура|sura|surah)(?=[\s.\d]|$)\.?\s*/iu;

function toAsciiDigits(text: string) {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

export function parseQuery(input: string): ParsedQuery {
  const query = input.trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return { kind: "empty" };

  // Addresses: "2:255", "2:255-257", "quran.2.255", "Коран 2:255", "112".
  let address = toAsciiDigits(query).replace(ADDRESS_WORDS, "").trim();
  address = address.replace(/^quran\./i, "");
  const match = address.match(/^(\d{1,3})(?:\s*[:.\s]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?$/);
  if (match) {
    const sura = Number(match[1]);
    if (sura < 1 || sura > 114) return { kind: "invalid" };
    if (!match[2]) return { kind: "sura", sura };
    const from = Number(match[2]);
    const to = match[3] ? Number(match[3]) : from;
    if (from < 1 || to < from || to - from >= MAX_RANGE) return { kind: "invalid" };
    return { kind: "ayahs", sura, from, to };
  }

  // Russian words: the translation (its search form, plain-key.ts).
  if (!ARABIC_LETTER.test(query) && CYRILLIC_LETTER.test(query)) {
    const words = [...new Set(plainKey(query).split(" ").filter((word) => CYRILLIC_LETTER.test(word)))].slice(0, MAX_WORDS);
    return words.length ? { kind: "translation", words } : { kind: "unsupported" };
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

// LIKE patterns matching every word anywhere in the search column.
export function likePatterns(words: string[]) {
  return words.map((word) => `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
}

export type Piece = { text: string; match: boolean };

function matches(token: string, words: string[], diacritics: boolean) {
  const key = searchKey(token, { diacritics });
  return key !== "" && words.some((word) => key.includes(word));
}

// Words of a text that carry letters (pause marks and spaces do not count).
function letterWords(text: string) {
  return text.split(/\s+/).filter((token) => searchKey(token) !== "");
}

// Splits a source text into pieces, marking the words that contain a query
// word. Each word is compared through the same search form as the database.
// "alt" is the same ayah in another script (standard spelling): when its words
// line up one to one with the source, a match in "alt" marks the source word.
export function highlight(
  text: string,
  words: string[],
  diacritics: boolean,
  alt?: string | null,
): Piece[] {
  if (words.length === 0) return [{ text, match: false }];
  const altWords = alt ? letterWords(alt) : [];
  const aligned = altWords.length > 0 && altWords.length === letterWords(text).length;

  const pieces: Piece[] = [];
  let index = 0;
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    let match = false;
    if (!/\s/.test(token) && searchKey(token) !== "") {
      match =
        matches(token, words, diacritics) ||
        (aligned && matches(altWords[index], words, diacritics));
      index += 1;
    }
    const last = pieces.at(-1);
    if (last && last.match === match) last.text += token;
    else pieces.push({ text: token, match });
  }
  return pieces;
}

// Pieces of a translation's plain text with the words that contain a query
// word marked (words are compared through plainKey, like the database).
export function highlightPlain(text: string, words: string[]): Piece[] {
  return text
    .split(/(\s+)/)
    .map((token) => ({ text: token, match: words.some((word) => plainKey(token).includes(word)) && /\S/.test(token) }));
}
