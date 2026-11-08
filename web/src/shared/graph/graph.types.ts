// A graph for GraphView: nodes with fixed positions (laid out on the server, so
// the picture does not jump) and edges between them. Every node of the site's
// graphs leads to a page with the full context; the graph shows no quotes.

// The kind of a node or an edge picks its color (graph-colors.ts).
export type GraphNode = {
  id: string;
  label: string;
  x: number;
  y: number; // downwards, as on the screen
  kind: string;
  size?: number;
  href?: string;
  muted?: boolean; // a draft or a secondary item: drawn paler
  labelSide?: "left" | "right"; // "left" for nodes at the left edge of a column layout
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: string;
  weight?: number; // 0..1, the thickness of the line
};

export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };
