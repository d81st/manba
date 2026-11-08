import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

// Positions for a graph, computed once on the server (ForceAtlas2): linked
// nodes pull together, the rest push apart. The start is a circle in the order
// given, so the same data always gives the same picture.
export function layoutGraph(
  nodes: { id: string; mass?: number }[],
  edges: { source: string; target: string; weight?: number }[],
  iterations = 500,
): Record<string, [number, number]> {
  const graph = new Graph({ type: "undirected", multi: false });
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, nodes.length);
    graph.addNode(node.id, { x: Math.cos(angle) * 100, y: Math.sin(angle) * 100, mass: node.mass ?? 1 });
  });
  for (const edge of edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target) || edge.source === edge.target) continue;
    graph.mergeEdge(edge.source, edge.target, { weight: edge.weight ?? 1 });
  }
  if (graph.order > 1) {
    forceAtlas2.assign(graph, {
      iterations,
      getEdgeWeight: "weight",
      settings: { ...forceAtlas2.inferSettings(graph), gravity: 1, scalingRatio: 8, adjustSizes: false },
    });
  }
  const out: Record<string, [number, number]> = {};
  graph.forEachNode((id, attrs) => {
    out[id] = [attrs.x as number, attrs.y as number];
  });
  return out;
}
