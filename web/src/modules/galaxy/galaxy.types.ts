import type { GraphData } from "@/shared/graph/graph.types";

// Kinds of stars in the galaxy: what a node is, nothing more.
export type GalaxyKind = "quran" | "hadith" | "books" | "external" | "topic";

// One star: a work, a sura, a book of a hadith collection or a topic.
export type GalaxyItem = {
  id: string;
  kind: GalaxyKind;
  label: string;
  href: string;
  hint: string; // what it is in a few words: "Книга 3 · كتاب الزكاة · 112 текстов"
  work: boolean; // a whole work (a hub) rather than its part
};

export type Galaxy = { graph: GraphData; items: GalaxyItem[] };
