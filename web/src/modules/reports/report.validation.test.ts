import { describe, expect, it } from "vitest";
import { checkReport, MAX_QUOTE } from "./report.validation";

describe("checkReport", () => {
  it("accepts a page of this site with an anchor and trims the text", () => {
    expect(checkReport({ page: "/quran/2#2-255", quote: "  два   слова ", message: "  опечатка в переводе " })).toEqual({
      report: { page: "/quran/2#2-255", quote: "два слова", message: "опечатка в переводе" },
    });
  });

  it("refuses another site's address and control characters", () => {
    for (const page of ["https://example.com/x", "//example.com", "/\\example.com", "", "/a\nb", 5]) {
      expect(checkReport({ page, quote: "", message: "достаточно длинное" }).problem).toBe("badPage");
    }
  });

  it("wants a message of a sensible length and cuts a long quote", () => {
    expect(checkReport({ page: "/", quote: "", message: "да" }).problem).toBe("tooShort");
    expect(checkReport({ page: "/", quote: "", message: "я".repeat(2001) }).problem).toBe("tooLong");
    expect(checkReport({ page: "/", quote: "я".repeat(3000), message: "достаточно" }).report?.quote).toHaveLength(MAX_QUOTE);
  });
});
