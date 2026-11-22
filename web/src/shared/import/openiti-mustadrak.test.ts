import { describe, expect, it } from "vitest";
import { mustadrakToNumbered, TALKHIS_LABEL } from "./openiti-mustadrak.ts";
import { parseOpenitiNumbered } from "./openiti-numbered.ts";

// Fictional test data in the layout of the OpenITI export: not real reports.
const SOURCE = [
  "######OpenITI#",
  "#META#Header#End#",
  "### | كتاب تجريبي",
  "# PageV01P043",
  "### | 1 - ",
  "# نص أول",
  `### | ${TALKHIS_LABEL}`,
  "# 1 - تعليق أول",
  "# PageV00P000",
  "### | 2 - ",
  "# نص ثان بسند أول",
  "# PageV00P000",
  "### | عنوان بين السندين",
  "# PageV01P044",
  "### | 2 - ",
  "# نص ثان بسند آخر",
  "### | [التعليق - من ms0002 تلخيص الذهبي]",
  "# 2 ms0001 - تعليق ثان",
  "# PageV00P000",
  "### | 4 - ",
  "# نص رابع",
  `### | ${TALKHIS_LABEL}`,
  "# 3 - تعليق برقم آخر",
].join("\n");

describe("al-Mustadrak export", () => {
  const { text, report } = mustadrakToNumbered(SOURCE);
  const data = parseOpenitiNumbered(text);

  it("keeps al-Dhahabi's remark in its report, under the editor's label", () => {
    expect(data.hadiths.map((h) => h.number)).toEqual([1, 2, 4]);
    expect(data.hadiths[0].paragraphs).toEqual(["نص أول", `${TALKHIS_LABEL} 1 - تعليق أول`]);
    expect(report.remarks).toBe(3);
    expect(report.mismatched).toEqual(["4/3"]);
  });

  it("folds a repeated number and the heading before it into one report", () => {
    expect(data.hadiths[1].paragraphs).toEqual(["نص ثان بسند أول", "عنوان بين السندين", "نص ثان بسند آخر", `${TALKHIS_LABEL} 2 - تعليق ثان`]);
    expect(report.repeated).toEqual([2]);
    expect(data.report.missing).toEqual([3]);
  });
});
