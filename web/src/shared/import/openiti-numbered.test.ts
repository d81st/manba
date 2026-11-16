import { describe, expect, it } from "vitest";
import { parseOpenitiNumbered } from "./openiti-numbered.ts";

// Fictional test data in the OpenITI layout: not a real report.
const SOURCE = [
  "######OpenITI#",
  "#META# 020.BookTITLE\t:: المصنف",
  "#META#Header#End#",
  "### | كتاب تجريبي",
  "# PageV00P000",
  "### | باب أول",
  "### | 1 - ",
  "# نص تجريبي ms0001 أول",
  "~~يتبع",
  "### | [ص: 2]",
  "### | 3 - ",
  "# نص الثالث",
  "### | عنوان بلا كلمة كتاب",
  "### | 12 ms0009 - ",
  "# نص الثاني عشر",
].join("\n");

describe("numbered OpenITI collection", () => {
  const data = parseOpenitiNumbered(SOURCE);

  it("reads books, chapters and the edition's numbers, and leaves gaps empty", () => {
    expect(data.books.map((b) => b.title)).toEqual(["كتاب تجريبي"]);
    expect(data.chapters.map((c) => c.title)).toEqual(["باب أول", "عنوان بلا كلمة كتاب"]);
    expect(data.hadiths.map((h) => [h.number, h.paragraphs[0]])).toEqual([
      [1, "نص تجريبي أول يتبع"],
      [3, "نص الثالث"],
      [12, "نص الثاني عشر"],
    ]);
    expect(data.report.missing).toEqual([2, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(data.report.inferredGap).toEqual([]);
    expect(data.hadiths[2].chapter).toBe(2);
  });
});
