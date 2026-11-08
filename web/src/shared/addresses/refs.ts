// References to places of the library written by hand ("2:255", "Бухари 3951",
// "Ибн Хишам 1:235"): reading, writing back and turning into links. No database here.
import { BOOK_REFERENCE, formatBookRef, isBook, parseBookPath, parseBookRef, referencedBook } from "./book-query.ts";
import { formatHadithRef, HADITH_REFERENCE, parseHadithRef, parseRef, referencedWork, schemeOf } from "./hadith-query.ts";
import { parseQuery } from "./quran-query.ts";

// Longest ayah range accepted in one reference.
const MAX_RANGE = 30;

// "2:106, 16:101-102, Бухари 3951" -> quran.2.106, quran.16.101, quran.16.102,
// bukhari.3951: ayahs and hadiths of the library.
export function parseRefs(text: string) {
  const addresses: string[] = [];
  const invalid: string[] = [];
  const add = (address: string) => {
    if (!addresses.includes(address)) addresses.push(address);
  };
  for (const token of text.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean)) {
    const book = parseBookRef(token);
    if (book) {
      add(book);
      continue;
    }
    const hadith = parseHadithRef(token);
    if (hadith) {
      add(hadith);
      continue;
    }
    const parsed = parseQuery(token);
    if (parsed.kind !== "ayahs" || parsed.to - parsed.from >= MAX_RANGE) {
      invalid.push(token);
      continue;
    }
    for (let ayah = parsed.from; ayah <= parsed.to; ayah++) add(`quran.${parsed.sura}.${ayah}`);
  }
  return { addresses, invalid };
}

// quran.16.101, quran.16.102, bukhari.3951 -> "16:101-102, Бухари 3951"
// (for editing and display)
export function formatRefs(addresses: string[]) {
  const parts: string[] = [];
  let start: [number, number] | null = null;
  let previous: [number, number] | null = null;
  const flush = () => {
    if (!start || !previous) return;
    parts.push(start[1] === previous[1] ? `${start[0]}:${start[1]}` : `${start[0]}:${start[1]}-${previous[1]}`);
    start = previous = null;
  };
  for (const address of addresses) {
    if (!address.startsWith("quran.")) {
      flush();
      parts.push(isBook(address.split(".")[0]) ? formatBookRef(address) : formatHadithRef(address));
      continue;
    }
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
  | { work: string; path: number[]; text: string }
  | { book: string; path: number[]; text: string };

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
    const path = parseRef(schemeOf(work), match[2]);
    if (!path) continue;
    found.push({ index: match.index, length: match[0].length, piece: { work, path, text: match[0] } });
  }
  for (const match of text.matchAll(BOOK_REFERENCE)) {
    const book = referencedBook(match[1]);
    const path = book ? parseBookPath(book, match[2]) : null;
    if (!book || !path) continue;
    found.push({ index: match.index, length: match[0].length, piece: { book, path, text: match[0] } });
  }
  // Earlier and longer matches first: "Ибн Хишам 1:235" wins over the "1:235" inside it.
  found.sort((a, b) => a.index - b.index || b.length - a.length);

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
