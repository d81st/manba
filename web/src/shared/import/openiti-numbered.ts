// A hadith collection whose export marks each report "### | N -" and its
// books "### | كتاب ...", with chapters as the other "### |" headings.
// Used for the Musannaf of Abd al-Razzaq: the file is marked inProgress and
// its page markers are mostly placeholders, while the edition's numbers run
// in order. A missing number stays missing. Nothing is inferred.
import { type Hadith, type HadithBook, type HadithChapter, type HadithCollection, type HadithReport, cleanLine } from "./openiti-hadith.ts";

const PAGE_REF = /^\[ص:\s*\d+\]$/;
const NUMBER = /^(\d+)\s*-\s*$/;

export function parseOpenitiNumbered(source: string): HadithCollection {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");
  const meta: Record<string, string> = {};
  for (const line of lines.slice(0, end)) {
    const m = line.match(/^#META# \d+\.(\w+)\s*::\s*(.*)$/);
    if (m && m[2] !== "NODATA") meta[m[1]] = m[2].trim();
  }

  const books: HadithBook[] = [];
  const chapters: HadithChapter[] = [];
  const hadiths: Hadith[] = [];
  const report: HadithReport = {
    markers: 0,
    inferredGap: [],
    inferredDisplaced: [],
    missing: [],
    appended: 0,
    unassigned: [],
  };

  let book = 0;
  let chapter = 0;
  let number: number | null = null;
  let lastNumber = 0;
  let paragraphs: string[] = [];
  let paragraph: string[] | null = null;

  const ensureChapter = () => {
    if (book === 0) {
      book = 1;
      books.push({ number: 1, title: "" });
    }
    if (chapter === 0) {
      chapter = 1;
      chapters.push({ book, index: 1, title: "", intro: [] });
    }
  };
  const closeParagraph = () => {
    const text = paragraph ? cleanLine(paragraph.join(" ")) : "";
    paragraph = null;
    if (!text) return;
    if (number === null) {
      ensureChapter();
      chapters[chapters.length - 1].intro.push(text);
    } else {
      paragraphs.push(text);
    }
  };
  const closeHadith = () => {
    closeParagraph();
    if (number === null) return;
    if (paragraphs.length) {
      hadiths.push({
        number,
        ordinal: hadiths.length + 1,
        book,
        chapter,
        paragraphs,
        numbering: "marker",
      });
      report.markers += 1;
    } else {
      report.missing.push(number);
    }
    number = null;
    paragraphs = [];
  };
  const openBook = (title: string) => {
    closeHadith();
    book += 1;
    chapter = 0;
    books.push({ number: book, title });
  };
  const openChapter = (title: string) => {
    closeHadith();
    ensureChapter();
    if (chapters.at(-1)?.title === "" && chapters.at(-1)?.intro.length === 0 && chapter === chapters.filter((c) => c.book === book).length) {
      chapters[chapters.length - 1].title = title;
      return;
    }
    chapter += 1;
    chapters.push({ book, index: chapter, title, intro: [] });
  };

  for (const raw of lines.slice(end + 1)) {
    if (raw.startsWith("### |")) {
      const text = cleanLine(raw.replace(/^### \|+/, ""));
      if (!text || PAGE_REF.test(text)) continue;
      const marked = text.match(NUMBER);
      if (marked) {
        closeHadith();
        const n = Number(marked[1]);
        if (n <= lastNumber) throw new Error(`OpenITI: hadith ${n} is not after ${lastNumber}`);
        if (hadiths.some((h) => h.number === n) || report.missing.includes(n)) {
          throw new Error(`OpenITI: hadith ${n} twice`);
        }
        ensureChapter();
        number = n;
        lastNumber = n;
        continue;
      }
      if (text.startsWith("كتاب")) openBook(text);
      else openChapter(text);
      continue;
    }
    if (raw.startsWith("~~")) {
      const text = cleanLine(raw.slice(2));
      if (text) (paragraph ??= []).push(text);
      continue;
    }
    if (raw.startsWith("# ")) {
      closeParagraph();
      const text = cleanLine(raw.slice(2));
      if (text) paragraph = [text];
    }
  }
  closeHadith();

  const present = new Set([...hadiths.map((h) => h.number), ...report.missing]);
  if (lastNumber > 0) {
    for (let n = 1; n <= lastNumber; n++) if (!present.has(n)) report.missing.push(n);
  }
  report.missing.sort((a, b) => a - b);
  return { meta, books, chapters, hadiths, report };
}
