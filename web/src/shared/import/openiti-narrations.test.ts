import { describe, expect, it } from "vitest";
import { parseOpenitiNarrations } from "./openiti-narrations.ts";

// Fictional test data in the OpenITI (JK) layout: not real hadiths or chapters.
const SOURCE = [
  "######OpenITI#",
  "#META# 020.BookTITLE\t:: كتاب تجريبي",
  "#META# 040.EdEDITOR\t:: NODATA",
  "#META#Header#End#",
  "",
  "# كتاب تجريبي PageV01P001 مقدمة تجريبية",
  "~~تتمة المقدمة",
  "# | 1 ( 1 باب أول في المقدمة )",
  "# 1 حدثنا فلان * نص أول \\ 1 \\",
  "# | 1 ( 1 كتاب أول )",
  "# | 1 ( 1 باب ثان طويل",
  "~~العنوان )",
  "# 2 حدثنا علان نص ثان",
  "# 2 وحدثنا فلان بهذا الإسناد مثله",
  "# ( شطر أول % شطر ثان )",
  "# 4 حدثنا نص رابع ms0001",
  "# | 1 ( قال كلام في سطر عنوان )",
  "# 2 حدثنا نص مكرر الرقم",
  "# | 1 ( 2 كتاب ثان )",
  "# 5 باب عنوان مرقم",
  "# 66556 6 حدثنا نص سادس",
  "# | 1 ( كتاب تابع بلا رقم )",
  "# | 1 ( 1 باب بعده )",
  "# 7 حدثنا نص سابع",
].join("\n");

describe("parseOpenitiNarrations", () => {
  const collection = parseOpenitiNarrations(SOURCE);
  const report = collection.report;

  it("reads the preface as book 0 and numbered books after it", () => {
    expect(collection.books).toEqual([
      { number: 0, title: "مقدمة" },
      { number: 1, title: "كتاب أول" },
      { number: 2, title: "كتاب ثان" },
    ]);
    expect(collection.chapters[0]).toEqual({ book: 0, index: 1, title: "", intro: ["مقدمة تجريبية تتمة المقدمة"] });
  });

  it("joins wrapped headings and keeps unnumbered book headings as chapters", () => {
    expect(collection.chapters.map((c) => [c.book, c.index, c.title])).toEqual([
      [0, 1, ""],
      [0, 2, "باب أول في المقدمة"],
      [1, 1, "باب ثان طويل العنوان"],
      [2, 1, "باب عنوان مرقم"],
      [2, 2, "كتاب تابع بلا رقم"],
      [2, 3, "باب بعده"],
    ]);
  });

  it("numbers narrations of one hadith in reading order", () => {
    expect(collection.narrations.map((n) => [n.number, n.variant, n.book, n.chapter, n.ordinal])).toEqual([
      [1, 1, 0, 2, 1],
      [2, 1, 1, 1, 2],
      [2, 2, 1, 1, 3],
      [4, 1, 1, 1, 4],
      [2, 3, 1, 1, 5],
      [6, 1, 2, 1, 6],
      [7, 1, 2, 3, 7],
    ]);
  });

  it("cleans annotations and keeps verse lines and stray heading text with the narration", () => {
    const [first, , second, fourth] = collection.narrations;
    expect(first.paragraphs).toEqual(["حدثنا فلان نص أول"]);
    expect(second.paragraphs).toEqual(["وحدثنا فلان بهذا الإسناد مثله", "( شطر أول … شطر ثان )"]);
    expect(fourth.paragraphs).toEqual(["حدثنا نص رابع", "قال كلام في سطر عنوان"]);
    expect(report.appended).toBe(2);
    expect(report.textHeadings).toEqual(["قال كلام في سطر عنوان"]);
  });

  it("reports everything it decided", () => {
    expect(report.narrations).toBe(7);
    expect(report.numbers).toBe(5);
    expect(report.missing).toEqual([3, 5]);
    expect(report.backReferences).toEqual([{ number: 2, book: 1, after: 4 }]);
    expect(report.glued).toEqual([{ raw: "66556", number: 6 }]);
    expect(report.numberedHeadings).toEqual(["5 باب عنوان مرقم"]);
  });
});

// Fictional data in the annotated layout: levels mark books and chapters,
// "### ||| N" gives the number of the paragraph after it.
const ANNOTATED = [
  "######OpenITI#",
  "#META#Header#End#",
  "# بسم الله تجريبي",
  "### | ( 1 كتاب أول )",
  "### || ( 1 باب أول )",
  "### ||| 1",
  "# حدثنا نص أول",
  "### ||| 1 ms0001",
  "# م حدثنا سند آخر",
  "### | ( 2 أبواب ثانية )",
  "### ||| ( 2 باب ثان )",
  "### ||| 2",
  "# حدثنا نص ثان",
  "### | ( كتاب تابع )",
  "### ||| 3",
  "# حدثنا نص ثالث",
  "### |PARATEXT|",
  "# فهرس لا يحمل",
].join("\n");

describe("parseOpenitiNarrations, annotated layout", () => {
  const collection = parseOpenitiNarrations(ANNOTATED);

  it("reads books and chapters by level and stops before the editor's matter", () => {
    expect(collection.books).toEqual([
      { number: 1, title: "كتاب أول" },
      { number: 2, title: "أبواب ثانية" },
    ]);
    expect(collection.chapters.map((c) => [c.book, c.index, c.title, c.intro])).toEqual([
      [1, 1, "باب أول", ["بسم الله تجريبي"]],
      [2, 1, "باب ثان", []],
      [2, 2, "كتاب تابع", []],
    ]);
    expect(collection.narrations.at(-1)?.paragraphs).toEqual(["حدثنا نص ثالث"]);
  });

  it("takes numbers from their own lines and drops the repeat mark", () => {
    expect(collection.narrations.map((n) => [n.number, n.variant, n.book, n.chapter, n.paragraphs[0]])).toEqual([
      [1, 1, 1, 1, "حدثنا نص أول"],
      [1, 2, 1, 1, "حدثنا سند آخر"],
      [2, 1, 2, 1, "حدثنا نص ثان"],
      [3, 1, 2, 2, "حدثنا نص ثالث"],
    ]);
    expect(collection.report.repeatMarks).toBe(1);
  });
});

describe("parseOpenitiNarrations, book headings in words", () => {
  const collection = parseOpenitiNarrations(
    [
      "######OpenITI#",
      "#META#Header#End#",
      "# | 1 ( سنن تجريبية )",
      "# 1 كتاب أول",
      "# | 1 ( 1 باب أول )",
      "# 1 حدثنا نص أول",
      "# | 1 ( أول كتاب ثان )",
      "# | 1 ( فضل تجريبي )",
      "# 2 حدثنا نص ثان",
    ].join("\n"),
  );

  it("skips the title page, numbers an unnumbered first heading of a book and keeps other titles as chapters", () => {
    expect(collection.report.title).toBe("سنن تجريبية");
    expect(collection.books).toEqual([
      { number: 1, title: "كتاب أول" },
      { number: 2, title: "كتاب ثان" },
    ]);
    expect(collection.report.inferredBooks).toEqual([{ number: 2, title: "كتاب ثان" }]);
    expect(collection.report.numberedHeadings).toEqual(["1 كتاب أول"]);
    expect(collection.chapters.map((c) => [c.book, c.title])).toEqual([
      [1, "باب أول"],
      [2, "فضل تجريبي"],
    ]);
  });
});
