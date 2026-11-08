// The graph of similar texts around one hadith: the texts that share its
// wording, then the texts that share theirs. Pure functions; the database part
// is in server/similar-graph.queries.ts.
import { layoutGraph } from "@/shared/graph/graph-layout";
import type { GraphData, GraphNode } from "@/shared/graph/graph.types";
import { SIMILAR_FIRST, SIMILAR_TOTAL, type SimilarKind } from "./hadith.constants";

const GROUP: Record<string, SimilarKind> = {
  bukhari: "sahih",
  muslim: "sahih",
  abu_dawud: "sunan",
  tirmidhi: "sunan",
  nasai: "sunan",
  ibn_majah: "sunan",
  ahmad: "musnad",
  kafi: "kafi",
};

export const similarKind = (work: string): SimilarKind => GROUP[work] ?? "other";

export type SimilarLink = { a: string; b: string; share: number; checked: boolean };
export type SimilarText = { address: string; work: string; label: string; href: string };

// The texts to show: the closest neighbours of the center, then the closest
// neighbours of those (by their best share), up to the total.
export function pickSimilar(
  center: string,
  first: { other: string; share: number }[],
  second: { other: string; share: number }[],
  limits = { first: SIMILAR_FIRST, total: SIMILAR_TOTAL },
): string[] {
  const chosen = new Set([center]);
  const byShare = (rows: { other: string; share: number }[]) => [...rows].sort((x, y) => y.share - x.share);
  for (const row of byShare(first)) {
    if (chosen.size > limits.first) break;
    chosen.add(row.other);
  }
  for (const row of byShare(second)) {
    if (chosen.size >= limits.total) break;
    chosen.add(row.other);
  }
  return [...chosen];
}

// Nodes and lines: the center is larger, the texts it shares wording with are
// a little larger than the texts further away. A line's width is its share;
// pairs a person confirmed as the same hadith have their own color.
export function similarGraph(center: string, texts: SimilarText[], links: SimilarLink[]): GraphData {
  const near = new Set(links.flatMap((l) => (l.a === center ? [l.b] : l.b === center ? [l.a] : [])));
  const ids = new Set(texts.map((t) => t.address));
  const edges = links
    .filter((l) => ids.has(l.a) && ids.has(l.b))
    .map((l) => ({ source: l.a, target: l.b, kind: l.checked ? "checked" : "similar", weight: l.share }));
  const positions = layoutGraph(
    texts.map((t) => ({ id: t.address, mass: t.address === center ? 4 : 1 })),
    edges,
  );
  const nodes: GraphNode[] = texts.map((t) => {
    const [x, y] = positions[t.address] ?? [0, 0];
    const isCenter = t.address === center;
    return {
      id: t.address,
      label: t.label,
      x,
      y,
      kind: isCenter ? "center" : similarKind(t.work),
      size: isCenter ? 14 : near.has(t.address) ? 8 : 5,
      href: isCenter ? undefined : t.href,
    };
  });
  return { nodes, edges };
}
