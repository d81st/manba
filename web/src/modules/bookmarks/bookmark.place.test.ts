import { describe, expect, it } from "vitest";
import { readingSection } from "./bookmark.place";

describe("readingSection", () => {
  it("knows the pages that are read from top to bottom", () => {
    expect(readingSection("/quran/2")).toBe("quran");
    expect(readingSection("/hadith/bukhari/book/1")).toBe("hadith");
    expect(readingSection("/library/ibn_hisham/s/3")).toBe("library");
    expect(readingSection("/library/ibn_hisham/1.235")).toBe("library");
    expect(readingSection("/external/tanakh/1/1")).toBe("external");
  });

  it("leaves out contents, maps, searches and the rest of the site", () => {
    for (const path of ["/", "/quran", "/quran/map", "/quran/search", "/hadith", "/hadith/bukhari", "/hadith/search", "/library/ibn_hisham", "/library/ibn_hisham/search", "/topics/jihad", "/admin/topics/1"]) {
      expect(readingSection(path)).toBeNull();
    }
  });
});
