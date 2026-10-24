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
    });
  });

  it("refuses pages out of order and text after the last page", () => {
    expect(() => parseOpenitiPages(SOURCE.replace("PageV01P003", "PageV01P005"))).toThrow(/follows/);
    expect(() => parseOpenitiPages(`${SOURCE}\n# نص زائد`)).toThrow(/after the last page/);
  });
});
