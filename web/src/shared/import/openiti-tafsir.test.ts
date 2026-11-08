import { describe, expect, it } from "vitest";
import { parseOpenitiTafsir } from "./openiti-tafsir.ts";

// Fictional test data in the OpenITI layout of the Tafsir of Ibn Kathir: not a real text.
// Three surahs of 4, 2 and 2 ayahs.
const COUNTS = [0, 4, 2, 2];
const SOURCE = [
  "######OpenITI#",
  "#META#Header#End#",
  "### | مقدمة تجريبية",
  "# نص المقدمة PageV01P001",
  "### || فصل في الفضائل (1)",
  "# نص الفصل",
  "### | تفسير سورة أولى",
  "# كلام عن السورة",
  "### || {آية أولى (1) آية ثانية",
  " تتمة بلا علامة (2) }",
  "# تفسير الآيتين",
  "### || فصل",
  "# تتمة التفسير",
  "# {آية ثالثة (3) }",
  "# تفسير الثالثة",
  "### | تفسير سورة ثانية",
  "### || {بسم الله آية 1}",
  "# تفسير الأولى",
  "### || {آية ثانية (2) } .",
  "# تفسير الثانية",
  "### || {سورة بلا عنوان (1) والثانية (2) }",
  "# تفسير السورة الثالثة",
].join("\n");

describe("parseOpenitiTafsir", () => {
  const book = parseOpenitiTafsir(SOURCE, COUNTS);
  const comments = book.comments.map((c) => [c.sura, c.from, c.to, c.paragraphs]);

  it("keeps the introduction in numbered parts", () => {
    expect(book.intro).toEqual([
      { index: 1, title: "مقدمة تجريبية", paragraphs: ["نص المقدمة"] },
      { index: 2, title: "فصل في الفضائل (1)", paragraphs: ["نص الفصل"] },
    ]);
  });

  it("addresses each comment by its surah and the ayahs its heading quotes", () => {
    expect(comments).toEqual([
      [1, 0, 0, ["كلام عن السورة"]],
      [1, 1, 2, ["تفسير الآيتين", "فصل", "تتمة التفسير"]],
      [1, 3, 3, ["تفسير الثالثة"]],
      [2, 1, 1, ["تفسير الأولى"]],
      [2, 2, 2, ["تفسير الثانية"]],
      [3, 1, 2, ["تفسير السورة الثالثة"]],
    ]);
  });

  it("finds a surah whose heading is lost and reports what no heading quotes", () => {
    expect(book.report.unheaded).toEqual([3]);
    expect(book.report.uncovered).toEqual([{ sura: 1, ayahs: [4] }]);
  });
});
