import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps a path of this site", () => {
    expect(safeNext("/quran/2#2-255")).toBe("/quran/2#2-255");
    expect(safeNext("/topics?category=hard")).toBe("/topics?category=hard");
  });

  it("rejects another site, a scheme and control characters", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext("/quran\nSet-Cookie: x")).toBe("/");
    expect(safeNext("/%2F%2Fevil.example")).toBe("/");
    expect(safeNext("/%5Cevil.example")).toBe("/");
    expect(safeNext("/%252F%252Fevil.example")).toBe("/");
    expect(safeNext("%2F%2Fevil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});
