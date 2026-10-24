import { describe, expect, it } from "vitest";
import { markShared } from "./shared-words.ts";

// Fictional test data: not real hadiths.
describe("markShared", () => {
  it("marks words that form a pair of words found in the other text, ignoring diacritics", () => {
    expect(markShared("قال الرجل الكبير قولا", "قَالَ الرَّجُلُ شيئا")).toEqual([
      { text: "قال الرجل", shared: true },
      { text: " الكبير قولا", shared: false },
    ]);
  });

  it("keeps the text exactly, punctuation and line breaks included", () => {
    const text = "حدثنا فلان: كتب الكتاب، ثم\nذهب";
    const pieces = markShared(text, "كتب الكتاب ثم ذهب");
    expect(pieces.map((p) => p.text).join("")).toBe(text);
    expect(pieces.filter((p) => p.shared).map((p) => p.text)).toEqual(["كتب الكتاب، ثم\nذهب"]);
  });

  it("marks nothing when only single words repeat", () => {
    expect(markShared("واحد اثنان ثلاثة", "ثلاثة اثنان واحد")).toEqual([{ text: "واحد اثنان ثلاثة", shared: false }]);
  });
});
