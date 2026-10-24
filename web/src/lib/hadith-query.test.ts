import { describe, expect, it } from "vitest";
import { linkAddresses } from "./glossary-input.ts";
import {
  hadithAnchor,
  hadithPath,
  parseHadithQuery,
  parseRef,
  parseVariant,
  refLabel,
  variantLetters,
} from "./hadith-query.ts";

const ref = (work: string, ...path: number[]) => ({ kind: "ref", work, path });

describe("parseHadithQuery", () => {
  it("reads numbers with or without a collection name", () => {
    expect(parseHadithQuery("3951")).toEqual(ref("bukhari", 3951));
    expect(parseHadithQuery("Бухари 3951")).toEqual(ref("bukhari", 3951));
    expect(parseHadithQuery("аль-Бухари № 12")).toEqual(ref("bukhari", 12));
    expect(parseHadithQuery("bukhari.7563")).toEqual(ref("bukhari", 7563));
    expect(parseHadithQuery("٣٩٥١")).toEqual(ref("bukhari", 3951));
  });

  it("reads narrations of Muslim and a collection chosen on its page", () => {
    expect(parseHadithQuery("Муслим 1731")).toEqual(ref("muslim", 1731));
    expect(parseHadithQuery("Муслим 8b")).toEqual(ref("muslim", 8, 2));
    expect(parseHadithQuery("Сахих Муслима 21а")).toEqual({ kind: "unsupported" });
    expect(parseHadithQuery("Муслима 21б")).toEqual(ref("muslim", 21, 2));
    expect(parseHadithQuery("muslim.8.3")).toEqual(ref("muslim", 8, 3));
    expect(parseHadithQuery("8", "muslim")).toEqual(ref("muslim", 8));
    expect(parseHadithQuery("Тирмизи 12")).toEqual(ref("tirmidhi", 12));
    expect(parseHadithQuery("Абу Дауд 4297")).toEqual(ref("abu_dawud", 4297));
    expect(parseHadithQuery("ан-Насаи 1")).toEqual(ref("nasai", 1));
    expect(parseHadithQuery("Ибн Маджа 224")).toEqual(ref("ibn_majah", 224));
    expect(parseHadithQuery("Ахмад 12")).toEqual({ kind: "unsupported" });
  });

  it("reads al-Kafi by book, chapter and number", () => {
    expect(parseHadithQuery("аль-Кафи 4.60.3")).toEqual(ref("kafi", 4, 60, 3));
    expect(parseHadithQuery("kafi.1.1.1")).toEqual(ref("kafi", 1, 1, 1));
    expect(parseHadithQuery("4.60", "kafi")).toEqual(ref("kafi", 4, 60));
    expect(parseHadithQuery("Кафи 4.60.3b")).toEqual({ kind: "unsupported" });
  });

  it("reads Arabic words in the search form", () => {
    expect(parseHadithQuery("الأعمال بالنيات")).toEqual({ kind: "text", words: ["الاعمال", "بالنيات"], diacritics: false });
  });

  it("does not search in other languages yet", () => {
    expect(parseHadithQuery("намерения")).toEqual({ kind: "unsupported" });
    expect(parseHadithQuery("  ")).toEqual({ kind: "empty" });
  });
});

describe("linkAddresses with hadith references", () => {
  it("links loaded collections next to ayah addresses", () => {
    expect(linkAddresses("См. 3:123 и Сахих аль-Бухари 3951; Муслим 1731.")).toEqual([
      { text: "См. " },
      { sura: 3, from: 123, to: 123, text: "3:123" },
      { text: " и Сахих " },
      { work: "bukhari", path: [3951], text: "аль-Бухари 3951" },
      { text: "; " },
      { work: "muslim", path: [1731], text: "Муслим 1731" },
      { text: "." },
    ]);
  });

  it("links the four Sunan, with or without the article", () => {
    expect(linkAddresses("Сунан Абу Дауда 4297, ат-Тирмизи 2641 и Ибн Маджи 224")).toEqual([
      { text: "Сунан " },
      { work: "abu_dawud", path: [4297], text: "Абу Дауда 4297" },
      { text: ", " },
      { work: "tirmidhi", path: [2641], text: "ат-Тирмизи 2641" },
      { text: " и " },
      { work: "ibn_majah", path: [224], text: "Ибн Маджи 224" },
    ]);
  });

  it("links narrations by their letter and al-Kafi by its three numbers", () => {
    expect(linkAddresses("Муслим 8b, Муслим 21а, Муслим 9ab и аль-Кафи 4.60.3.")).toEqual([
      { work: "muslim", path: [8, 2], text: "Муслим 8b" },
      { text: ", " },
      { work: "muslim", path: [21, 1], text: "Муслим 21а" },
      { text: ", " },
      { work: "muslim", path: [9, 28], text: "Муслим 9ab" },
      { text: " и " },
      { work: "kafi", path: [4, 60, 3], text: "аль-Кафи 4.60.3" },
      { text: "." },
    ]);
  });
});

describe("hadith addresses", () => {
  it("counts letters a..z, then aa, ab, ...", () => {
    expect([1, 2, 26, 27, 28, 52, 53].map(variantLetters)).toEqual(["a", "b", "z", "aa", "ab", "az", "ba"]);
    expect(["a", "z", "aa", "ab", "ba", "б", "в"].map(parseVariant)).toEqual([1, 26, 27, 28, 53, 2, 3]);
    expect(parseVariant("abc")).toBeNull();
    expect(parseVariant("ё")).toBeNull();
  });

  it("reads each collection's written form", () => {
    expect(parseRef("number", "3951")).toEqual([3951]);
    expect(parseRef("number", "3951.2")).toBeNull();
    expect(parseRef("narration", "8b")).toEqual([8, 2]);
    expect(parseRef("narration", "8.2")).toEqual([8, 2]);
    expect(parseRef("narration", "8.2.1")).toBeNull();
    expect(parseRef("chapter", "4.60.3")).toEqual([4, 60, 3]);
    expect(parseRef("chapter", "4.0.3")).toBeNull();
  });

  it("writes labels, links and anchors; a letter only when a hadith has several narrations", () => {
    expect(refLabel("narration", [8, 2], 4)).toBe("8b");
    expect(refLabel("narration", [2937, 1], 1)).toBe("2937");
    expect(refLabel("number", [3951])).toBe("3951");
    expect(refLabel("chapter", [4, 60, 3])).toBe("4.60.3");
    expect(hadithPath("muslim", [8, 2])).toBe("/hadith/muslim/8b");
    expect(hadithPath("bukhari", [3951])).toBe("/hadith/bukhari/3951");
    expect(hadithPath("kafi", [4, 60, 3])).toBe("/hadith/kafi/4.60.3");
    expect(hadithAnchor([8, 2])).toBe("h-8-2");
    expect(hadithAnchor([3951])).toBe("h-3951");
  });
});
