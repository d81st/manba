// Parses a hadith collection in the OpenITI layout where every narration is
// its own paragraph opening with the edition's hadith number ("# 8 حدثني"),
// as in the al-Jami' al-Kabir exports (JK). Several narrations share a number
// (variant chains of one hadith); each becomes its own item, numbered in
// reading order inside its hadith: 8 → 8.1, 8.2, ... Headings are
// "# | 1 ( 3 باب ... )" and "# | 1 ( 2 كتاب ... )". Everything the parser
// had to decide on its own is listed in the report.
import { cleanLine } from "./openiti-hadith.ts";

export type NarrationBook = { number: number; title: string };

export type NarrationChapter = {
  book: number;
  index: number; // order inside the book, from 1
  title: string;
  intro: string[]; // the edition's text under the heading before the first narration
};

export type Narration = {
  number: number; // the edition's hadith number
  variant: number; // order among the narrations with this number, from 1
  ordinal: number; // reading order in the edition, from 1
  book: number;
  chapter: number;
  paragraphs: string[];
};

export type NarrationReport = {
  narrations: number;
  numbers: number; // distinct hadith numbers
  missing: number[]; // numbers in 1..max with no narration
  // A number lower than one already passed: in this edition, a repeated
  // hadith keeps the number of its first place (and chains interleave).
  backReferences: { number: number; book: number; after: number }[];
  glued: { raw: string; number: number }[]; // "291429132913 2913": the number after the glued run is taken
  numberedHeadings: string[]; // "# 33 باب ...": a heading typed as a numbered paragraph
  textHeadings: string[]; // "# | 1 ( قال ... )": text typed as a heading, kept as text
  appended: number; // unnumbered paragraphs kept with the narration before them (verse lines, split text)
};

export type NarrationCollection = {
  meta: Record<string, string>;
  books: NarrationBook[];
  chapters: NarrationChapter[];
  narrations: Narration[];
  report: NarrationReport;
};

// The introduction before book 1: the author's preface with its own chapters.
const PREFACE: NarrationBook = { number: 0, title: "مقدمة" };

// Footnote references (the notes themselves are not in the export), the
// matn separator "*", and the hemistich separator "%" of verse lines.
function clean(text: string) {
  return cleanLine(
    text
      .replace(/\\\s*\d*\s*\\/g, " ")
      .replace(/\s*\*\s*/g, " ")
      .replace(/\s*%\s*/g, " … "),
  );
}

type Block = { kind: "heading" | "para"; text: string };

function blocks(lines: string[]): Block[] {
  const out: Block[] = [];
  for (const raw of lines) {
    if (raw.startsWith("# |")) out.push({ kind: "heading", text: raw.slice(3) });
    else if (raw.startsWith("# ")) out.push({ kind: "para", text: raw.slice(2) });
    else if (raw.startsWith("~~") && out.length) out[out.length - 1].text += ` ${raw.slice(2)}`;
  }
  return out.map((b) => ({ kind: b.kind, text: clean(b.text) }));
}

export function parseOpenitiNarrations(source: string): NarrationCollection {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");
  const meta: Record<string, string> = {};
  for (const line of lines.slice(0, end)) {
    const m = line.match(/^#META# \d+\.(\w+)\s*::\s*(.*)$/);
    if (m && m[2].trim() !== "NODATA") meta[m[1]] = m[2].trim();
  }

  const books: NarrationBook[] = [{ ...PREFACE }];
  const chapters: NarrationChapter[] = [];
  const narrations: Narration[] = [];
  const report: NarrationReport = {
    narrations: 0,
    numbers: 0,
    missing: [],
    backReferences: [],
    glued: [],
    numberedHeadings: [],
    textHeadings: [],
    appended: 0,
  };

  let book = PREFACE.number;
  let chapter = 0;
  let current: Narration | null = null;
  let highest = 0;
  const variants = new Map<number, number>();

  const openChapter = (title: string) => {
    chapter += 1;
    chapters.push({ book, index: chapter, title, intro: [] });
    current = null;
  };
  const addText = (text: string) => {
    if (current) {
      current.paragraphs.push(text);
      report.appended += 1;
      return;
    }
    if (chapter === 0) openChapter("");
    chapters[chapters.length - 1].intro.push(text);
  };

  const all = blocks(lines.slice(end + 1));
  // The export opens with the book's title glued to the first paragraph.
  const title = meta.BookTITLE;
  if (title && all[0]?.kind === "para" && all[0].text.startsWith(title)) {
    all[0].text = all[0].text.slice(title.length).trim();
  }

  for (const block of all) {
    if (!block.text) continue;
    if (block.kind === "heading") {
      // "1 ( 3 باب ... )": the level digit, then the edition's heading in brackets.
      const inner = block.text
        .replace(/^\d+\s*/, "")
        .replace(/^\(\s*/, "")
        .replace(/\s*\)$/, "")
        .trim();
      const heading = inner.match(/^(?:(\d+)\s+)?((?:كتاب|باب)(?:\s.*)?)$/);
      if (!heading) {
        if (inner) {
          report.textHeadings.push(inner);
          addText(inner);
        }
        continue;
      }
      const [, number, text] = heading;
      if (text.startsWith("كتاب") && number) {
        const n = Number(number);
        if (books.some((b) => b.number === n)) throw new Error(`OpenITI: book ${n} twice`);
        books.push({ number: n, title: text });
        book = n;
        chapter = 0;
        current = null;
      } else {
        // A chapter, or an unnumbered book heading that continues the book before it.
        openChapter(text);
      }
      continue;
    }

    const numbered = block.text.match(/^(\d+)\s+(.*)$/);
    if (!numbered) {
      addText(block.text);
      continue;
    }
    let number = Number(numbered[1]);
    let text = numbered[2];
    if (numbered[1].length > 4) {
      const next = text.match(/^(\d{1,4})\s+(.*)$/);
      if (!next) throw new Error(`OpenITI: unreadable number: ${block.text.slice(0, 40)}`);
      report.glued.push({ raw: numbered[1], number: Number(next[1]) });
      number = Number(next[1]);
      text = next[2];
    }
    if (/^باب(?:\s|$)/.test(text)) {
      report.numberedHeadings.push(block.text);
      openChapter(text);
      continue;
    }
    if (chapter === 0) openChapter("");
    if (number < highest) report.backReferences.push({ number, book, after: highest });
    highest = Math.max(highest, number);
    const variant = (variants.get(number) ?? 0) + 1;
    variants.set(number, variant);
    current = { number, variant, ordinal: narrations.length + 1, book, chapter, paragraphs: [text] };
    narrations.push(current);
  }

  report.narrations = narrations.length;
  report.numbers = variants.size;
  for (let n = 1; n <= highest; n++) if (!variants.has(n)) report.missing.push(n);
  // Books are listed in the order of their numbers; the preface only if it has text.
  const used = books.filter((b) => b.number !== PREFACE.number || chapters.some((c) => c.book === b.number));
  return { meta, books: used, chapters, narrations, report };
}
