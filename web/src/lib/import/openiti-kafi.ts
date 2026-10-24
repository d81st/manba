// Parses al-Kafi of al-Kulayni in the OpenITI layout of the Ghaffari edition
// (Dar al-Kutub al-Islamiyya): "### | كتاب ..." a book, "### || باب ..." a
// chapter, and hadiths numbered "N - " anew in every chapter (in the last
// book, al-Rawda, the numbers run on through its sections: a book where most
// numbered sections do not start at 1 is read that way). The export often
// lost the paragraph break before a number ("... وعرج. 3 - أحمد بن ..."), so a
// number inside a paragraph is taken only when it is exactly the next one
// expected; numbers the export lost are reported, never invented.
import { cleanLine } from "./openiti-hadith.ts";

export type KafiBook = { number: number; title: string };
export type KafiChapter = { book: number; index: number; title: string; intro: string[] };
export type KafiHadith = {
  book: number;
  chapter: number;
  number: number; // as printed: inside the chapter (in al-Rawda, inside the book)
  ordinal: number;
  paragraphs: string[];
};
export type KafiReport = {
  hadiths: number;
  inline: number; // numbers found inside a paragraph and split there
  // Numbers skipped in a chapter: the export lost them, so the text stays
  // with the hadith before (merged), to be checked against the print.
  gaps: { book: number; chapter: number; numbers: number[] }[];
  ignored: { book: number; chapter: number; text: string }[]; // number-like starts that break the order
  runOn: number[]; // books whose numbers run on through their sections (al-Rawda)
};
export type KafiCollection = { books: KafiBook[]; chapters: KafiChapter[]; hadiths: KafiHadith[]; report: KafiReport };

// How far a paragraph may skip ahead (numbers lost in the export).
const MAX_SKIP = 3;
// A number before a hadith: "N - " after a space, or at the start of a
// paragraph also without the dash ("1 علي بن إبراهيم").
const MARKER = /(?:^|\s)(\d{1,3})\s*-\s+(?=\S)|^(\d{1,3})\s+(?=[^\d\s-])/g;

function clean(text: string) {
  return cleanLine(text);
}

function headingTitle(text: string) {
  return clean(text)
    .replace(/[()[\]*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseOpenitiKafi(source: string): KafiCollection {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");

  const books: KafiBook[] = [{ number: 0, title: "" }];
  const chapters: KafiChapter[] = [];
  const hadiths: KafiHadith[] = [];
  const report: KafiReport = { hadiths: 0, inline: 0, gaps: [], ignored: [], runOn: [] };

  // Paragraphs per section, in reading order.
  type Section = { book: number; title: string; paragraphs: string[] };
  const sections: Section[] = [];
  let book = 0;
  let section: Section | null = null;
  for (const raw of lines.slice(end + 1)) {
    if (raw.startsWith("### ||")) {
      section = { book, title: headingTitle(raw.replace(/^### \|+/, "")), paragraphs: [] };
      sections.push(section);
    } else if (raw.startsWith("### |")) {
      const title = headingTitle(raw.slice(5));
      if (/كتاب/.test(title) || !title) {
        if (title) {
          book += 1;
          books.push({ number: book, title });
        }
        section = { book, title: "", paragraphs: [] };
      } else {
        // A part inside a book ("أبواب الصدقة"): a heading of its own.
        section = { book, title, paragraphs: [] };
      }
      sections.push(section);
    } else if (raw.startsWith("# ")) {
      const text = clean(raw.slice(2));
      if (!text) continue;
      if (!section) {
        section = { book, title: "", paragraphs: [] };
        sections.push(section);
      }
      section.paragraphs.push(text);
    } else if (raw.startsWith("~~") && section?.paragraphs.length) {
      const text = clean(raw.slice(2));
      if (text) section.paragraphs[section.paragraphs.length - 1] += ` ${text}`;
    }
  }

  // Text under a book's heading before its first chapter, with no hadiths
  // ("بسم الله الرحمن الرحيم"), opens that chapter: it is not a chapter of its
  // own, so chapter numbers follow the edition's chapters ("باب").
  for (let i = sections.length - 2; i >= 0; i--) {
    const head = sections[i];
    const next = sections[i + 1];
    const numbered = head.paragraphs.some((p) => /^\d{1,3}\s/.test(p));
    if (!head.title && !numbered && next.book === head.book && next.title) {
      next.paragraphs.unshift(...head.paragraphs);
      sections.splice(i, 1);
    } else if (head.title && head.paragraphs.length === 0 && next.book === head.book && next.title) {
      // A heading over several chapters ("أبواب الصدقة") is shown above the first of them.
      next.paragraphs.unshift(head.title);
      sections.splice(i, 1);
    }
  }

  // Books whose numbers run on through their sections (al-Rawda): most of
  // their numbered sections do not start at 1.
  const firstNumber = (s: Section) => Number(s.paragraphs.map((p) => p.match(/^(\d{1,3})\s*-\s/)).find(Boolean)?.[1]);
  const runOn = new Set<number>();
  for (const b of books) {
    const starts = sections.filter((s) => s.book === b.number).map(firstNumber).filter((n) => n > 0);
    if (starts.length > 1 && starts.filter((n) => n === 1).length * 2 < starts.length) runOn.add(b.number);
  }

  let last = 0; // last number taken, across sections of a book
  let lastBook = -1;
  for (const s of sections) {
    if (!s.title && s.paragraphs.length === 0) continue;
    if (s.book !== lastBook) {
      last = 0;
      lastBook = s.book;
    }
    const chapterIndex = chapters.filter((c) => c.book === s.book).length + 1;
    const chapter: KafiChapter = { book: s.book, index: chapterIndex, title: s.title, intro: [] };
    chapters.push(chapter);
    let current: KafiHadith | null = null;
    let started = false; // the chapter's numbering has begun
    const skipped: number[] = [];

    // How a number found here fits: "reset" starts the chapter's own count,
    // "next" goes on from the last number taken; null leaves it as text.
    const fit = (value: number, atStart: boolean): "reset" | "next" | null => {
      const ahead = value > last && value <= last + 1 + MAX_SKIP;
      if (!started && runOn.has(s.book)) {
        if (value === last + 1) return "next";
        return atStart && ahead ? "next" : null;
      }
      if (!started) {
        if (value === 1) return "reset";
        return atStart && value <= 1 + MAX_SKIP ? "reset" : null;
      }
      if (atStart) return ahead ? "next" : null;
      return value === last + 1 ? "next" : null;
    };
    const take = (number: number, how: "reset" | "next") => {
      started = true;
      if (how === "reset") last = 0;
      for (let n = last + 1; n < number; n++) skipped.push(n);
      last = number;
      current = { book: s.book, chapter: chapter.index, number, ordinal: hadiths.length + 1, paragraphs: [""] };
      hadiths.push(current);
    };

    for (const paragraph of s.paragraphs) {
      let pos = 0;
      for (const m of paragraph.matchAll(MARKER)) {
        const value = Number(m[1] ?? m[2]);
        const atStart = m.index === 0;
        // Without the dash a number may be part of the text: only the exact next one.
        const how = fit(value, atStart && m[1] !== undefined);
        if (!how) {
          if (atStart && m[1] !== undefined) report.ignored.push({ book: s.book, chapter: chapter.index, text: paragraph.slice(0, 40) });
          continue;
        }
        const before = paragraph.slice(pos, m.index).trim();
        if (before) {
          if (current) (current as KafiHadith).paragraphs.push(before);
          else chapter.intro.push(before);
        }
        if (!atStart) report.inline += 1;
        take(value, how);
        pos = m.index + m[0].length;
      }
      const rest = paragraph.slice(pos).trim();
      if (!rest) continue;
      const open = current as KafiHadith | null;
      if (open && open.paragraphs[open.paragraphs.length - 1] === "") open.paragraphs[open.paragraphs.length - 1] = rest;
      else if (open) open.paragraphs.push(rest);
      else chapter.intro.push(rest);
    }
    if (skipped.length) report.gaps.push({ book: s.book, chapter: chapter.index, numbers: skipped });
  }

  // A hadith whose text begins right after its number in the same paragraph
  // was opened with an empty first paragraph and filled above; drop leftovers.
  for (const h of hadiths) h.paragraphs = h.paragraphs.filter(Boolean);
  report.hadiths = hadiths.length;
  report.runOn = [...runOn];
  const used = books.filter((b) => b.number !== 0 || chapters.some((c) => c.book === 0));
  if (used[0]?.number === 0) used[0] = { number: 0, title: "خطبة الكتاب" };
  return { books: used, chapters, hadiths, report };
}
