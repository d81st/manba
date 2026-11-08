import { describe, expect, it } from "vitest";
import { parseOpenitiKafi } from "./openiti-kafi.ts";

// Fictional test data in the OpenITI layout of al-Kafi: not real hadiths.
const SOURCE = [
  "######OpenITI#",
  "#META#Header#End#",
  "### |",
  "# خطبة تجريبية",
  "### | (كتاب أول)",
  "# بسم الله تجريبي",
  "### || (باب) * أول",
  "# 1 - حدثنا نص أول",
  "~~تتمته",
  "# تتمة بعد الصفحة. 2 - حدثنا نص ثان",
  "# 4 - حدثنا نص رابع فيه 7 - عدد ليس رقما",
  "### || (باب ثان)",
  "# نص الباب",
  "# 1 - حدثنا نص",
  "# 1 - حدثنا رقم مكرر",
  "### | (أبواب فرعية)",
  "### || (باب ثالث)",
  "# 1 حدثنا رقم بلا شرطة",
  "# 3 - حدثنا رقمه الثاني ضائع",
  "### | (كتاب الروضة)",
  "### || (حديث أول)",
  "# 1 - حدثنا",
  "# 2 - حدثنا",
  "### || (حديث ثان)",
  "# 3 - حدثنا رقم متصل",
  "### || (حديث ثالث)",
  "# 4 - حدثنا",
].join("\n");

describe("parseOpenitiKafi", () => {
  const kafi = parseOpenitiKafi(SOURCE);
  const at = (book: number, chapter: number) =>
    kafi.hadiths.filter((h) => h.book === book && h.chapter === chapter).map((h) => [h.number, h.paragraphs]);

  it("keeps the author's preface as book 0 and numbers books in order", () => {
    expect(kafi.books).toEqual([
      { number: 0, title: "خطبة الكتاب" },
      { number: 1, title: "كتاب أول" },
      { number: 2, title: "كتاب الروضة" },
    ]);
    expect(kafi.chapters.map((c) => [c.book, c.index, c.title, c.intro])).toEqual([
      [0, 1, "", ["خطبة تجريبية"]],
      [1, 1, "باب أول", ["بسم الله تجريبي"]],
      [1, 2, "باب ثان", ["نص الباب"]],
      [1, 3, "باب ثالث", ["أبواب فرعية"]],
      [2, 1, "حديث أول", []],
      [2, 2, "حديث ثان", []],
      [2, 3, "حديث ثالث", []],
    ]);
  });

  it("splits a number inside a paragraph only when it is the next one", () => {
    expect(at(1, 1)).toEqual([
      [1, ["حدثنا نص أول تتمته", "تتمة بعد الصفحة."]],
      [2, ["حدثنا نص ثان"]],
      [4, ["حدثنا نص رابع فيه 7 - عدد ليس رقما"]],
    ]);
    expect(kafi.report.inline).toBe(1);
  });

  it("restarts numbers in each chapter, except where they run on (al-Rawda)", () => {
    expect(at(1, 2)).toEqual([[1, ["حدثنا نص", "1 - حدثنا رقم مكرر"]]]);
    expect(at(1, 3)).toEqual([
      [1, ["حدثنا رقم بلا شرطة"]],
      [3, ["حدثنا رقمه الثاني ضائع"]],
    ]);
    expect(at(2, 2)).toEqual([[3, ["حدثنا رقم متصل"]]]);
    expect(kafi.report.runOn).toEqual([2]);
  });

  it("reports lost and out-of-order numbers instead of guessing", () => {
    expect(kafi.report.gaps).toEqual([
      { book: 1, chapter: 1, numbers: [3] },
      { book: 1, chapter: 3, numbers: [2] },
    ]);
    expect(kafi.report.ignored).toEqual([{ book: 1, chapter: 2, text: "1 - حدثنا رقم مكرر" }]);
    expect(kafi.report.hadiths).toBe(10);
  });
});
