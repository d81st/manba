import { describe, expect, it } from "vitest";
import { parseOpenitiPages } from "./openiti-pages.ts";

// Fictional test data in the annotated OpenITI layout: not a real text.
const SOURCE = [
  "######OpenITI#",
  "#META#Header#End#",
  "### | قسم أول تجريبي",
  "# نص أول في الصفحة",
  "~~الأولى PageV01P001",
  "# تتمة في الصفحة الثانية ms001",
  "### || (باب تجريبي) :",
  "# نص الباب PageV01P002",
  "### | قسم ثان",
  "# في الصفحة الثالثة",
  "~~وما بعدها PageV01P003 كلام يبدأ في الصفحة",
  "~~الرابعة PageV01P004",
  "### || (باب بلا نص) :",
  "### || (باب آخر) :",
  "# آخر الجزء PageV02P003",
].join("\n");

describe("parseOpenitiPages", () => {
  const book = parseOpenitiPages(SOURCE);
  const pieces = book.pieces.map((p) => [p.volume, p.page, p.piece, p.section, p.chapter, p.paragraphs]);

  it("reads sections and chapters; text before a section's first chapter goes to an untitled one", () => {
    expect(book.sections).toEqual([
      { number: 1, title: "قسم أول تجريبي" },
      { number: 2, title: "قسم ثان" },
    ]);
    expect(book.chapters.map((c) => [c.section, c.index, c.title])).toEqual([
      [1, 1, ""],
      [1, 2, "باب تجريبي"],
      [2, 1, ""],
      [2, 2, "باب بلا نص"],
      [2, 3, "باب آخر"],
    ]);
  });

  it("gives each page its text, cut into pieces only where a heading starts on it", () => {
    expect(pieces).toEqual([
      [1, 1, 1, 1, 1, ["نص أول في الصفحة الأولى"]],
      [1, 2, 1, 1, 1, ["تتمة في الصفحة الثانية"]],
      [1, 2, 2, 1, 2, ["نص الباب"]],
      [1, 3, 1, 2, 1, ["في الصفحة الثالثة وما بعدها"]],
      [1, 4, 1, 2, 1, ["كلام يبدأ في الصفحة الرابعة"]],
      [2, 3, 1, 2, 3, ["آخر الجزء"]],
    ]);
    expect(book.report).toEqual({
      pages: 5,
      pieces: 6,
      split: 1,
      empty: 0,
      volumes: [
        { volume: 1, first: 1 },
        { volume: 2, first: 3 },
      ],
      gaps: [],
      repairs: [],
    });
  });

  it("refuses pages out of order and text after the last page", () => {
    expect(() => parseOpenitiPages(SOURCE.replace("PageV01P003", "PageV01P005"))).toThrow(/follows/);
    expect(() => parseOpenitiPages(`${SOURCE}\n# نص زائد`)).toThrow(/after the last page/);
  });

  it("with the gaps option, lets pages be missing and reports them", () => {
    const gapped = parseOpenitiPages(SOURCE.replace("PageV01P003", "PageV01P005").replace("PageV01P004", "PageV01P006"), { gaps: true });
    expect(gapped.report.gaps).toEqual([{ after: "1:2", next: "1:5" }]);
    expect(() => parseOpenitiPages(SOURCE.replace("PageV01P002", "PageV01P009"), { gaps: true })).toThrow(/follows/);
  });
});

// Fictional test data in the rougher layouts: not a real text.
describe("parseOpenitiPages, rough exports", () => {
  it("reads a JK chapter heading as a paragraph opening with |", () => {
    const book = parseOpenitiPages(
      ["#META#Header#End#", "# عنوان الكتاب PageV01P001", "# | باب تجريبي", "# نص الباب", "~~وتتمته PageV01P002"].join("\n"),
      { jk: true },
    );
    expect(book.chapters.map((c) => c.title)).toEqual(["", "باب تجريبي"]);
    expect(book.pieces.map((p) => [p.page, p.chapter, p.paragraphs])).toEqual([
      [1, 1, ["عنوان الكتاب"]],
      [2, 2, ["نص الباب وتتمته"]],
    ]);
  });

  it("in the loose layout keeps entries and odd lines as text and reads markers inside headings", () => {
    const book = parseOpenitiPages(
      [
        "#META#Header#End#",
        "PageV00P000",
        "### | قسم تجريبي",
        "### $ فلان بن فلان، ترجمة قصيرة",
        "#~:section: خبر تجريبي",
        " سطر يكمل الخبر",
        "PageV01P001",
        "### || باب يبدأ PageV01P002 في صفحة",
        "# نص %~% شعر PageV01P003",
      ].join("\n"),
      { loose: true },
    );
    expect(book.pieces.map((p) => [p.page, p.chapter, p.paragraphs])).toEqual([
      [1, 1, ["فلان بن فلان، ترجمة قصيرة", "خبر تجريبي سطر يكمل الخبر"]],
      [3, 2, ["نص %~% شعر"]],
    ]);
    expect(book.chapters.at(-1)?.title).toBe("باب يبدأ في صفحة");
    expect(book.report.empty).toBe(1);
  });

  it("with the repair option reads slipped page markers as the pages they mean", () => {
    const source = [
      "#META#Header#End#",
      "# نص أول PageV01P001",
      "# نص ثان PageV01P004",
      "# نص ثالث PageV01P003",
      "# نص رابع PageV01P003",
      "PageV01P004 ms12",
    ].join("\n");
    expect(() => parseOpenitiPages(source, { loose: true })).toThrow(/follows/);
    const book = parseOpenitiPages(source, { loose: true, repair: true });
    expect(book.report.repairs).toEqual([
      { marker: "1:4", read: "1:2" },
      { marker: "1:3", read: "" },
    ]);
    expect(book.pieces.map((p) => [p.page, p.paragraphs])).toEqual([
      [1, ["نص أول"]],
      [2, ["نص ثان"]],
      [3, ["نص ثالث"]],
      [4, ["نص رابع"]],
    ]);
  });
});
