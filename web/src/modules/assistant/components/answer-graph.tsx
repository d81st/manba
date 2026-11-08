import { GraphView, type GraphPalette } from "@/shared/graph/graph-view";
import type { GraphData, GraphNode } from "@/shared/graph/graph.types";
import type { AssistantResult } from "../assistant.types";

// A graph of what was found: the words of the question (left), the terms and
// topics (middle), the fragments (right); lines — what was found by a word,
// and which fragments a term or a topic cites. Every node opens its page.
const COLUMN_X = [0, 320, 640];
const ROW = 34;

const PALETTE: GraphPalette = {
  nodes: { word: "--primary", term: "--graph-3", topic: "--graph-2", quran: "--graph-1", hadith: "--graph-4" },
  edges: { link: "--muted-foreground" },
};

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function answerGraphData(result: AssistantResult, maxSources = 14): GraphData {
  const words = result.concepts.map((c, i) => ({ id: `c${i}`, label: c.label, kind: "word", labelSide: "left" as const }));
  const middle = result.pages
    .filter((p) => p.kind === "term" || p.kind === "topic")
    .slice(0, 12)
    .map((p) => ({ id: `${p.kind}:${p.href.split("/").pop()}`, label: clip(p.title, 30), kind: p.kind, href: p.href }));
  const sources = [...result.quran, ...result.hadith].slice(0, maxSources);
  const right = sources.map((s) => ({
    id: s.address,
    label: clip(`${s.label} · ${s.title}`, 30),
    kind: s.address.startsWith("quran.") ? "quran" : "hadith",
    href: s.href,
  }));

  const columns = [words, middle, right];
  const rows = Math.max(...columns.map((c) => c.length), 1);
  const nodes: GraphNode[] = columns.flatMap((column, col) => {
    const offset = ((rows - column.length) * ROW) / 2;
    return column.map((n, i) => ({ ...n, x: COLUMN_X[col], y: offset + i * ROW }));
  });

  const ids = new Set(nodes.map((n) => n.id));
  const edges: GraphData["edges"] = [];
  for (const p of result.pages) {
    const id = `${p.kind}:${p.href.split("/").pop()}`;
    if (ids.has(id)) for (const i of p.concepts) edges.push({ source: `c${i}`, target: id, kind: "link" });
  }
  for (const s of sources) for (const i of s.concepts) edges.push({ source: `c${i}`, target: s.address, kind: "link" });
  for (const e of result.edges) if (ids.has(e.from) && ids.has(e.to)) edges.push({ source: e.from, target: e.to, kind: "link" });
  return { nodes, edges };
}

export function AnswerGraph({ result, label }: { result: AssistantResult; label: string }) {
  return (
    <GraphView
      data={answerGraphData(result)}
      palette={PALETTE}
      labels="all"
      className="h-[min(70vh,560px)]"
      ariaLabel={label}
    />
  );
}
