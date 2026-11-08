import { describe, expect, it } from "vitest";
import { decodeFormulas, fadailToAnnotated, masahifToAnnotated } from "./openiti-jk.ts";
import { parseOpenitiRunning } from "./openiti-running.ts";

// Fictional test data in the JK layouts: not a real text.
describe("masahifToAnnotated", () => {
  const source = [
    "#META#Header#End#",
    "# | بسم الله الرحمن الرحيم | الجزء الأول |",
    "# | باب تجريبي",
    "# [ 1 ] حدثنا فلان عن | فلان قال النبي [ $ ] كلاما . | PageV01P033 |",
    "# [ 2 ] حدثنا فلان قال رسول الله [",
    "# | ] كلاما آخر .",
    "# باب | ثان $ |",
    "# 3 ] حدثنا فلان ^ ( آية تجريبية ) ^ [ البقرة : 1 ] .",
  ].join("\n");
  const book = parseOpenitiRunning(masahifToAnnotated(source));

  it("finds parts, chapters and reports, and glues a blessing broken over two lines", () => {
    expect(book.books.map((b) => b.title)).toEqual(["بسم الله الرحمن الرحيم الجزء الأول"]);
    expect(book.chapters.map((c) => c.title)).toEqual(["باب تجريبي", "باب ثان"]);
    expect(book.hadiths.map((h) => [h.number, h.chapter, h.paragraphs])).toEqual([
      [1, 1, ["حدثنا فلان عن فلان قال النبي صلى الله عليه وسلم كلاما ."]],
      [2, 1, ["حدثنا فلان قال رسول الله صلى الله عليه وسلم كلاما آخر ."]],
      [3, 2, ["حدثنا فلان ( آية تجريبية ) [ البقرة : 1 ] ."]],
    ]);
  });
});

describe("fadailToAnnotated", () => {
  it("reads records between markers and decodes the formulas; the editor's footnotes are left out", () => {
    const source = [
      "#META#Header#End#",
      "# عنوان PageV01P001 كتاب تجريبي PageV01P002 باب أول PageV01P003 1 - حدثنا",
      "~~فلان عن النبي A وعن عمر Bه قال أبو عبيد C : كتاب الله D (1)",
      "# __________",
      "# (1) حاشية المحقق PageV01P004 2 - حدثنا فلان PageV01P005",
    ].join("\n");
    const book = parseOpenitiRunning(fadailToAnnotated(source));
    expect(book.books.map((b) => b.title)).toEqual(["كتاب تجريبي"]);
    expect(book.chapters.map((c) => c.title)).toEqual(["باب أول"]);
    expect(book.hadiths.map((h) => [h.number, h.paragraphs])).toEqual([
      [1, ["حدثنا فلان عن النبي صلى الله عليه وسلم وعن عمر رضي الله عنه قال أبو عبيد رحمه الله : كتاب الله عز وجل"]],
      [2, ["حدثنا فلان"]],
    ]);
  });

  it("decodes a letter only where it stands alone", () => {
    expect(decodeFormulas("النبي A ، عائشة Bها")).toBe("النبي صلى الله عليه وسلم ، عائشة رضي الله عنها");
    expect(decodeFormulas("ABC Bx")).toBe("ABC Bx");
  });
});
