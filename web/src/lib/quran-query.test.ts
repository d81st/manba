import { describe, expect, it } from "vitest";
import { highlight, likePatterns, parseQuery } from "./quran-query";

// Arabic test words are ordinary dictionary words, not source text.

describe("parseQuery: addresses", () => {
  it("reads an ayah in several notations", () => {
    for (const q of ["2:255", " 2 : 255 ", "2.255", "2 255", "quran.2.255", "Коран 2:255", "сура 2:255", "٢:٢٥٥"]) {
      expect(parseQuery(q)).toEqual({ kind: "ayahs", sura: 2, from: 255, to: 255 });
    }
  });

  it("reads a range", () => {
    expect(parseQuery("2:255-257")).toEqual({ kind: "ayahs", sura: 2, from: 255, to: 257 });
    expect(parseQuery("2:255 – 257")).toEqual({ kind: "ayahs", sura: 2, from: 255, to: 257 });
  });

  it("reads a sura", () => {
    expect(parseQuery("112")).toEqual({ kind: "sura", sura: 112 });
    expect(parseQuery("Сура 18")).toEqual({ kind: "sura", sura: 18 });
  });

  it("rejects impossible addresses", () => {
    expect(parseQuery("115")).toEqual({ kind: "invalid" });
    expect(parseQuery("0:1")).toEqual({ kind: "invalid" });
    expect(parseQuery("2:0")).toEqual({ kind: "invalid" });
    expect(parseQuery("2:10-5")).toEqual({ kind: "invalid" });
  });
});

describe("parseQuery: words", () => {
  it("folds words without vowel marks", () => {
    expect(parseQuery("الكتاب")).toEqual({ kind: "text", words: ["الكتاب"], diacritics: false });
    expect(parseQuery("أحمد  كتاب")).toEqual({ kind: "text", words: ["احمد", "كتاب"], diacritics: false });
  });

  it("keeps vowel marks when the query has them", () => {
    expect(parseQuery("كَتَبَ")).toEqual({ kind: "text", words: ["كَتَبَ"], diacritics: true });
  });

  it("drops repeated words and non-Arabic tokens", () => {
    expect(parseQuery("كتاب كتاب book")).toEqual({ kind: "text", words: ["كتاب"], diacritics: false });
  });

  it("does not search Russian text yet", () => {
    expect(parseQuery("милость")).toEqual({ kind: "unsupported" });
    expect(parseQuery("   ")).toEqual({ kind: "empty" });
  });
});

describe("likePatterns", () => {
  it("escapes LIKE wildcards", () => {
    expect(likePatterns(["كتاب", "a%b_c\\"])).toEqual(["%كتاب%", "%a\\%b\\_c\\\\%"]);
  });
});

describe("highlight", () => {
  it("marks words containing a query word, ignoring vowel marks", () => {
    expect(highlight("هَٰذَا كِتَابٌ جَدِيدٌ", ["كتاب"], false)).toEqual([
      { text: "هَٰذَا ", match: false },
      { text: "كِتَابٌ", match: true },
      { text: " جَدِيدٌ", match: false },
    ]);
  });

  it("matches prefixed forms", () => {
    expect(highlight("ٱلْكِتَٰبُ", ["كتب"], false)).toEqual([{ text: "ٱلْكِتَٰبُ", match: true }]);
  });

  it("respects vowel marks when asked", () => {
    expect(highlight("كَتَبَ كُتُبٌ", ["كَتَبَ"], true)).toEqual([
      { text: "كَتَبَ", match: true },
      { text: " كُتُبٌ", match: false },
    ]);
  });

  it("returns the text untouched when there is nothing to mark", () => {
    const text = "كِتَابٌ جَدِيدٌ";
    expect(highlight(text, [], false)).toEqual([{ text, match: false }]);
    expect(highlight(text, ["قلم"], false).map((p) => p.text).join("")).toBe(text);
  });

  it("marks the source word when the standard spelling matches", () => {
    // Made-up pair: the source spells the long vowel with a superscript alef.
    const source = "هَٰذَا ٱلْكِتَٰبُ ۛ جَدِيدٌ";
    const standard = "هذا الكتاب جديد";
    expect(highlight(source, ["الكتاب"], false, standard)).toEqual([
      { text: "هَٰذَا ", match: false },
      { text: "ٱلْكِتَٰبُ", match: true },
      { text: " ۛ جَدِيدٌ", match: false },
    ]);
  });

  it("ignores a standard spelling that does not line up", () => {
    expect(highlight("ٱلْكِتَٰبُ جَدِيدٌ", ["الكتاب"], false, "الكتاب")).toEqual([
      { text: "ٱلْكِتَٰبُ جَدِيدٌ", match: false },
    ]);
  });
});
