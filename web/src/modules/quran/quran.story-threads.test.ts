import { describe, expect, it } from "vitest";
import { inTextOrder, STORIES, storyBySlug, storyPattern } from "./quran.story-threads";

describe("story threads", () => {
  it("matches a name as a whole word, with particles and the accusative alif", () => {
    const pattern = new RegExp(storyPattern(storyBySlug("nuh")!));
    expect(pattern.test("ولقد ارسلنا نوحا الي قومه")).toBe(true);
    expect(pattern.test("قوم نوح")).toBe(true);
    expect(pattern.test("ونوح")).toBe(true);
    expect(pattern.test("نوحي اليه")).toBe(false);
  });

  it("has unique slugs and orders ayahs as in the text", () => {
    expect(new Set(STORIES.map((s) => s.slug)).size).toBe(STORIES.length);
    expect(inTextOrder(["10:3", "2:255", "2:30", "10:1"])).toEqual(["2:30", "2:255", "10:1", "10:3"]);
  });
});
