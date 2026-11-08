// Parses a hadith collection numbered straight through the whole work, in the
// annotated OpenITI layout: "### | ..." a book (a part of the work), deeper
// "### || ..." levels a chapter (in a musnad, the hadiths of one companion),
// "# N - " a hadith. As in al-Kafi, the export often lost the paragraph break
// before a number, so a number inside a paragraph is taken only when it is
// exactly the next one; numbers the export lost are reported, never invented.
// Used for the Musnad of Ahmad (ed. al-Arna'ut, al-Risala).
import { cleanLine } from "./openiti-hadith.ts";

export type RunningBook = { number: number; title: string };
export type RunningChapter = { book: number; index: number; title: string; intro: string[] };
export type RunningHadith = {
  number: number;
  part: number | null; // "24009/1": a hadith the editors added after 24009 (appendix)
  ordinal: number;
  book: number;
  chapter: number;
  paragraphs: string[];
};
export type RunningReport = {
  hadiths: number;
  inline: number; // numbers found inside a paragraph and split there
  missing: number[]; // numbers the export lost: their text stays with the hadith before
  ignored: { number: number; text: string }[]; // number-like paragraph starts that break the order
  footnotes: number; // "(1)" references to footnotes, which the export does not have
  bullets: number; // hadiths marked "•" (added by the compiler's son)
  parts: number; // "N/k" hadiths added by the editors
};
export type RunningCollection = {
  books: RunningBook[];
  chapters: RunningChapter[];
  hadiths: RunningHadith[];
  report: RunningReport;
};

// How far a paragraph may skip ahead (numbers lost in the export).
const MAX_SKIP = 3;
// "• N - ": the bullet marks hadiths added by the compiler's son (in the
// Musnad, the zawa'id of Abd Allah ibn Ahmad); the text itself says so.
// "N/k - " is a hadith the editors added after N (from other manuscripts): it
// keeps the editors' number and does not move the count.
// In the appendix the number before the slash is printed as dots ("‏. . . / 2 -"):
// it repeats the one before.
const MARKER = /(?:^|\s)(?:•\s*)?(\d{1,5}|(?:\.\s*)+(?=\/))(?:\s*\/\s*(\d{1,3}))?\s*-\s+(?=\S)/g;
const FOOTNOTE = /\s?\(\d{1,2}\)/g;

export function parseOpenitiRunning(source: string): RunningCollection {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");

  const books: RunningBook[] = [];
  const chapters: RunningChapter[] = [];
  const hadiths: RunningHadith[] = [];
  const report: RunningReport = { hadiths: 0, inline: 0, missing: [], ignored: [], footnotes: 0, bullets: 0, parts: 0 };
  const clean = (text: string) => {
    const notes = text.match(FOOTNOTE)?.length ?? 0;
    report.footnotes += notes;
    return cleanLine(notes ? text.replace(FOOTNOTE, "") : text);
  };

  // Blocks in reading order; "~~" continues the line before.
  type Block = { level: number; text: string }; // level 0: a paragraph
  const blocks: Block[] = [];
  for (const raw of lines.slice(end + 1)) {
    if (raw.startsWith("### |PARATEXT|")) break;
    const heading = raw.match(/^### (\|+) (.*)$/);
    if (heading) blocks.push({ level: heading[1].length, text: heading[2] });
    else if (raw.startsWith("# ")) blocks.push({ level: 0, text: raw.slice(2) });
    else if (raw.startsWith("~~") && blocks.length) blocks[blocks.length - 1].text += ` ${raw.slice(2)}`;
  }

  // Numbers at the start of paragraphs, in order: a bigger jump than
  // MAX_SKIP is taken only where the next two of them go on from it (the
  // export lost a whole run of numbers), so one stray number cannot derail
  // the count.
  const starts: number[] = [];
  const startAt = new Map<Block, number>();
  for (const block of blocks) {
    const m = block.level === 0 ? clean(block.text).match(/^(?:•\s*)?(\d{1,5})\s*-\s/) : null;
    if (m) {
      startAt.set(block, starts.length);
      starts.push(Number(m[1]));
    }
  }
  report.footnotes = 0; // counted again below, once per block
  const resumes = (block: Block, value: number) => {
    const k = startAt.get(block);
    return k !== undefined && starts[k + 1] === value + 1 && starts[k + 2] === value + 2;
  };

  let book = 0;
  let lastPart = 0; // the number of the last "N/k" hadith
  const parts = new Set<string>();
  let chapter: RunningChapter | null = null;
  let current: RunningHadith | null = null;
  let last = 0;
  const openChapter = (title: string) => {
    chapter = { book, index: chapters.filter((c) => c.book === book).length + 1, title, intro: [] };
    chapters.push(chapter);
    current = null;
  };
  const addText = (text: string) => {
    if (!text) return;
    if (current) current.paragraphs.push(text);
    else {
      if (!chapter) openChapter("");
      chapter!.intro.push(text);
    }
  };

  for (const block of blocks) {
    const plain = clean(block.text).replace(/^[.\s]+$/, "");
    // Headings: the editors' square brackets ("[الملحق المستدرك ...]") are dropped.
    const text = block.level > 0 ? plain.replace(/[[\]]/g, " ").replace(/\s+/g, " ").trim() : plain;
    if (block.level === 1) {
      if (!text) continue;
      book += 1;
      books.push({ number: book, title: text });
      chapter = null;
      current = null;
      continue;
    }
    if (block.level > 1) {
      if (text) openChapter(text);
      continue;
    }
    if (!text) continue;
    let pos = 0;
    for (const m of text.matchAll(MARKER)) {
      const atStart = m.index === 0;
      const dotted = m[1].startsWith(".");
      const value = dotted ? lastPart : Number(m[1]);
      if (m[2]) {
        const key = `${value}/${m[2]}`;
        if (!atStart || !value || parts.has(key)) {
          if (atStart) report.ignored.push({ number: value, text: text.slice(0, 40) });
          continue;
        }
        parts.add(key);
        lastPart = value;
        addText(text.slice(pos, m.index).trim());
        if (!chapter) openChapter("");
        current = {
          number: value,
          part: Number(m[2]),
          ordinal: hadiths.length + 1,
          book,
          chapter: chapter!.index,
          paragraphs: [],
        };
        hadiths.push(current);
        report.parts += 1;
        pos = m.index + m[0].length;
        continue;
      }
      if (dotted) continue;
      const fits = atStart
        ? value > last && (value <= last + 1 + MAX_SKIP || resumes(block, value))
        : value === last + 1;
      if (!fits) {
        if (atStart) report.ignored.push({ number: value, text: text.slice(0, 40) });
        continue;
      }
      addText(text.slice(pos, m.index).trim());
      if (!atStart) report.inline += 1;
      if (m[0].includes("•")) report.bullets += 1;
      for (let n = last + 1; n < value; n++) report.missing.push(n);
      last = value;
      if (!chapter) openChapter("");
      current = { number: value, part: null, ordinal: hadiths.length + 1, book, chapter: chapter!.index, paragraphs: [] };
      hadiths.push(current);
      pos = m.index + m[0].length;
    }
    addText(text.slice(pos).trim());
  }

  // Lines before the first part (a basmala, the editor's opening) open its first chapter.
  const opening = chapters.filter((c) => c.book === 0);
  if (opening.length && !hadiths.some((h) => h.book === 0)) {
    const first = chapters.find((c) => c.book === 1);
    if (first) first.intro.unshift(...opening.flatMap((c) => c.intro));
    chapters.splice(0, opening.length);
  }
  if (chapters.some((c) => c.book === 0)) books.unshift({ number: 0, title: "" });

  report.hadiths = hadiths.length;
  const empty = hadiths.filter((h) => h.paragraphs.length === 0).map((h) => h.number);
  if (empty.length) throw new Error(`OpenITI: hadiths without text: ${empty.slice(0, 5).join(", ")}`);
  return { books, chapters, hadiths, report };
}
