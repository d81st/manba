// Parsing of hadith search queries and of hadith references in text, such as
// "Бухари 3951". No database access here, so everything is unit-tested.
import { hasDiacritics, searchKey } from "./arabic.ts";
import { MAX_QUERY_LENGTH } from "./quran-query.ts";

// How collections are named in references and how their addresses are
// built; only loaded collections are listed: the six Sunni books in their
// traditional order, then the Shia ones.
//   number    — bukhari.3951: one text per number (in the Musnad, ahmad.24009.2
//               is "24009/2", a hadith the editors added after 24009)
//   narration — muslim.8.2: narrations of one number, "Муслим 8b"
//   chapter   — kafi.4.60.3: book, chapter, number in the chapter, "аль-Кафи 4.60.3"
export type Scheme = "number" | "narration" | "chapter";
// label — how a reference is written back in forms: "Муслим 8b".
export const COLLECTIONS: Record<string, { names: string[]; scheme: Scheme; label: string }> = {
  bukhari: { names: ["бухари", "bukhari"], scheme: "number", label: "Бухари" },
  muslim: { names: ["муслим", "муслима", "muslim"], scheme: "narration", label: "Муслим" },
  abu_dawud: {
    names: ["абу дауд", "абу дауда", "абу-дауд", "abu dawud", "abu dawood"],
    scheme: "number",
    label: "Абу Дауд",
  },
  tirmidhi: { names: ["тирмизи", "tirmidhi"], scheme: "narration", label: "Тирмизи" },
  nasai: { names: ["насаи", "nasai"], scheme: "narration", label: "Насаи" },
  ibn_majah: {
    names: ["ибн маджа", "ибн маджи", "ибн маджах", "ibn majah", "ibn maja"],
    scheme: "number",
    label: "Ибн Маджа",
  },
  ahmad: { names: ["ахмад", "ахмада", "ahmad", "муснад ахмада", "musnad ahmad"], scheme: "number", label: "Ахмад" },
  kafi: { names: ["кафи", "kafi"], scheme: "chapter", label: "аль-Кафи" },
};
export const COLLECTION_ORDER = Object.keys(COLLECTIONS);

export function schemeOf(work: string): Scheme {
  return COLLECTIONS[work]?.scheme ?? "number";
}

// The Arabic article before a name: "аль-Бухари", "ат-Тирмизи", "an-Nasai".
const ARTICLE = "(?:аль|ал|ат|ан|ас|аш|ад|аз|ар|al|at|an|as|ash|ad|az|ar)-";
export const DEFAULT_COLLECTION = "bukhari";

const MAX_WORDS = 10;
const ARABIC_LETTER = /[ء-يٱ-ۓۺ-ۿ]/;

export type HadithQuery =
  | { kind: "empty" }
  | { kind: "ref"; work: string; path: number[] }
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

// The address of a hadith after the work id, as numbers: [3951], [8, 2],
// [4, 60, 3]. Read from its written form: "3951", "8b" or "8.2", "4.60.3";
// shorter forms ("8", "4.60") name the whole hadith or chapter.
export function parseRef(scheme: Scheme, text: string): number[] | null {
  const m = text.match(/^(\d{1,5})((?:\.\d{1,4}){0,2}|\/\d{1,3})\s?(\p{L}{1,2})?$/u);
  if (!m) return null;
  const path = [Number(m[1]), ...m[2].split(/[./]/).filter(Boolean).map(Number)];
  if (path.some((n) => n < 1)) return null;
  if (scheme === "chapter") return m[3] || m[2].startsWith("/") ? null : path;
  if (scheme === "number") return path.length <= 2 ? path : null; // a letter after it is ignored
  if (m[2].startsWith("/")) return null;
  if (m[3]) {
    const variant = parseVariant(m[3]);
    return variant && path.length === 1 ? [path[0], variant] : null;
  }
  return path.length <= 2 ? path : null;
}

// How a hadith is written after the collection's name: "3951", "8b" (the
// letter only when the number has several narrations), "4.60.3".
export function refLabel(scheme: Scheme, path: number[], variants = 2) {
  if (scheme === "narration" && path.length === 2) {
    return variants > 1 ? `${path[0]}${variantLetters(path[1])}` : String(path[0]);
  }
  return path.join(scheme === "number" ? "/" : ".");
}

// Permanent link of a hadith: /hadith/bukhari/3951, /hadith/muslim/8b,
// /hadith/kafi/4.60.3, /hadith/ahmad/24009.2 (no slash inside a link).
export function hadithPath(work: string, path: number[]) {
  const scheme = schemeOf(work);
  return `/hadith/${work}/${scheme === "number" ? path.join(".") : refLabel(scheme, path)}`;
}

// Anchor of a hadith on its book page.
export function hadithAnchor(path: number[]) {
  return `h-${path.join("-")}`;
}

function workOf(name: string) {
  const key = name
    .toLowerCase()
    .replace(new RegExp(`^${ARTICLE}`), "")
    .replace(/\s+/g, " ");
  return Object.entries(COLLECTIONS).find(([, c]) => c.names.includes(key))?.[0];
}

export function parseHadithQuery(input: string, work = DEFAULT_COLLECTION): HadithQuery {
  const query = toAsciiDigits(input.trim().slice(0, MAX_QUERY_LENGTH));
  if (!query) return { kind: "empty" };

  // "3951", "Бухари 3951", "аль-Бухари № 3951", "bukhari.3951", "Муслим 8b",
  // "muslim.8.2", "аль-Кафи 4.60.3", "Ахмад 24009/2"
  const ref = query.match(/^(?:([\p{L}-]+(?:\s+[\p{L}-]+)?)\s*[.\s]\s*(?:№\s*)?)?(\d[\d./]*(?:\s?\p{L}{1,2})?)$/u);
  if (ref) {
    const named = ref[1] ? workOf(ref[1]) : work;
    const path = named ? parseRef(schemeOf(named), ref[2]) : null;
    if (named && path) return { kind: "ref", work: named, path };
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

// "Сахих аль-Бухари 3951", "Бухари № 3951", "Муслим 8b", "аль-Кафи 4.60.3",
// "Ахмад 24009/2":
// a collection name, then the hadith as written.
const NAMES = Object.values(COLLECTIONS)
  .flatMap((c) => c.names)
  .map((name) => name.replace(/ /g, "\\s+"))
  .join("|");
export const HADITH_REFERENCE = new RegExp(
  `(?<![\\p{L}])(?:${ARTICLE})?(${NAMES})\\s*(?:№\\s*)?(\\d{1,5}(?:(?:\\.\\d{1,4}){1,2}|\\/\\d{1,3})?(?:[a-z]{1,2}|[а-я])?)(?![\\p{L}\\d:/])`,
  "giu",
);

export function referencedWork(name: string) {
  return workOf(name);
}

// One reference typed in a form ("Бухари 3951", "аль-Кафи 4.60.3"): its
// library address, or null.
const HADITH_TOKEN = new RegExp(`^(?:${ARTICLE})?(${NAMES})\\s*(?:№\\s*)?(\\S+)$`, "iu");

export function parseHadithRef(text: string): string | null {
  const m = text.trim().match(HADITH_TOKEN);
  const work = m ? workOf(m[1]) : undefined;
  const path = work ? parseRef(schemeOf(work), m![2]) : null;
  return work && path ? [work, ...path].join(".") : null;
}

// A hadith address written back for a form: muslim.8.2 -> "Муслим 8b".
export function formatHadithRef(address: string) {
  const [work, ...rest] = address.split(".");
  const label = COLLECTIONS[work]?.label ?? work;
  return `${label} ${refLabel(schemeOf(work), rest.map(Number))}`;
}
