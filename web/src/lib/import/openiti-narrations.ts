// Parses a hadith collection in the OpenITI layout where every narration is
// its own paragraph opening with the edition's hadith number ("# 8 حدثني"),
// as in the al-Jami' al-Kabir exports (JK). Several narrations may share a
// number (variant chains of one hadith, as in Muslim); each becomes its own
// item, numbered in reading order inside its hadith: 8 → 8.1, 8.2, ...
// Headings are "# | 1 ( 2 كتاب ... )" for a book and "# | 1 ( 3 باب ... )" or
// another title ("أبواب ...", "فضل ...") for a chapter. Everything the parser
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
  numberedHeadings: string[]; // "# 33 باب ...", "# 1 كتاب ...": a heading typed as a numbered paragraph
  textHeadings: string[]; // "# | 1 ( قال ... )": text typed as a heading, kept as text
  inferredBooks: { number: number; title: string }[]; // "أول كتاب ..." without a number: the next book number
  title: string | null; // the work's title typed as the first heading, not loaded
  repeatMarks: number; // "م" before a narration: the edition repeats the number for another chain
  appended: number; // unnumbered paragraphs kept with the narration before them (verse lines, split text)
};

export type NarrationCollection = {
  meta: Record<string, string>;
  books: NarrationBook[];
  chapters: NarrationChapter[];
  narrations: Narration[];
  report: NarrationReport;
};

// A heading that is really text: narration or speech typed as a heading.
const SPEECH = /^(?:و?ف?قال|فنزلت|و?حدثن[اي]|ثنا|و?أخبرن[اي])(?:\s|$)/;
// "2 كتاب الصلاة", "5 أول كتاب المناسك": the book number, then its title.
const BOOK = /^(?:(\d+)\s+)?(أول\s+)?(كتاب(?:\s.*)?)$/;

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

type Block = { kind: "book" | "heading" | "para"; text: string };

// Two layouts of headings: "# | 1 ( ... )", where the words tell a book from a
// chapter, and the annotated one, where the level does: "### | ( 2 كتاب ... )"
// a book, "### || ( 3 باب ... )" a chapter, "### ||| 17" the number of the
// paragraph after it. The editor's matter after "### |PARATEXT|" is not loaded.
function blocks(lines: string[]): Block[] {
  const out: Block[] = [];
  let number: string | null = null;
  for (const raw of lines) {
    if (raw.startsWith("### |PARATEXT|")) break;
    const marker = raw.match(/^### \|\|\| (\d+)(?:\s+ms\d+)?\s*$/);
    if (marker) number = marker[1];
    else if (raw.startsWith("### |||") || raw.startsWith("### ||")) {
      out.push({ kind: "heading", text: raw.replace(/^### \|+/, "") });
    } else if (raw.startsWith("### |")) out.push({ kind: "book", text: raw.slice(5) });
    else if (raw.startsWith("# |")) out.push({ kind: "heading", text: raw.slice(3) });
    else if (raw.startsWith("# ")) {
      out.push({ kind: "para", text: number ? `${number} ${raw.slice(2)}` : raw.slice(2) });
      number = null;
    } else if (raw.startsWith("~~") && out.length) out[out.length - 1].text += ` ${raw.slice(2)}`;
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
    inferredBooks: [],
    title: null,
    repeatMarks: 0,
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
  const openBook = (number: number, title: string) => {
    if (books.some((b) => b.number === number)) throw new Error(`OpenITI: book ${number} twice`);
    books.push({ number, title });
    book = number;
    chapter = 0;
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
    if (block.kind === "book") {
      // "( 3 أبواب الوتر )": a book by its level; without a number it continues the book before.
      const inner = block.text.replace(/^\(\s*/, "").replace(/\s*\)$/, "").trim();
      const numbered = inner.match(/^(\d+)\s+(?:أول\s+)?(.*)$/);
      if (numbered) openBook(Number(numbered[1]), numbered[2]);
      else if (inner) openChapter(inner);
      continue;
    }
    if (block.kind === "heading") {
      // "1 ( 3 باب ... )": the level digit, then the edition's heading in brackets.
      const inner = block.text
        .replace(/^\d+\s*/, "")
        .replace(/^\(\s*/, "")
        .replace(/\s*\)$/, "")
        .trim();
      if (!inner || /^\d+$/.test(inner)) continue;
      const bookHeading = inner.match(BOOK);
      if (bookHeading && (bookHeading[1] || bookHeading[2])) {
        const number = bookHeading[1] ? Number(bookHeading[1]) : Math.max(...books.map((b) => b.number)) + 1;
        if (!bookHeading[1]) report.inferredBooks.push({ number, title: bookHeading[3] });
        openBook(number, bookHeading[3]);
        continue;
      }
      const text = inner.replace(/^\d+\s+/, "");
      if (SPEECH.test(text)) {
        report.textHeadings.push(inner);
        addText(inner);
        continue;
      }
      const first = books.length === 1 && chapters.length === 0 && report.title === null;
      if (first && !bookHeading && !/^باب(?:\s|$)/.test(text)) {
        report.title = text; // the title page of the export
        continue;
      }
      // A chapter, a group of chapters ("أبواب ..."), or an unnumbered book
      // heading that continues the book before it.
      openChapter(text);
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
    const bookHeading = text.match(BOOK);
    if (bookHeading) {
      report.numberedHeadings.push(block.text);
      openBook(number, bookHeading[3]);
      continue;
    }
    if (/^باب(?:\s|$)/.test(text)) {
      report.numberedHeadings.push(block.text);
      openChapter(text);
      continue;
    }
    // In al-Tirmidhi (ed. Shakir) "م" marks another chain under the same number.
    if (/^م\s/.test(text)) {
      report.repeatMarks += 1;
      text = text.slice(2);
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
  // A preface without narrations is only a few opening lines: they go before
  // the first chapter of book 1.
  let kept = chapters;
  if (!narrations.some((n) => n.book === PREFACE.number)) {
    const opening = chapters.filter((c) => c.book === PREFACE.number).flatMap((c) => [c.title, ...c.intro]);
    kept = chapters.filter((c) => c.book !== PREFACE.number);
    if (kept.length) kept[0].intro.unshift(...opening.filter(Boolean));
  }
  const used = books.filter((b) => b.number !== PREFACE.number || kept.some((c) => c.book === b.number));
  return { meta, books: used, chapters: kept, narrations, report };
}
