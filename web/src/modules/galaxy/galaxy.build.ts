// The galaxy of the library from the rows the server reads: stars (works,
// suras, books of the hadith collections, topics) and the lines between them.
// Pure functions; the database part is in server/galaxy.queries.ts.
import { layoutGraph } from "@/shared/graph/graph-layout";
import type { GraphEdge, GraphNode } from "@/shared/graph/graph.types";
import type { Galaxy, GalaxyItem } from "./galaxy.types";

// A star before it is placed: what it is and how many texts it holds.
export type Star = GalaxyItem & { texts: number };

// A line between two stars: "part" (a sura in the Quran, a book in its
// collection) or a link the data holds, with how many texts make it up.
export type Line = { source: string; target: string; kind: string; count: number };

// Size on screen: whole works are hubs; parts and topics grow slowly with
// the number of their texts.
export function starSize(star: Star): number {
  if (star.work) return star.kind === "quran" ? 16 : 12;
  if (star.kind === "topic") return 6;
  return Math.min(10, 3 + 1.6 * Math.log10(star.texts + 1));
}

export function buildGalaxy(stars: Star[], lines: Line[]): Galaxy {
  const ids = new Set(stars.map((s) => s.id));
  const kept = lines.filter((l) => l.source !== l.target && ids.has(l.source) && ids.has(l.target));
  // The strongest tie of each kind gets the widest line.
  const most = new Map<string, number>();
  for (const l of kept) most.set(l.kind, Math.max(most.get(l.kind) ?? 0, l.count));
  const edges: GraphEdge[] = kept.map((l) => ({
    source: l.source,
    target: l.target,
    kind: l.kind,
    weight: l.kind === "part" ? 0.1 : Math.log(l.count + 1) / Math.log((most.get(l.kind) ?? 1) + 1),
  }));
  const positions = layoutGraph(
    stars.map((s) => ({ id: s.id, mass: s.work ? 6 : 1 })),
    edges,
    300,
  );
  const nodes: GraphNode[] = stars.map((s) => {
    const [x, y] = positions[s.id] ?? [0, 0];
    return { id: s.id, label: s.label, x, y, kind: s.kind, size: starSize(s), href: s.href };
  });
  const items: GalaxyItem[] = stars.map(({ id, kind, label, href, hint, work }) => ({ id, kind, label, href, hint, work }));
  return { graph: { nodes, edges }, items };
}
