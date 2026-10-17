import { describe, expect, it } from "vitest";
import { hasDiacritics, searchKey, stripDiacritics } from "./arabic";

// Test strings are ordinary dictionary words (book, school, ...), written with
// explicit code points where the difference is invisible. Not source texts.

describe("searchKey", () => {
  it("drops vowel marks, tanwin, shadda and sukun", () => {
    expect(searchKey("كِتَابٌ")).toBe("كتاب");
    expect(searchKey("مُدَرِّسٌ")).toBe("مدرس");
    expect(searchKey("مَكْتَبٌ")).toBe("مكتب");
  });

  it("drops the superscript (dagger) alef used in Uthmani spelling", () => {
    expect(searchKey("هَٰذَا")).toBe("هذا");
  });

  it("folds alef variants, alef maksura and teh marbuta", () => {
    expect(searchKey("أَحْمَد")).toBe("احمد");
    expect(searchKey("إِسْم")).toBe("اسم");
    expect(searchKey("آخِر")).toBe("اخر");
    expect(searchKey("ٱلْكِتَاب")).toBe("الكتاب");
    expect(searchKey("مُوسَى")).toBe("موسي");
    expect(searchKey("مَدْرَسَةٌ")).toBe("مدرسه");
  });

  it("folds Persian letter forms", () => {
    expect(searchKey("کتاب")).toBe("كتاب");
    expect(searchKey("علی")).toBe("علي");
  });

  it("removes tatweel and invisible characters", () => {
    expect(searchKey("كتـــاب")).toBe("كتاب");
    expect(searchKey("كت‌اب‏")).toBe("كتاب");
  });

  it("turns presentation forms into plain letters", () => {
    expect(searchKey("ﻛﺘﺎﺏ")).toBe("كتاب");
  });

  it("turns Arabic-Indic digits into ASCII digits", () => {
    expect(searchKey("٢٥٥")).toBe("255");
    expect(searchKey("۱۲۳")).toBe("123");
  });

  it("collapses whitespace", () => {
    expect(searchKey("  كتاب \n  جديد ")).toBe("كتاب جديد");
  });

  it("matches the same word written with and without marks", () => {
    expect(searchKey("الكِتَابُ")).toBe(searchKey("الكتاب"));
  });

  describe("with diacritics kept", () => {
    it("keeps vowel marks but still folds letters", () => {
      expect(searchKey("أَحْمَد", { diacritics: true })).toBe("اَحْمَد");
    });

    it("treats shadda and vowel in either order as equal", () => {
      const shaddaFirst = "دَّ";
      const vowelFirst = "دَّ";
      expect(searchKey(shaddaFirst, { diacritics: true })).toBe(
        searchKey(vowelFirst, { diacritics: true }),
      );
    });

    it("drops Quranic annotation signs", () => {
      expect(searchKey("كِتَابۖ", { diacritics: true })).toBe("كِتَاب");
    });

    it("tells apart words that differ only in vowels", () => {
      expect(searchKey("كَتَبَ", { diacritics: true })).not.toBe(
        searchKey("كُتُبٌ", { diacritics: true }),
      );
      expect(searchKey("كَتَبَ")).toBe(searchKey("كُتُب"));
    });
  });
});

describe("hasDiacritics", () => {
  it("detects vowel marks", () => {
    expect(hasDiacritics("كِتَاب")).toBe(true);
    expect(hasDiacritics("كتاب")).toBe(false);
  });

  it("is stable across calls", () => {
    expect(hasDiacritics("كِ")).toBe(true);
    expect(hasDiacritics("كِ")).toBe(true);
  });
});

describe("stripDiacritics", () => {
  it("keeps letter variants as they are", () => {
    expect(stripDiacritics("أَحْمَد")).toBe("أحمد");
    expect(stripDiacritics("مَدْرَسَةٌ")).toBe("مدرسة");
  });
});
