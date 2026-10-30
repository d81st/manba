// Texts of other religions («внешние источники», docs/PLAN.md «Истоки и
// связи»): the Hebrew Bible (tanakh), the New Testament (nt) and the Mishnah
// (mishnah), addressed book.chapter.verse (docs/ADDRESSES.md). The book list
// is external-books.json (also read by data/sources/external/prepare.py). No database here.
import books from "./external-books.json";

export type ExternalWork = "tanakh" | "nt" | "mishnah";
export type ExternalBook = { n: number; ru: string; short: string; original: string; aliases: string[] };

const toBook = (b: { n: number; ru: string; short?: string; he?: string; aliases: string[] }): ExternalBook => ({
  n: b.n,
  ru: b.ru,
  short: b.short ?? b.ru,
  original: b.he ?? "",
  aliases: b.aliases,
});

export const EXTERNAL_WORKS: Record<ExternalWork, { books: ExternalBook[]; language: string; dir: "rtl" | "ltr"; prefix: string }> = {
  tanakh: { books: books.tanakh.map(toBook), language: "he", dir: "rtl", prefix: "" },
  nt: { books: books.nt.map(toBook), language: "grc", dir: "ltr", prefix: "" },
  mishnah: { books: books.mishnah.map(toBook), language: "he", dir: "rtl", prefix: "Мишна " },
};
export const EXTERNAL_IDS = Object.keys(EXTERNAL_WORKS) as ExternalWork[];

export function isExternal(work: string): work is ExternalWork {
  return work in EXTERNAL_WORKS;
}

export function externalBook(work: ExternalWork, n: number) {
  return EXTERNAL_WORKS[work].books.find((b) => b.n === n) ?? null;
}

// tanakh.2.21.24 -> "Исход 21:24"; tanakh.2.21 -> "Исход 21"; mishnah.34.4.5 -> "Мишна Санхедрин 4:5".
export function externalLabel(address: string) {
  const [work, ...path] = address.split(".");
  if (!isExternal(work)) return address;
  const [b, chapter, verse] = path.map(Number);
  const book = externalBook(work, b);
  const name = `${EXTERNAL_WORKS[work].prefix}${book?.ru ?? b}`;
  return chapter ? `${name} ${chapter}${verse ? `:${verse}` : ""}` : name;
}

// Reading page of the chapter, at the verse.
export function externalHref(address: string) {
  const [work, b, chapter, verse] = address.split(".");
  return `/external/${work}/${b}/${chapter ?? 1}${verse ? `#${verse}` : ""}`;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[.\s]+/g, " ").trim();

// Names a book is written by: the Synodal name, the short form, other forms.
const NAMES: { work: ExternalWork; n: number; name: string }[] = EXTERNAL_IDS.flatMap((work) =>
  EXTERNAL_WORKS[work].books.flatMap((b) =>
    [b.ru, b.short, ...b.aliases].flatMap((name) => {
      const forms = [norm(name)];
      // "От Матфея" is also written "Матфея", "1 Царств" also "1Царств".
      if (/^от /.test(forms[0])) forms.push(forms[0].slice(3));
      if (/^\d /.test(forms[0])) forms.push(forms[0].replace(" ", ""));
      return forms.map((f) => ({ work, n: b.n, name: f }));
    }),
  ),
).sort((a, b) => b.name.length - a.name.length);

const MAX_VERSES = 40;

// "Исход 21:23-25", "Исх 21:24", "Пс 37:29", "От Матфея 5:38-39", "Мишна Санхедрин 4:5",
// or a machine address "tanakh.2.21.24" -> addresses of the verses; null if not a reference.
export function parseExternalRef(text: string): string[] | null {
  const token = text.trim();
  const machine = token.match(/^(tanakh|nt|mishnah)\.(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/);
  if (machine) {
    const [, work, b, c, from, to] = machine;
    return verses(work as ExternalWork, Number(b), Number(c), Number(from), Number(to ?? from));
  }
  let rest = norm(token);
  let mishnah = false;
  if (rest.startsWith("мишна ")) {
    mishnah = true;
    rest = rest.slice("мишна ".length);
  }
  const m = rest.match(/^(.+?) ?(\d{1,3})[:.](\d{1,3})(?: ?[-–] ?(\d{1,3}))?$/);
  if (!m) return null;
  const name = m[1].trim();
  const hit = NAMES.find((x) => x.name === name && (x.work === "mishnah") === mishnah);
  if (!hit) return null;
  return verses(hit.work, hit.n, Number(m[2]), Number(m[3]), Number(m[4] ?? m[3]));
}

function verses(work: ExternalWork, b: number, chapter: number, from: number, to: number) {
  if (!externalBook(work, b) || chapter < 1 || from < 1 || to < from || to - from >= MAX_VERSES) return null;
  return Array.from({ length: to - from + 1 }, (_, i) => `${work}.${b}.${chapter}.${from + i}`);
}

// tanakh.2.21.23, .24, .25 -> "Исход 21:23-25" (for editing and display).
export function formatExternalRefs(addresses: string[]) {
  const parts: string[] = [];
  let run: { prefix: string; label: string; last: number } | null = null;
  for (const address of addresses) {
    const p = address.split(".");
    const prefix = p.slice(0, 3).join(".");
    const verse = Number(p[3]);
    if (run && run.prefix === prefix && verse === run.last + 1) {
      run.last = verse;
      continue;
    }
    if (run) parts.push(close(run));
    run = { prefix, label: externalLabel(address), last: verse };
  }
  if (run) parts.push(close(run));
  return parts.join(", ");
}

function close(run: { label: string; last: number }) {
  const from = Number(run.label.split(":").at(-1));
  return run.last > from ? `${run.label}-${run.last}` : run.label;
}

// Names as written in running text, longest first.
const TEXT_NAMES = EXTERNAL_IDS.flatMap((work) =>
  EXTERNAL_WORKS[work].books.flatMap((b) =>
    [b.ru, b.short, ...b.aliases].map((name) => ({ name: `${EXTERNAL_WORKS[work].prefix}${name}`, work, n: b.n })),
  ),
).sort((a, b) => b.name.length - a.name.length);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TEXT_REF = new RegExp(
  `(?<![\\p{L}])(${TEXT_NAMES.map((x) => escape(x.name)).join("|")}) (\\d{1,3}):(\\d{1,3})(?:[–-](\\d{1,3}))?`,
  "gu",
);

// "… Исход 21:23–25 …" -> pieces of text, references to other religions' texts
// with their links; the rest is left to the links of Islam's sources.
export function linkExternal(text: string): { text: string; href?: string }[] {
  const pieces: { text: string; href?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(TEXT_REF)) {
    const hit = TEXT_NAMES.find((x) => x.name === m[1])!;
    if (m.index > last) pieces.push({ text: text.slice(last, m.index) });
    pieces.push({ text: m[0], href: externalHref(`${hit.work}.${hit.n}.${m[2]}.${m[3]}`) });
    last = m.index + m[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}
