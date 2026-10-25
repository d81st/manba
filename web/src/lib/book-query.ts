// References to books cited by volume and page of their edition, such as the
// Sira of Ibn Hisham: "Ибн Хишам 1:235", a piece of a page "1:235b" (a page
// is cut into pieces only where a chapter starts on it). No database here.
import { parseHadithQuery, parseVariant, variantLetters } from "./hadith-query.ts";

// label — how a reference is written back in forms.
export const BOOKS: Record<string, { names: string[]; label: string }> = {
  ibn_hisham: { names: ["ибн хишам", "ибн хишама", "сира ибн хишама", "ibn hisham"], label: "Ибн Хишам" },
};
export const BOOK_IDS = Object.keys(BOOKS);

export function isBook(work: string) {
  return work in BOOKS;
}

// [1, 235] or [1, 235, 2] -> "1:235", "1:235b"; the letter only when the page has several pieces.
export function pageLabel(path: number[], pieces = 2) {
  const [volume, page, piece] = path;
  return `${volume}:${page}${piece !== undefined && pieces > 1 ? variantLetters(piece) : ""}`;
}

// "1:235", "1:235b", "1.235", "1.235.2" -> [1, 235] or [1, 235, 2].
export function parsePageRef(text: string): number[] | null {
  const m = text.trim().match(/^(\d{1,2})[:.](\d{1,4})(?:([a-zа-я]{1,2})|\.(\d{1,2}))?$/i);
  if (!m) return null;
  const [volume, page] = [Number(m[1]), Number(m[2])];
  if (volume < 1 || page < 1) return null;
  if (m[3]) {
    const piece = parseVariant(m[3].toLowerCase());
    return piece ? [volume, page, piece] : null;
  }
  return m[4] ? [volume, page, Number(m[4])] : [volume, page];
}

// Link to a page or a piece: /library/ibn_hisham/1.235, /library/ibn_hisham/1.235.2
export function bookPath(work: string, path: number[]) {
  return `/library/${work}/${path.join(".")}`;
}

export function bookAnchor(path: number[]) {
  return `p-${path.join("-")}`;
}

const NAMES = Object.entries(BOOKS)
  .flatMap(([work, { names }]) => names.map((name) => ({ work, name })))
  .sort((a, b) => b.name.length - a.name.length);

// "Ибн Хишам 1:235b" -> ibn_hisham.1.235.2
export function parseBookRef(text: string): string | null {
  const lower = text.trim().toLowerCase().replace(/\s+/g, " ");
  for (const { work, name } of NAMES) {
    if (!lower.startsWith(`${name} `)) continue;
    const path = parsePageRef(lower.slice(name.length + 1));
    return path ? [work, ...path].join(".") : null;
  }
  return null;
}

// ibn_hisham.1.235.2 -> "Ибн Хишам 1:235b"
export function formatBookRef(address: string) {
  const [work, ...rest] = address.split(".");
  return `${BOOKS[work]?.label ?? work} ${pageLabel(rest.map(Number))}`;
}

// A reference inside running text: "… см. Ибн Хишам 1:235b …".
const NAME_PATTERN = NAMES.map(({ name }) => name.replace(/ /g, "\\s+")).join("|");
export const BOOK_REFERENCE = new RegExp(
  `(?<![\\p{L}])(${NAME_PATTERN})\\s+(\\d{1,2}[:.]\\d{1,4}(?:[a-zа-я]{1,2})?)(?![\\p{L}\\d:]|\\.\\d)`,
  "giu",
);

export function referencedBook(name: string) {
  const lower = name.toLowerCase().replace(/\s+/g, " ");
  return NAMES.find((n) => n.name === lower)?.work ?? null;
}

export type BookQuery =
  | { kind: "empty" }
  | { kind: "unsupported" }
  | { kind: "ref"; path: number[] }
  | { kind: "text"; words: string[]; diacritics: boolean };

// The search box of a book: a page ("1:235", "1:235b", "Ибн Хишам 1:235")
// or Arabic words, read the same way as in the hadith search.
export function parseBookQuery(input: string, work: string): BookQuery {
  const query = input.trim();
  if (!query) return { kind: "empty" };
  const named = parseBookRef(query);
  if (named) {
    const [book, ...path] = named.split(".");
    return book === work ? { kind: "ref", path: path.map(Number) } : { kind: "unsupported" };
  }
  const page = parsePageRef(query);
  if (page) return { kind: "ref", path: page };
  const parsed = parseHadithQuery(query);
  return parsed.kind === "text" || parsed.kind === "empty" ? parsed : { kind: "unsupported" };
}
