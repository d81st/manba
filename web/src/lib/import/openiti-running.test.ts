import { describe, expect, it } from "vitest";
import { parseOpenitiRunning } from "./openiti-running.ts";

// Fictional test data in the annotated OpenITI layout: not real hadiths.
const SOURCE = [
  "######OpenITI#",
  "#META#Header#End#",
  "# بسم الله تجريبي",
  "### | مسند تجريبي (1)",
  "### || حديث أول",
  "# سند الرواية التجريبي",
  "# 1 - حدثنا نص أول (2)",
  "# تتمة. 2 - حدثنا نص ثان",
  "# 4 - حدثنا نص رابع",
  "# . . . . . . .",
  "### ||| حديث ثان",
  "# • 5 - قال عبد الله تجريبي",
  "# 5 - حدثنا رقم مكرر",
  "# 10 - حدثنا بعد ضياع أرقام",
  "# 11 - حدثنا",
  "# 12 - حدثنا",
  "# 5/1 - حدثنا زيادة المحققين",
  "### | [ملحق تجريبي]",
  "### || حديث ثالث",
  "# . . . / 2 - حدثنا زيادة ثانية",
  "# 13 - حدثنا",
].join("\n");

describe("parseOpenitiRunning", () => {
  const musnad = parseOpenitiRunning(SOURCE);
  const texts = musnad.hadiths.map((h) => [h.number, h.part, h.book, h.chapter, h.paragraphs]);

  it("reads parts as books and companions as chapters; the opening lines go before the first chapter", () => {
    expect(musnad.books).toEqual([
      { number: 1, title: "مسند تجريبي" },
      { number: 2, title: "ملحق تجريبي" },
    ]);
    expect(musnad.chapters.map((c) => [c.book, c.index, c.title, c.intro])).toEqual([
      [1, 1, "حديث أول", ["بسم الله تجريبي", "سند الرواية التجريبي"]],
      [1, 2, "حديث ثان", []],
      [2, 1, "حديث ثالث", []],
    ]);
  });

  it("numbers straight through, splits only the next number inside a paragraph, and drops footnote marks", () => {
    expect(texts.slice(0, 4)).toEqual([
      [1, null, 1, 1, ["حدثنا نص أول", "تتمة."]],
      [2, null, 1, 1, ["حدثنا نص ثان"]],
      [4, null, 1, 1, ["حدثنا نص رابع"]],
      [5, null, 1, 2, ["قال عبد الله تجريبي", "5 - حدثنا رقم مكرر"]],
    ]);
    expect(musnad.report.footnotes).toBe(2);
    expect(musnad.report.bullets).toBe(1);
    expect(musnad.report.inline).toBe(1);
  });

  it("takes a longer jump only when the numbers after it go on, and keeps the editors' added hadiths apart", () => {
    expect(texts.slice(4)).toEqual([
      [10, null, 1, 2, ["حدثنا بعد ضياع أرقام"]],
      [11, null, 1, 2, ["حدثنا"]],
      [12, null, 1, 2, ["حدثنا"]],
      [5, 1, 1, 2, ["حدثنا زيادة المحققين"]],
      [5, 2, 2, 1, ["حدثنا زيادة ثانية"]],
      [13, null, 2, 1, ["حدثنا"]],
    ]);
    expect(musnad.report.missing).toEqual([3, 6, 7, 8, 9]);
    expect(musnad.report.parts).toBe(2);
    expect(musnad.report.ignored).toEqual([{ number: 5, text: "5 - حدثنا رقم مكرر" }]);
  });
});
