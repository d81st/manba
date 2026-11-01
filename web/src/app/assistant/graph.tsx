import type { AssistantResult } from "@/lib/assistant";

// A 2D graph of what was found: the words of the question (left), the terms
// and topics (middle), the fragments (right); lines — what was found by a
// word, and which fragments a term or a topic cites. Drawn on the server as
// SVG, every node a link.
const WIDTH = 900;
const ROW = 34;
const COL = [20, 330, 640];
const NODE_W = [210, 240, 240];

type Node = { id: string; label: string; href?: string; col: 0 | 1 | 2 };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function AssistantGraph({ result, maxSources = 14 }: { result: AssistantResult; maxSources?: number }) {
  const words: Node[] = result.concepts.map((c, i) => ({ id: `c${i}`, label: c.label, col: 0 }));
  const middle: Node[] = result.pages
    .filter((p) => p.kind === "term" || p.kind === "topic")
    .slice(0, 12)
    .map((p) => ({ id: `${p.kind}:${p.href.split("/").pop()}`, label: p.title, href: p.href, col: 1 }));
  const sources = [...result.quran, ...result.hadith].slice(0, maxSources);
  const right: Node[] = sources.map((s) => ({ id: s.address, label: `${s.label} · ${s.title}`, href: s.href, col: 2 }));
  const lines: [string, string][] = [];
  for (const p of result.pages) {
    const id = `${p.kind}:${p.href.split("/").pop()}`;
    if (middle.some((m) => m.id === id)) for (const i of p.concepts) lines.push([`c${i}`, id]);
  }
  for (const s of sources) for (const i of s.concepts) lines.push([`c${i}`, s.address]);
  for (const e of result.edges) if (middle.some((m) => m.id === e.from) && right.some((r) => r.id === e.to)) lines.push([e.from, e.to]);

  const columns = [words, middle, right];
  const rows = Math.max(...columns.map((c) => c.length), 1);
  const height = rows * ROW + 20;
  const pos = new Map<string, { x: number; y: number; col: number }>();
  columns.forEach((nodes, col) => {
    const offset = ((rows - nodes.length) * ROW) / 2;
    nodes.forEach((n, i) => pos.set(n.id, { x: COL[col], y: 10 + offset + i * ROW, col }));
  });

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-auto w-full min-w-[640px]" role="img" aria-label="Граф связей">
      {lines.map(([a, b], i) => {
        const p = pos.get(a);
        const q = pos.get(b);
        if (!p || !q) return null;
        const x1 = p.x + NODE_W[p.col];
        const y1 = p.y + 13;
        const x2 = q.x;
        const y2 = q.y + 13;
        const mid = (x1 + x2) / 2;
        return <path key={i} d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`} className="fill-none stroke-border" strokeWidth={1.5} />;
      })}
      {columns.flat().map((n) => {
        const p = pos.get(n.id)!;
        const box = (
          <g>
            <rect
              x={p.x}
              y={p.y}
              width={NODE_W[n.col]}
              height={26}
              rx={13}
              className={n.col === 0 ? "fill-primary" : n.col === 1 ? "fill-accent stroke-border" : "fill-card stroke-border"}
            />
            <text
              x={p.x + 12}
              y={p.y + 17}
              className={n.col === 0 ? "fill-primary-foreground text-[13px]" : "fill-foreground text-[13px]"}
            >
              {clip(n.label, n.col === 0 ? 26 : 30)}
            </text>
          </g>
        );
        return n.href ? (
          <a key={n.id} href={n.href}>
            {box}
          </a>
        ) : (
          <g key={n.id}>{box}</g>
        );
      })}
    </svg>
  );
}
