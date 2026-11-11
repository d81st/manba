import { describe, expect, it } from "vitest";
import { bookmarkOwner, checkBookmark, MAX_TITLE } from "./bookmark.validation";

describe("checkBookmark", () => {
  it("keeps a page of this site with its anchor and tidies the words", () => {
    expect(checkBookmark({ page: "/quran/2#2-255", title: "  Сура 2 ·  2:255 ", note: null })).toEqual({
      bookmark: { page: "/quran/2#2-255", title: "Сура 2 · 2:255", note: "" },
    });
  });

  it("refuses another site's address and an empty name, cuts a long name", () => {
    for (const page of ["https://example.com", "//example.com", "/\\x", "", 7]) {
      expect(checkBookmark({ page, title: "x", note: "" }).problem).toBe("badPage");
    }
    expect(checkBookmark({ page: "/", title: "   ", note: "" }).problem).toBe("noTitle");
    expect(checkBookmark({ page: "/", title: "я".repeat(900), note: "" }).bookmark?.title).toHaveLength(MAX_TITLE);
  });
});

describe("bookmarkOwner", () => {
  it("tells the main administrator from an account", () => {
    expect(bookmarkOwner({})).toBe("owner");
    expect(bookmarkOwner({ uid: 7 })).toBe("user:7");
  });
});
