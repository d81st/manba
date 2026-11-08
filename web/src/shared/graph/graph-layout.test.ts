import { describe, expect, it } from "vitest";
import { layoutGraph } from "./graph-layout";

// Fictional nodes: a small test graph only.
const nodes = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
const edges = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
  { source: "d", target: "e" },
];

describe("layoutGraph", () => {
  it("places every node at a finite point, the same way each time", () => {
    const first = layoutGraph(nodes, edges);
    expect(Object.keys(first).sort()).toEqual(["a", "b", "c", "d", "e"]);
    for (const [x, y] of Object.values(first)) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
    expect(layoutGraph(nodes, edges)).toEqual(first);
  });

  it("keeps linked nodes closer than unlinked ones", () => {
    const at = layoutGraph(nodes, edges);
    const dist = (p: string, q: string) => Math.hypot(at[p][0] - at[q][0], at[p][1] - at[q][1]);
    expect(dist("a", "b")).toBeLessThan(dist("a", "e"));
  });
});
