"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type Graph from "graphology";
import type Sigma from "sigma";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/utils";
import { tokenColor } from "./graph-colors";
import type { GraphData } from "./graph.types";

const t = getMessages().graph;

// Theme tokens (globals.css) for the kinds of nodes and edges of one graph.
export type GraphPalette = { nodes: Record<string, string>; edges: Record<string, string> };

type Colors = { nodes: Record<string, string>; edges: Record<string, string>; faded: string; label: string; card: string };

// A graph drawn with sigma (WebGL): zoom with the buttons, ctrl/⌘ + wheel or
// two fingers; hovering or choosing a node keeps it and its neighbours bright.
// A click chooses the node (onSelect) or, without onSelect, opens its page.
// sigma is loaded only on pages that show a graph, and only in the browser.
export function GraphView({
  data,
  palette,
  selected = null,
  onSelect,
  labels = "auto",
  hideEdge,
  filterKey = "",
  className,
  ariaLabel,
}: {
  data: GraphData;
  palette: GraphPalette;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  labels?: "all" | "auto";
  // Edges to hide for now (e.g. a kind turned off); filterKey changes when the rule does.
  hideEdge?: (edge: { kind: string; source: string; target: string }) => boolean;
  filterKey?: string;
  className?: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const colorsRef = useRef<Colors | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // The latest handlers, so sigma's listeners never call stale ones.
  const handlers = useRef({ onSelect, hideEdge, open: (href: string) => router.push(href) });
  useEffect(() => {
    handlers.current = { onSelect, hideEdge, open: (href: string) => router.push(href) };
  });

  // Build the graph and the renderer once per data set.
  useEffect(() => {
    let cancelled = false;
    let renderer: Sigma | null = null;
    (async () => {
      const [{ default: GraphClass }, { default: SigmaClass }, { DEFAULT_STYLES }] = await Promise.all([
        import("graphology"),
        import("sigma"),
        import("sigma/types"),
      ]);
      const element = container.current;
      if (cancelled || !element) return;
      const colors = readColors(element, palette);
      colorsRef.current = colors;
      const graph = new GraphClass({ type: "undirected", multi: false });
      for (const node of data.nodes) {
        graph.addNode(node.id, {
          x: node.x,
          y: -node.y, // sigma's y axis points up
          size: node.size ?? 8,
          baseSize: node.size ?? 8,
          label: node.label,
          kind: node.kind,
          href: node.href,
          muted: node.muted ?? false,
          labelSide: node.labelSide ?? "right",
          color: colors.nodes[node.kind] ?? colors.faded,
        });
      }
      for (const edge of data.edges) {
        if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target) || edge.source === edge.target) continue;
        graph.mergeEdge(edge.source, edge.target, {
          kind: edge.kind,
          size: 0.6 + 2.4 * (edge.weight ?? 0.5),
          color: colors.edges[edge.kind] ?? colors.faded,
        });
      }
      renderer = new SigmaClass(graph, element, {
        settings: {
          gestureTarget: "shared",
          sharedGestureWheelMessage: t.wheel,
          sharedGestureAppleWheelMessage: t.appleWheel,
          sharedGestureTouchMessage: t.touch,
          enableNodeDrag: false,
          labelRenderedSizeThreshold: labels === "all" ? 0 : 6,
          // Room for labels at the edges; less on a phone.
          stagePadding: element.clientWidth < 600 ? 28 : 90,
          // Node sizes in screen pixels, whatever the scale of the layout.
          itemSizesReference: "screen",
        },
        styles: {
          nodes: [
            DEFAULT_STYLES.nodes,
            {
              labelColor: colors.label,
              labelSize: 13,
              labelFont: "system-ui, sans-serif",
              backdropColor: colors.card,
              labelVisibility: labels === "all" ? "visible" : { whenState: "isHovered", then: "visible", else: "auto" },
              labelPosition: (attrs) => (attrs.labelSide === "left" ? "left" : "right"),
              cursor: "pointer",
            },
          ],
          edges: DEFAULT_STYLES.edges,
        },
      });
      renderer.on("enterNode", ({ node }) => setHovered(node));
      renderer.on("leaveNode", () => setHovered(null));
      renderer.on("clickNode", ({ node }) => {
        const { onSelect: select, open } = handlers.current;
        if (select) select(node);
        else {
          const href = graph.getNodeAttribute(node, "href") as string | undefined;
          if (href) open(href);
        }
      });
      renderer.on("clickStage", () => handlers.current.onSelect?.(null));
      sigmaRef.current = renderer;
      graphRef.current = graph;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      renderer?.kill();
      sigmaRef.current = null;
      graphRef.current = null;
      setReady(false);
    };
  }, [data, palette, labels]);

  // Keep the focused node (hovered, else selected) and its neighbours bright.
  const focus = hovered ?? selected;
  useEffect(() => {
    const graph = graphRef.current;
    const colors = colorsRef.current;
    if (!ready || !graph || !colors) return;
    const near = new Set<string>();
    if (focus && graph.hasNode(focus)) {
      near.add(focus);
      graph.forEachNeighbor(focus, (n) => near.add(n));
    }
    graph.updateEachNodeAttributes((node, attrs) => {
      const base = colors.nodes[attrs.kind as string] ?? colors.faded;
      // Away from the focus: much paler; a draft: a little paler.
      const color = near.size > 0 && !near.has(node) ? mix(base, colors.card, 0.8) : attrs.muted ? mix(base, colors.card, 0.35) : base;
      const baseSize = attrs.baseSize as number;
      return { ...attrs, color, size: node === selected ? baseSize + 4 : baseSize };
    });
    graph.updateEachEdgeAttributes((edge, attrs, source, target) => {
      const base = colors.edges[attrs.kind as string] ?? colors.faded;
      const touches = near.size === 0 || (near.has(source) && near.has(target) && (source === focus || target === focus));
      return { ...attrs, color: touches ? base : mix(base, colors.card, 0.85) };
    });
    const hide = handlers.current.hideEdge;
    graph.forEachEdge((edge, attrs, source, target) => {
      sigmaRef.current?.setEdgeState(edge, { isHidden: hide ? hide({ kind: attrs.kind as string, source, target }) : false });
    });
  }, [focus, selected, ready, filterKey]);

  // Re-read the theme colors when the system switches between light and dark.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const element = container.current;
      const graph = graphRef.current;
      if (!element || !graph) return;
      const colors = readColors(element, palette);
      colorsRef.current = colors;
      sigmaRef.current?.setSettings({});
      graph.updateEachNodeAttributes((_, attrs) => ({ ...attrs, color: colors.nodes[attrs.kind as string] ?? colors.faded }));
      graph.updateEachEdgeAttributes((_, attrs) => ({ ...attrs, color: colors.edges[attrs.kind as string] ?? colors.faded }));
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [palette]);

  const camera = () => sigmaRef.current?.getCamera();
  return (
    <div className={cn("relative rounded-xl border bg-card", className)}>
      <div ref={container} className="h-full w-full" role="img" aria-label={ariaLabel} />
      <div className="absolute end-2 top-2 flex flex-col gap-1">
        <Button type="button" size="icon" variant="outline" className="size-8" aria-label={t.zoomIn} title={t.zoomIn} onClick={() => camera()?.zoomIn()}>
          <Plus />
        </Button>
        <Button type="button" size="icon" variant="outline" className="size-8" aria-label={t.zoomOut} title={t.zoomOut} onClick={() => camera()?.zoomOut()}>
          <Minus />
        </Button>
        <Button type="button" size="icon" variant="outline" className="size-8" aria-label={t.reset} title={t.reset} onClick={() => camera()?.reset()}>
          <RotateCcw />
        </Button>
      </div>
      {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{t.loading}</p>}
    </div>
  );
}

function readColors(element: Element, palette: GraphPalette): Colors {
  const map = (tokens: Record<string, string>) =>
    Object.fromEntries(Object.entries(tokens).map(([kind, token]) => [kind, tokenColor(element, token)]));
  return {
    nodes: map(palette.nodes),
    edges: map(palette.edges),
    faded: tokenColor(element, "--muted-foreground"),
    label: tokenColor(element, "--foreground"),
    card: tokenColor(element, "--card"),
  };
}

// A color moved towards the background: how faded items look.
function mix(color: string, background: string, amount = 0.75) {
  const parse = (c: string) => (c.match(/\d+/g) ?? ["136", "136", "136"]).slice(0, 3).map(Number);
  const [a, b] = [parse(color), parse(background)];
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}
