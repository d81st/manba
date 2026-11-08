import { describe, expect, it } from "vitest";
import { cleanLine, parseOpenitiHadith } from "./openiti-hadith.ts";

// Fictional test data in the OpenITI layout: not real hadiths or chapters.
const HEADER = "######OpenITI#\n#META# 040.EdEDITOR\t:: محقق تجريبي\n#META#Header#End#\n";

const SOURCE = [
  HEADER,
  "### | [مقدمة المحقق]",
  "# مقدمة تجريبية لا تحمل.",
  "### | 1 - ",
  "# باب",
  "### | كتاب تجريبي أول",
  "# PageV01P001",
  "### | باب أول",
  "# نص الباب ms0001 الأول",
  "### | 1 - ",
  "# حدثنا فلان، قال: نص تجريبي",
  "~~أول PageV00P000",
  "### | [ص: 2]",
  "# تتمة النص الأول",
  "### | 2 - ",
  "# حدثنا علان نص ثان",
  "# حدثنا فلان بهذا الإسناد مثله",
  "### $ 2 - كتاب تجريبي ثان",
  "### | باب ثان",
  "### | 3 - ",
  "### | 4 - ",
  "### | 6 - ",
  "# حدثنا نص الثالث",
  "### | 7 - ",
  "# حدثنا نص السابع",
  "### | باب ثالث",
  "# حدثنا نص الرابع",
  "# حدثنا نص الخامس",
  "# حدثنا نص السادس",
  "### | 8 - ",
  "# حدثنا نص الثامن",
  "### | 10 - ",
  "# حدثنا نص العاشر",
  "### | باب رابع",
  "# حدثنا نص بلا رقم",
  "### | 13 - ",
  "# حدثنا نص الثالث عشر",
].join("\n");

describe("parseOpenitiHadith", () => {
  const collection = parseOpenitiHadith(SOURCE);
  const byNumber = (n: number) => collection.hadiths.find((h) => h.number === n);

  it("skips the editor's introduction and reads books and chapters", () => {
    expect(collection.books).toEqual([
      { number: 1, title: "كتاب تجريبي أول" },
      { number: 2, title: "كتاب تجريبي ثان" },
    ]);
    expect(collection.chapters.map((c) => [c.book, c.index, c.title])).toEqual([
      [1, 1, "باب أول"],
      [2, 1, "باب ثان"],
      [2, 2, "باب ثالث"],
      [2, 3, "باب رابع"],
    ]);
    expect(collection.chapters[0].intro).toEqual(["نص الباب الأول"]);
    expect(collection.meta.EdEDITOR).toBe("محقق تجريبي");
  });

  it("keeps a paragraph whole across a page reference and strips markers", () => {
    expect(byNumber(1)?.paragraphs).toEqual(["حدثنا فلان، قال: نص تجريبي أول تتمة النص الأول"]);
  });

  it("keeps a second chain inside the hadith before it", () => {
    expect(byNumber(2)?.paragraphs).toEqual(["حدثنا علان نص ثان", "حدثنا فلان بهذا الإسناد مثله"]);
  });

  it("matches displaced numbers with a later block of the same size", () => {
    expect(byNumber(3)?.paragraphs).toEqual(["حدثنا نص الثالث"]);
    expect([4, 5, 6].map((n) => byNumber(n)?.paragraphs[0])).toEqual([
      "حدثنا نص الرابع",
      "حدثنا نص الخامس",
      "حدثنا نص السادس",
    ]);
    expect(collection.report.inferredDisplaced).toEqual([4, 5, 6]);
    expect(byNumber(5)?.numbering).toBe("displaced");
  });

  it("fills a gap only when the unnumbered narration matches it exactly", () => {
    const filled = parseOpenitiHadith(SOURCE.replace("### | 13 - ", "### | 12 - "));
    expect(filled.report.inferredGap).toEqual([11]);
    expect(filled.hadiths.find((h) => h.number === 11)?.paragraphs).toEqual(["حدثنا نص بلا رقم"]);
  });

  it("reports numbers with no text and narration with no hadith to join", () => {
    expect(collection.report.missing).toEqual([9, 11, 12]);
    expect(collection.report.unassigned).toEqual([{ book: 2, chapter: 3, paragraphs: ["حدثنا نص بلا رقم"] }]);
    expect(collection.hadiths.map((h) => h.ordinal)).toEqual(collection.hadiths.map((_, i) => i + 1));
  });

  it("refuses a file without the OpenITI header", () => {
    expect(() => parseOpenitiHadith("no header")).toThrow(/header/);
  });
});

describe("cleanLine", () => {
  it("removes page and milestone markers", () => {
    expect(cleanLine("نص ms0123 آخر PageV02P057 @QB@ آية @QE@")).toBe("نص آخر آية");
  });
});
