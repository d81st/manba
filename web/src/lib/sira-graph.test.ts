import { describe, expect, it } from "vitest";
import { searchKey } from "./arabic.ts";
import { coMentions, forceLayout, nameMatcher } from "./sira-graph.ts";

// Fictional test data: made-up sentences, not a real text.
describe("nameMatcher", () => {
  it("finds a name as a word, not as a father's name", () => {
    const abuTalib = nameMatcher(["أبو طالب", "أبي طالب"])!;
    expect(abuTalib.test(searchKey("قال أبو طالب كلاما"))).toBe(true);
    expect(abuTalib.test(searchKey("وأبي طالب"))).toBe(true);
    expect(abuTalib.test(searchKey("جاء علي بن أبي طالب"))).toBe(false);
    const hamza = nameMatcher(["حمزة"])!;
    expect(hamza.test(searchKey("حمزة وغيره"))).toBe(true);
    expect(hamza.test(searchKey("حمزتان"))).toBe(false);
    expect(nameMatcher([])).toBeNull();
  });
});

describe("coMentions", () => {
  it("counts the chapters where both names stand", () => {
    const texts = [
      { unit: "1", plain: searchKey("خديجة وورقة") },
      { unit: "1", plain: searchKey("حمزة") },
      { unit: "2", plain: searchKey("خديجة ثم ورقة") },
      { unit: "3", plain: searchKey("خديجة") },
    ];
    const people = [
      { slug: "khadija", forms: ["خديجة"] },
      { slug: "waraqa", forms: ["ورقة"] },
      { slug: "hamza", forms: ["حمزة"] },
      { slug: "muhammad", forms: [] },
    ];
    expect(coMentions(texts, people)).toEqual({
      units: { khadija: 3, waraqa: 2, hamza: 1 },
      pairs: [{ a: "khadija", b: "waraqa", count: 2 }],
    });
    expect(coMentions(texts, people, 1).pairs).toHaveLength(3);
  });
});

describe("forceLayout", () => {
  it("keeps nodes apart, inside the box and the same on every run", () => {
    const nodes = ["a", "b", "c", "d"];
    const links = [{ a: "a", b: "b", strength: 1 }];
    const first = forceLayout(nodes, links, 400, 300);
    expect(forceLayout(nodes, links, 400, 300)).toEqual(first);
    for (const [x, y] of Object.values(first)) {
      expect(x).toBeGreaterThanOrEqual(40);
      expect(x).toBeLessThanOrEqual(360);
      expect(y).toBeGreaterThanOrEqual(40);
      expect(y).toBeLessThanOrEqual(260);
    }
    const dist = (p: string, q: string) => Math.hypot(first[p][0] - first[q][0], first[p][1] - first[q][1]);
    expect(dist("a", "b")).toBeGreaterThan(20);
    expect(dist("c", "d")).toBeGreaterThan(20);
  });
});
