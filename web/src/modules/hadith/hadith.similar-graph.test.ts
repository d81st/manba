import { describe, expect, it } from "vitest";
import { pickSimilar, similarGraph, similarKind } from "./hadith.similar-graph";

// Fictional addresses and shares: only the shape of the graph is tested.
describe("pickSimilar", () => {
  it("takes the closest neighbours first, then theirs, up to the limits", () => {
    const first = [
      { other: "muslim.1.1", share: 0.5 },
      { other: "nasai.2.1", share: 0.9 },
      { other: "ahmad.3", share: 0.7 },
    ];
    const second = [
      { other: "tirmidhi.4.1", share: 0.4 },
      { other: "ibn_majah.5", share: 0.8 },
    ];
    expect(pickSimilar("bukhari.1", first, second, { first: 2, total: 4 })).toEqual([
      "bukhari.1",
      "nasai.2.1",
      "ahmad.3",
      "ibn_majah.5",
    ]);
  });
});

describe("similarGraph", () => {
  it("sizes the center and its neighbours, keeps only links among the texts", () => {
    const texts = [
      { address: "bukhari.1", work: "bukhari", label: "Бухари 1", href: "/hadith/bukhari/1" },
      { address: "kafi.1.2.3", work: "kafi", label: "аль-Кафи 1.2.3", href: "/hadith/kafi/1.2.3" },
      { address: "ahmad.9", work: "ahmad", label: "Ахмад 9", href: "/hadith/ahmad/9" },
    ];
    const links = [
      { a: "bukhari.1", b: "kafi.1.2.3", share: 0.6, checked: true },
      { a: "kafi.1.2.3", b: "ahmad.9", share: 0.3, checked: false },
      { a: "ahmad.9", b: "abu_dawud.7", share: 0.9, checked: false },
    ];
    const graph = similarGraph("bukhari.1", texts, links);
    expect(graph.nodes.map((n) => [n.id, n.kind, n.size, n.href])).toEqual([
      ["bukhari.1", "center", 14, undefined],
      ["kafi.1.2.3", "kafi", 8, "/hadith/kafi/1.2.3"],
      ["ahmad.9", "musnad", 5, "/hadith/ahmad/9"],
    ]);
    expect(graph.edges.map((e) => [e.source, e.target, e.kind])).toEqual([
      ["bukhari.1", "kafi.1.2.3", "checked"],
      ["kafi.1.2.3", "ahmad.9", "similar"],
    ]);
    expect(graph.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });

  it("puts unknown collections in the group of other books", () => {
    expect(similarKind("masahif_ibn_abi_dawud")).toBe("other");
  });
});
