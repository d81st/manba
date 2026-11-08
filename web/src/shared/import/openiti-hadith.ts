// Parses a hadith collection in OpenITI mARkdown (Shamela export) into books,
// chapters and numbered hadiths. Numbers are taken from the edition's markers;
// where the export lost or displaced a marker, a number is inferred only by
// the strict rules below, and every inferred or missing number is reported.
// Every check here runs before anything is written to the database.

export type HadithBook = { number: number; title: string };

export type HadithChapter = {
  book: number; // HadithBook.number
  index: number; // order inside the book, from 1
  title: string;
  intro: string[]; // the chapter's own text before its first hadith (tarjama)
};

export type Numbering = "marker" | "gap" | "displaced";

export type Hadith = {
  number: number;
  ordinal: number; // reading order in the edition, from 1
  book: number;
  chapter: number; // HadithChapter.index inside the book
  paragraphs: string[];
  numbering: Numbering;
};

export type HadithReport = {
  markers: number; // numbers that came with their own marker and text
  inferredGap: number[]; // unnumbered narration that fills a gap of the same size
  inferredDisplaced: number[]; // numbers printed away from their texts, matched by count
  missing: number[]; // numbers in 1..max with no text: merged in print or lost in export
  appended: number; // unnumbered narration paragraphs kept inside the hadith before them
  unassigned: { book: number; chapter: number; paragraphs: string[] }[]; // narration with no hadith to join
};

export type HadithCollection = {
  meta: Record<string, string>;
  books: HadithBook[];
  chapters: HadithChapter[];
  hadiths: Hadith[];
  report: HadithReport;
};

// A paragraph that starts a chain of narrators.
const NARRATION = /^(?:و?حدثن[اي]|حدثناه|و?أخبرن[اي]|و?أنبأن[اي]|و?سمعت)\s/;
const NUMBER_MARKER = /^(\d+)\s*-\s*$/;
const PAGE_REF = /^\[ص:\s*\d+\]$/;

// OpenITI annotations that are not part of the text.
export function cleanLine(line: string) {
  return line
    .replace(/\bms[A-Z]?\d+\b/g, "")
    .replace(/\bPageV\d+P\d+\b/g, "")
    .replace(/@Q[BE]@/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type Token =
  | { kind: "book"; number: number; title: string }
  | { kind: "chapter"; title: string }
  | { kind: "number"; number: number }
  | { kind: "para"; text: string };

// Line types of the export: "### $ N - title" book, "### | N -" number,
// "### | text" chapter, "# text" paragraph, "~~text" continuation.
function tokenize(source: string): { meta: Record<string, string>; tokens: Token[] } {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");
  const meta: Record<string, string> = {};
  for (const line of lines.slice(0, end)) {
    const m = line.match(/^#META# \d+\.(\w+)\s*::\s*(.*)$/);
    if (m && m[2] !== "NODATA") meta[m[1]] = m[2].trim();
  }

  // The text starts at book 1 ("### | 1 -" then "# باب"); before it come the
  // modern editor's title page and introduction, which are not loaded.
  let start = -1;
  for (let i = end + 1; i < lines.length; i++) {
    if (/^### \| 1\s*-\s*$/.test(lines[i]) && lines.slice(i + 1, i + 4).some((l) => /^# باب\s*$/.test(l))) {
      start = i;
      break;
    }
  }
  if (start < 0) throw new Error("OpenITI: start of book 1 not found");

  const tokens: Token[] = [{ kind: "book", number: 1, title: "" }];
  let paragraph: string[] | null = null;
  let joinNext = false;
  const flush = () => {
    if (paragraph) {
      const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
      if (text) tokens.push({ kind: "para", text });
    }
    paragraph = null;
  };
  const book1 = tokens[0] as Extract<Token, { kind: "book" }>;
  let book1Title = true;

  for (const raw of lines.slice(start + 1)) {
    if (raw.startsWith("### $")) {
      flush();
      const m = raw.match(/^### \$\s*(\d+)\s*-\s*(.*)$/);
      if (!m) throw new Error(`OpenITI: unreadable book line: ${raw}`);
      tokens.push({ kind: "book", number: Number(m[1]), title: cleanLine(m[2]) });
      book1Title = false;
      continue;
    }
    if (raw.startsWith("### |")) {
      const text = cleanLine(raw.replace(/^### \|+/, ""));
      if (PAGE_REF.test(text)) {
        // A page break inside a paragraph: the next "#" line continues it.
        joinNext = paragraph !== null;
        continue;
      }
      flush();
      if (!text) continue;
      const number = text.match(NUMBER_MARKER);
      if (number) tokens.push({ kind: "number", number: Number(number[1]) });
      else if (book1Title && !book1.title) book1.title = text;
      else tokens.push({ kind: "chapter", title: text });
      continue;
    }
    if (raw.startsWith("~~")) {
      const text = cleanLine(raw.slice(2));
      if (text) (paragraph ??= []).push(text);
      continue;
    }
    if (raw.startsWith("# ")) {
      const text = cleanLine(raw.slice(2));
      if (!text) continue;
      const number = text.match(NUMBER_MARKER);
      if (number) {
        flush();
        tokens.push({ kind: "number", number: Number(number[1]) });
        continue;
      }
      if (book1Title && text === "باب" && !book1.title) continue; // "# باب" of book 1
      if (joinNext && paragraph) paragraph.push(text);
      else {
        flush();
        paragraph = [text];
      }
      joinNext = false;
      continue;
    }
  }
  flush();
  return { meta, tokens };
}

type Unit = {
  book: number;
  chapter: number;
  numbers: number[]; // markers right before it (several when the export bunched them)
  paragraphs: string[];
};

// How far ahead displaced numbers are looked for (in marked hadiths).
const DISPLACED_WINDOW = 40;

export function parseOpenitiHadith(source: string): HadithCollection {
  const { meta, tokens } = tokenize(source);
  const books: HadithBook[] = [];
  const chapters: HadithChapter[] = [];
  const units: Unit[] = [];
  const report: HadithReport = {
    markers: 0,
    inferredGap: [],
    inferredDisplaced: [],
    missing: [],
    appended: 0,
    unassigned: [],
  };

  // 1. Group paragraphs into units: a run of number markers and the text after it,
  //    or unnumbered narration (numbers: []).
  let book = 0;
  let chapter = 0;
  let pendingNumbers: number[] = [];
  let current: Unit | null = null;
  const ensureChapter = () => {
    if (chapter === 0) {
      chapter = 1;
      chapters.push({ book, index: 1, title: "", intro: [] });
    }
  };
  for (const token of tokens) {
    if (token.kind === "book") {
      if (books.some((b) => b.number === token.number)) throw new Error(`OpenITI: book ${token.number} twice`);
      books.push({ number: token.number, title: token.title });
      book = token.number;
      chapter = 0;
      current = null;
      pendingNumbers = [];
    } else if (token.kind === "chapter") {
      // Numbers bunched right before a heading belong to no text here.
      if (pendingNumbers.length) {
        ensureChapter();
        units.push({ book, chapter, numbers: pendingNumbers, paragraphs: [] });
        pendingNumbers = [];
      }
      chapter += 1;
      chapters.push({ book, index: chapter, title: token.title, intro: [] });
      current = null;
    } else if (token.kind === "number") {
      pendingNumbers.push(token.number);
      current = null;
    } else {
      ensureChapter();
      if (pendingNumbers.length) {
        current = { book, chapter, numbers: pendingNumbers, paragraphs: [token.text] };
        units.push(current);
        pendingNumbers = [];
      } else if (NARRATION.test(token.text)) {
        current = { book, chapter, numbers: [], paragraphs: [token.text] };
        units.push(current);
      } else if (current) {
        current.paragraphs.push(token.text);
      } else {
        chapters[chapters.length - 1].intro.push(token.text);
      }
    }
  }
  if (pendingNumbers.length) units.push({ book, chapter, numbers: pendingNumbers, paragraphs: [] });

  // 2. Each unit with text takes the first of its markers; the rest are displaced.
  const assigned = new Map<number, Unit>();
  const numberOf = new Map<Unit, number>();
  const how = new Map<Unit, Numbering>();
  const displaced: number[][] = []; // groups of numbers whose texts are elsewhere
  for (const unit of units) {
    if (unit.numbers.length === 0) continue;
    const [first, ...rest] = unit.numbers;
    if (unit.paragraphs.length) {
      if (assigned.has(first)) throw new Error(`OpenITI: hadith ${first} twice`);
      assigned.set(first, unit);
      numberOf.set(unit, first);
      how.set(unit, "marker");
      report.markers += 1;
      if (rest.length) displaced.push(rest);
    } else {
      displaced.push(unit.numbers);
    }
  }

  // Positions of marked units in reading order, with the unnumbered narration after each.
  const marked = units.filter((u) => numberOf.has(u));
  const orphansAfter = new Map<Unit, Unit[]>();
  let last: Unit | null = null;
  const leading: Unit[] = [];
  for (const unit of units) {
    if (numberOf.has(unit)) {
      last = unit;
      orphansAfter.set(unit, []);
    } else if (unit.numbers.length === 0) {
      if (last) orphansAfter.get(last)!.push(unit);
      else leading.push(unit);
    }
  }

  // 3. Displaced numbers: a contiguous range (filled with numbers that have no
  //    marker at all) matched with the first later gap of exactly that many
  //    unnumbered narrations.
  for (const group of displaced) {
    const lo = Math.min(...group);
    const hi = Math.max(...group);
    const range: number[] = [];
    for (let n = lo; n <= hi; n++) if (!assigned.has(n)) range.push(n);
    if (range.length !== hi - lo + 1) continue; // some are already placed: leave for review
    const from = marked.findIndex((u) => numberOf.get(u)! > hi) - 1;
    if (from < -1) continue;
    for (let k = Math.max(0, from); k < Math.min(marked.length, from + DISPLACED_WINDOW); k++) {
      const after = marked[k];
      const next = marked[k + 1];
      const orphans = orphansAfter.get(after)!;
      // The gap must not already be explained by missing numbers around it.
      const gap = next ? numberOf.get(next)! - numberOf.get(after)! - 1 : 0;
      if (orphans.length === range.length && gap === 0) {
        orphans.forEach((orphan, i) => {
          assigned.set(range[i], orphan);
          numberOf.set(orphan, range[i]);
          how.set(orphan, "displaced");
          report.inferredDisplaced.push(range[i]);
        });
        orphansAfter.set(after, []);
        break;
      }
    }
  }

  // 4. Gaps: between two marked hadiths, unnumbered narrations that exactly
  //    fill the missing numbers in between take those numbers in order.
  for (let k = 0; k < marked.length - 1; k++) {
    const after = marked[k];
    const orphans = orphansAfter.get(after)!;
    if (orphans.length === 0) continue;
    const a = numberOf.get(after)!;
    const b = numberOf.get(marked[k + 1])!;
    const missing: number[] = [];
    for (let n = a + 1; n < b; n++) if (!assigned.has(n)) missing.push(n);
    if (missing.length === orphans.length && missing.length === b - a - 1) {
      orphans.forEach((orphan, i) => {
        assigned.set(missing[i], orphan);
        numberOf.set(orphan, missing[i]);
        how.set(orphan, "gap");
        report.inferredGap.push(missing[i]);
      });
      orphansAfter.set(after, []);
    }
  }

  // 5. Remaining unnumbered narration stays inside the hadith before it (same
  //    chapter), as printed; otherwise it is reported.
  let owner: Unit | null = null;
  for (const unit of units) {
    if (numberOf.has(unit)) {
      owner = unit;
      continue;
    }
    if (unit.numbers.length || !unit.paragraphs.length) continue;
    if (owner && owner.book === unit.book && owner.chapter === unit.chapter) {
      owner.paragraphs.push(...unit.paragraphs);
      report.appended += 1;
    } else {
      report.unassigned.push({ book: unit.book, chapter: unit.chapter, paragraphs: unit.paragraphs });
    }
  }

  const hadiths: Hadith[] = units
    .filter((u) => numberOf.has(u))
    .map((u, i) => ({
      number: numberOf.get(u)!,
      ordinal: i + 1,
      book: u.book,
      chapter: u.chapter,
      paragraphs: u.paragraphs,
      numbering: how.get(u)!,
    }));

  const max = Math.max(...hadiths.map((h) => h.number));
  for (let n = 1; n <= max; n++) if (!assigned.has(n)) report.missing.push(n);
  report.inferredGap.sort((x, y) => x - y);
  report.inferredDisplaced.sort((x, y) => x - y);

  return { meta, books, chapters, hadiths, report };
}
