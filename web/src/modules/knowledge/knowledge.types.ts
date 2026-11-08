import type { GraphData } from "@/shared/graph/graph.types";

// The kinds of nodes on the knowledge map.
export type KnowledgeKind = "section" | "topic" | "term" | "parallel";

// What the card of a chosen node shows: its page and a short line from the site
// itself (a topic's question, a term's short explanation), never a quote.
export type KnowledgeItem = { id: string; kind: KnowledgeKind; label: string; href: string; hint: string };

export type KnowledgeMap = { graph: GraphData; items: KnowledgeItem[] };
