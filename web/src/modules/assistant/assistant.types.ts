import type { Analysis } from "./assistant.analysis";
// One subject of the question: its words to search for in Arabic and in Russian.
export type Concept = { label: string; ar: string[]; ru: string[]; from: string[] };

export type SourceHit = {
  address: string;
  label: string; // "2:255", "аль-Бухари 1"
  title: string; // sura or collection
  href: string;
  text: string;
  translation: string | null;
  level: number | null; // authority: 1 — the Quran
  concepts: number[]; // indexes of the concepts it matches
};

export type PageHit = { kind: "term" | "topic" | "history" | "sira" | "quiz"; title: string; href: string; hint: string; concepts: number[] };

export type GraphEdge = { from: string; to: string };

export type AssistantResult = {
  analysis: Analysis;
  concepts: Concept[];
  quran: SourceHit[];
  hadith: SourceHit[];
  pages: PageHit[];
  edges: GraphEdge[]; // between pages (term:slug, topic:slug) and sources (address)
};

export type Synonym = { id: number; phrase: string; forms: string[]; note: string };
