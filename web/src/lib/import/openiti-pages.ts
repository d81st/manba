// Parses a book cited by volume and page of its printed edition, in the
// annotated OpenITI layout: "### | ..." a section, "### || ..." a chapter,
// "# " a paragraph, "~~" its continuation, and "PageV01P235" where page 235
// of volume 1 ends. Used for the Sira of Ibn Hisham (docs/ADDRESSES.md):
// the address is volume.page.piece, a page being cut into pieces only where
// a heading starts on it, so that each piece belongs to one chapter.
import { cleanLine } from "./openiti-hadith.ts";

export type PagesSection = { number: number; title: string };
export type PagesChapter = { section: number; index: number; title: string };
export type PagesPiece = {
  volume: number;
  page: number;
  piece: number; // 1, 2, … on the page
  ordinal: number;
  section: number;
  chapter: number;
  paragraphs: string[];
};
export type PagesReport = {
  pages: number;
  pieces: number;
  split: number; // pages cut by a heading into more than one piece
  empty: number; // pages with no text of their own (a heading only)
  volumes: { volume: number; first: number }[]; // first page of each volume in the export
};
export type PagesBook = {
  sections: PagesSection[];
  chapters: PagesChapter[];
  pieces: PagesPiece[];
  report: PagesReport;
};

const PAGE = /PageV(\d+)P(\d+)/g;

// "(نهج ابن هشام في هذا الكتاب) :" -> "نهج ابن هشام في هذا الكتاب"
function headingText(text: string) {
  return cleanLine(text)
    .replace(/\s*:\s*$/, "")
    .replace(/^\((.*)\)$/, "$1")
    .trim();
}

export function parseOpenitiPages(source: string): PagesBook {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const end = lines.findIndex((l) => l.startsWith("#META#Header#End#"));
  if (end < 0) throw new Error("OpenITI: header end not found");

  const sections: PagesSection[] = [];
  const chapters: PagesChapter[] = [];
  const pieces: PagesPiece[] = [];
  const report: PagesReport = { pages: 0, pieces: 0, split: 0, empty: 0, volumes: [] };

  let section = 0;
  let chapter = 0;
  // Pieces of the page being read; they get its number at its end marker.
  type Open = { section: number; chapter: number; paragraphs: string[] };
  let open: Open[] = [];
  let paragraph: string[] | null = null; // words of the current paragraph
  let last: { volume: number; page: number } | null = null;

  // Text before the first heading opens an untitled section; text before a
  // section's first chapter heading, an untitled chapter.
  const piece = () => {
    if (section === 0) {
      section = 1;
      sections.push({ number: 1, title: "" });
    }
    if (chapter === 0) {
      chapter = 1;
      chapters.push({ section, index: 1, title: "" });
    }
    const current = open.at(-1);
    if (current && current.section === section && current.chapter === chapter) return current;
    const next: Open = { section, chapter, paragraphs: [] };
    open.push(next);
    return next;
  };
  const closeParagraph = () => {
    const text = paragraph ? cleanLine(paragraph.join(" ")) : "";
    if (text) piece().paragraphs.push(text);
    paragraph = null;
  };
  const endPage = (volume: number, page: number) => {
    closeParagraph();
    // Inside a volume pages go one by one; a volume may open after its
    // title pages, which the export leaves out.
    const next = last ? (volume === last.volume ? page === last.page + 1 : volume === last.volume + 1) : volume === 1;
    if (!next) throw new Error(`OpenITI: page ${volume}:${page} follows ${last ? `${last.volume}:${last.page}` : "the start"}`);
    if (!last || volume !== last.volume) report.volumes.push({ volume, first: page });
    last = { volume, page };
    report.pages += 1;
    const kept = open.filter((p) => p.paragraphs.length > 0);
    if (kept.length === 0) report.empty += 1;
    if (kept.length > 1) report.split += 1;
    kept.forEach((p, i) =>
      pieces.push({
        volume,
        page,
        piece: i + 1,
        ordinal: pieces.length + 1,
        section: p.section,
        chapter: p.chapter,
        paragraphs: p.paragraphs,
      }),
    );
    open = [];
  };
  // Text of a line, with the page markers inside it.
  const addText = (text: string) => {
    let pos = 0;
    for (const m of text.matchAll(PAGE)) {
      const before = text.slice(pos, m.index);
      if (before.trim()) (paragraph ??= []).push(before);
      // A paragraph that goes on over the page break stays open on the next page.
      const going = paragraph !== null;
      endPage(Number(m[1]), Number(m[2]));
      paragraph = going ? [] : null;
      pos = m.index + m[0].length;
    }
    const rest = text.slice(pos);
    if (rest.trim()) (paragraph ??= []).push(rest);
  };

  for (const raw of lines.slice(end + 1)) {
    const heading = raw.match(/^### (\|+) (.*)$/);
    if (heading) {
      closeParagraph();
      if (heading[1].length === 1) {
        section += 1;
        chapter = 0;
        sections.push({ number: section, title: headingText(heading[2]) });
      } else {
        if (section === 0) {
          section = 1;
          sections.push({ number: 1, title: "" });
        }
        chapter += 1;
        chapters.push({ section, index: chapter, title: headingText(heading[2]) });
      }
    } else if (raw.startsWith("# ")) {
      closeParagraph();
      paragraph = [];
      addText(raw.slice(2));
    } else if (raw.startsWith("~~")) {
      addText(raw.slice(2));
    }
  }
  closeParagraph();
  if (open.some((p) => p.paragraphs.length)) throw new Error("OpenITI: text after the last page marker");

  report.pieces = pieces.length;
  return { sections, chapters, pieces, report };
}
