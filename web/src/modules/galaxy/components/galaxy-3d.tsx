"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ForceGraph3DInstance } from "3d-force-graph";
import { mix, readColors, type GraphColors, type GraphPalette } from "@/shared/graph/graph-colors";
import type { GraphData } from "@/shared/graph/graph.types";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

const t = getMessages().galaxy;

type Star = { id: string; label: string; kind: string; size: number; x?: number; y?: number; z?: number };
type Ray = { source: string | Star; target: string | Star; kind: string };

const idOf = (end: string | Star) => (typeof end === "string" ? end : end.id);

// The same galaxy in three dimensions (3d-force-graph on three.js). The layout
// is computed before the first frame and then stays still, so the picture
// does not drift; the person turns it, zooms and chooses a star (onSelect).
// three.js is loaded only when this view is opened.
export function Galaxy3D({
  data,
  palette,
  selected,
  onSelect,
  className,
}: {
  data: GraphData;
  palette: GraphPalette;
  selected: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);
  const colorsRef = useRef<GraphColors | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [hovered, setHovered] = useState<string | null>(null);
  const [theme, setTheme] = useState(0);
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  });

  // Who is next to whom, for keeping the focused star and its neighbours bright.
  const neighbours = useRef(new Map<string, Set<string>>());
  useEffect(() => {
    const map = new Map<string, Set<string>>();
    for (const e of data.edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    neighbours.current = map;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    let graph: ForceGraph3DInstance | null = null;
    let observer: ResizeObserver | null = null;
    const element = container.current;
    (async () => {
      if (!element) return;
      if (!hasWebGL()) return setState("failed");
      const { default: ForceGraph3D } = await import("3d-force-graph");
      if (cancelled) return;
      const colors = readColors(element, palette);
      colorsRef.current = colors;
      // The library adds coordinates to the objects it gets: give it copies.
      const nodes: Star[] = data.nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind, size: n.size ?? 6 }));
      const links: Ray[] = data.edges.map((e) => ({ source: e.source, target: e.target, kind: e.kind }));
      graph = new ForceGraph3D(element, { controlType: "orbit" })
        .width(element.clientWidth)
        .height(element.clientHeight)
        .backgroundColor(colors.card)
        .showNavInfo(false)
        .enableNodeDrag(false)
        .nodeRelSize(0.9)
        .nodeVal((n) => (n as Star).size ** 3)
        .nodeOpacity(0.95)
        .nodeLabel((n) => labelElement((n as Star).label, colors))
        .linkWidth(0)
        .linkOpacity(0.45)
        .warmupTicks(160)
        .cooldownTicks(0)
        .onEngineStop(() => graph?.zoomToFit(600, 20))
        .onNodeClick((n) => select.current(String(n.id)))
        .onNodeHover((n) => {
          setHovered(n ? String(n.id) : null);
          element.style.cursor = n ? "pointer" : "";
        })
        .onBackgroundClick(() => select.current(null));
      // Stars push each other away only nearby, so works with no lines stay
      // close instead of drifting off; parts sit close to their work.
      const charge = graph.d3Force("charge") as unknown as { strength(v: number): unknown; distanceMax(v: number): unknown } | undefined;
      charge?.strength(-45);
      charge?.distanceMax(160);
      const pull = graph.d3Force("link") as unknown as { distance(f: (l: Ray) => number): unknown } | undefined;
      pull?.distance((l) => (l.kind === "part" ? 18 : 45));
      graph.graphData({ nodes, links });
      graphRef.current = graph;
      observer = new ResizeObserver(() => graph?.width(element.clientWidth).height(element.clientHeight));
      observer.observe(element);
      setState("ready");
    })().catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
      observer?.disconnect();
      graph?._destructor();
      graphRef.current = null;
      element?.replaceChildren();
    };
  }, [data, palette]);

  // Colors: the focused star (hovered, else chosen) and its neighbours stay
  // bright, the rest fade; re-read when the system theme changes.
  const focus = hovered ?? selected;
  useEffect(() => {
    const graph = graphRef.current;
    const colors = colorsRef.current;
    if (state !== "ready" || !graph || !colors) return;
    const near = focus ? new Set([focus, ...(neighbours.current.get(focus) ?? [])]) : null;
    graph
      .nodeColor((n) => {
        const base = colors.nodes[(n as Star).kind] ?? colors.faded;
        return near && !near.has(String(n.id)) ? mix(base, colors.card, 0.8) : base;
      })
      .linkColor((l) => {
        const link = l as Ray;
        const base = colors.edges[link.kind] ?? colors.faded;
        const touches = !focus || idOf(link.source) === focus || idOf(link.target) === focus;
        return touches ? base : mix(base, colors.card, 0.85);
      });
  }, [focus, state, theme]);

  // Fly to a star chosen in the list or the search.
  useEffect(() => {
    const graph = graphRef.current;
    if (state !== "ready" || !graph || !selected) return;
    const star = (graph.graphData().nodes as Star[]).find((n) => n.id === selected);
    if (!star || star.x === undefined) return;
    const { x = 0, y = 0, z = 0 } = star;
    const ratio = 1 + 90 / Math.max(1, Math.hypot(x, y, z));
    graph.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 900);
  }, [selected, state]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const element = container.current;
      const graph = graphRef.current;
      if (!element || !graph) return;
      const colors = readColors(element, palette);
      colorsRef.current = colors;
      graph.backgroundColor(colors.card);
      setTheme((n) => n + 1);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [palette]);

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-card ${className ?? ""}`}>
      <div ref={container} className="absolute inset-0" role="img" aria-label={t.graphLabel} />
      {state === "ready" && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="absolute end-2 top-2 size-8"
          aria-label={getMessages().graph.reset}
          title={getMessages().graph.reset}
          onClick={() => graphRef.current?.zoomToFit(600, 20)}
        >
          <RotateCcw />
        </Button>
      )}
      {state === "loading" && <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{t.loading}</p>}
      {state === "failed" && <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">{t.no3d}</p>}
    </div>
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// The tooltip of a star: plain text (never HTML from the data).
function labelElement(text: string, colors: GraphColors) {
  const div = document.createElement("div");
  div.textContent = text;
  Object.assign(div.style, {
    background: colors.card,
    color: colors.label,
    padding: "2px 6px",
    borderRadius: "6px",
    font: "13px system-ui, sans-serif",
  });
  return div;
}
