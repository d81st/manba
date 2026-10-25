import { describe, expect, it } from "vitest";
import { linkAddresses, parseRefs, formatRefs } from "./glossary-input.ts";
import { bookAnchor, bookPath, formatBookRef, pageLabel, parseBookQuery, parseBookRef, parsePageRef } from "./book-query.ts";

describe("book references by volume and page", () => {
  it("reads pages and pieces of a page", () => {
    expect(parsePageRef("1:235")).toEqual([1, 235]);
    expect(parsePageRef("1:235b")).toEqual([1, 235, 2]);
    expect(parsePageRef("2:58в")).toEqual([2, 58, 3]);
    expect(parsePageRef("1.235")).toEqual([1, 235]);
    expect(parsePageRef("1.235.2")).toEqual([1, 235, 2]);
    expect(parsePageRef("0:5")).toBeNull();
    expect(parsePageRef("235")).toBeNull();
  });

  it("reads and writes references with the book's name", () => {
    expect(parseBookRef("Ибн Хишам 1:235")).toBe("ibn_hisham.1.235");
    expect(parseBookRef("Сира Ибн Хишама 2:58c")).toBe("ibn_hisham.2.58.3");
    expect(parseBookRef("Ибн Хишам 235")).toBeNull();
    expect(parseBookRef("Бухари 1")).toBeNull();
    expect(formatBookRef("ibn_hisham.2.58.3")).toBe("Ибн Хишам 2:58c");
    expect(formatBookRef("ibn_hisham.1.235")).toBe("Ибн Хишам 1:235");
  });

  it("writes labels, links and anchors; a letter only when a page has several pieces", () => {
    expect(pageLabel([1, 235, 1], 1)).toBe("1:235");
    expect(pageLabel([1, 235, 2], 3)).toBe("1:235b");
    expect(bookPath("ibn_hisham", [1, 235])).toBe("/library/ibn_hisham/1.235");
    expect(bookAnchor([1, 235, 2])).toBe("p-1-235-2");
  });
});

describe("book references in forms and text", () => {
  it("reads them next to ayahs and hadiths and writes them back", () => {
    const { addresses, invalid } = parseRefs("2:255, Ибн Хишам 1:235b, Бухари 1, Ибн Хишам 2:58");
    expect(addresses).toEqual(["quran.2.255", "ibn_hisham.1.235.2", "bukhari.1", "ibn_hisham.2.58"]);
    expect(invalid).toEqual([]);
    expect(formatRefs(addresses)).toBe("2:255, Ибн Хишам 1:235b, Бухари 1, Ибн Хишам 2:58");
  });

  it("links a page in running text, not the ayah-like numbers inside it", () => {
    expect(linkAddresses("См. Ибн Хишам 1:235b и 2:255.")).toEqual([
      { text: "См. " },
      { book: "ibn_hisham", path: [1, 235, 2], text: "Ибн Хишам 1:235b" },
      { text: " и " },
      { sura: 2, from: 255, to: 255, text: "2:255" },
      { text: "." },
    ]);
  });
});

describe("the book search box", () => {
  it("opens a page or searches Arabic words", () => {
    expect(parseBookQuery("1:235", "ibn_hisham")).toEqual({ kind: "ref", path: [1, 235] });
    expect(parseBookQuery("Ибн Хишам 2:58b", "ibn_hisham")).toEqual({ kind: "ref", path: [2, 58, 2] });
    expect(parseBookQuery("غار حراء", "ibn_hisham")).toEqual({ kind: "text", words: ["غار", "حراء"], diacritics: false });
    expect(parseBookQuery("235", "ibn_hisham")).toEqual({ kind: "unsupported" });
    expect(parseBookQuery("пещера", "ibn_hisham")).toEqual({ kind: "unsupported" });
    expect(parseBookQuery("  ", "ibn_hisham")).toEqual({ kind: "empty" });
  });
});

describe("tafsir references by surah and ayah", () => {
  it("reads, writes and links them", () => {
    expect(parseBookRef("Ибн Касир 2:255")).toBe("tafsir_ibn_kathir.2.255");
    expect(parseBookRef("Тафсир Ибн Касира 2:125b")).toBe("tafsir_ibn_kathir.2.125.2");
    expect(parseBookRef("Ибн Касир 2:0")).toBe("tafsir_ibn_kathir.2.0");
    expect(parseBookRef("Ибн Касир 0:12")).toBe("tafsir_ibn_kathir.0.12");
    expect(parseBookRef("Ибн Касир 115:1")).toBeNull();
    expect(formatBookRef("tafsir_ibn_kathir.2.125.2")).toBe("Ибн Касир 2:125b");
    expect(parseBookQuery("2:255", "tafsir_ibn_kathir")).toEqual({ kind: "ref", path: [2, 255] });
    expect(linkAddresses("Ибн Касир 2:255 и Ибн Хишам 1:235")).toEqual([
      { book: "tafsir_ibn_kathir", path: [2, 255], text: "Ибн Касир 2:255" },
      { text: " и " },
      { book: "ibn_hisham", path: [1, 235], text: "Ибн Хишам 1:235" },
    ]);
  });
});
