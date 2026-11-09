import { describe, expect, it } from "vitest";
import { buildGalaxy, starSize, type Star } from "./galaxy.build";
import { kindOfCategory } from "./galaxy.constants";

// Fictional stars and counts: only the shape of the galaxy is tested.
const star = (id: string, kind: Star["kind"], work: boolean, texts: number): Star => ({
  id,
  kind,
  label: id,
  href: `/${id}`,
  hint: "",
  work,
  texts,
});

describe("buildGalaxy", () => {
  it("keeps lines between known stars and scales them within their kind", () => {
    const stars = [
      star("work:a", "hadith", true, 100),
      star("book:a.1", "hadith", false, 40),
      star("book:b.1", "hadith", false, 9),
      star("topic:x", "topic", false, 0),
    ];
    const galaxy = buildGalaxy(stars, [
      { source: "work:a", target: "book:a.1", kind: "part", count: 1 },
      { source: "book:a.1", target: "book:b.1", kind: "similar", count: 30 },
      { source: "topic:x", target: "book:b.1", kind: "cites", count: 2 },
      { source: "topic:x", target: "work:missing", kind: "cites", count: 5 },
      { source: "topic:x", target: "topic:x", kind: "cites", count: 1 },
    ]);
    expect(galaxy.graph.edges.map((e) => [e.source, e.target, e.kind, e.weight])).toEqual([
      ["work:a", "book:a.1", "part", 0.1],
      ["book:a.1", "book:b.1", "similar", 1],
      ["topic:x", "book:b.1", "cites", 1],
    ]);
    expect(galaxy.items.map((i) => i.id)).toEqual(stars.map((s) => s.id));
    expect(galaxy.items[0]).not.toHaveProperty("texts");
    expect(galaxy.graph.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });

  it("makes works the largest stars and grows parts slowly", () => {
    expect(starSize(star("work:quran", "quran", true, 6236))).toBe(16);
    expect(starSize(star("book:a.1", "hadith", false, 9))).toBeCloseTo(4.6);
    expect(starSize(star("book:a.2", "hadith", false, 1e9))).toBe(10);
  });
});

describe("kindOfCategory", () => {
  it("sorts works into kinds of stars", () => {
    expect(kindOfCategory("common", "quran")).toBe("quran");
    expect(kindOfCategory("shia", "hadith")).toBe("hadith");
    expect(kindOfCategory("external", "scripture")).toBe("external");
    expect(kindOfCategory("sunni", "tafsir")).toBe("books");
  });
});
