import { describe, expect, it } from "vitest";
import { linkAddresses, parseRefs, formatRefs } from "./glossary-input.ts";
import { bookAnchor, bookPath, formatBookRef, pageLabel, parseBookRef, parsePageRef } from "./book-query.ts";

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
