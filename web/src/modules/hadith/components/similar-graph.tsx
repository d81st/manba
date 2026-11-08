"use client";

import { Network } from "lucide-react";
import { useState } from "react";
import { GraphView, type GraphPalette } from "@/shared/graph/graph-view";
import type { GraphData } from "@/shared/graph/graph.types";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { SIMILAR_KINDS, SIMILAR_TOTAL } from "../hadith.constants";

const t = getMessages().hadith.similar;

// One color per group of collections; confirmed pairs in the main color.
const PALETTE: GraphPalette = {
  nodes: { center: "--primary", sahih: "--graph-1", sunan: "--graph-2", musnad: "--graph-3", kafi: "--graph-4", other: "--muted-foreground" },
  edges: { checked: "--primary", similar: "--muted-foreground" },
};

type State = { status: "closed" } | { status: "loading" } | { status: "error" } | { status: "open"; data: GraphData };

// "Show as a graph" under the list of similar texts: loads the texts that
// share wording with this hadith and with them, and draws them as a graph.
export function SimilarGraph({ address }: { address: string }) {
  const [state, setState] = useState<State>({ status: "closed" });
  const [cached, setCached] = useState<GraphData | null>(null);

  async function toggle() {
    if (state.status === "open" || state.status === "loading") return setState({ status: "closed" });
    if (cached) return setState({ status: "open", data: cached });
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/hadith/similar?a=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as GraphData;
      setCached(data);
      setState({ status: "open", data });
    } catch {
      setState({ status: "error" });
    }
  }

  const open = state.status === "open";
  const present = open ? new Set(state.data.nodes.map((n) => n.kind)) : new Set<string>();
  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="sm" onClick={toggle} aria-expanded={open}>
        <Network />
        {open ? t.graphHide : state.status === "loading" ? getMessages().hadith.loading : t.graphShow}
      </Button>
      {state.status === "error" && <p className="mt-1 text-xs text-destructive">{t.graphError}</p>}
      {open && (
        <div className="mt-2">
          <p className="mb-2 text-xs text-muted-foreground">{t.graphHint.replace("{count}", String(SIMILAR_TOTAL - 1))}</p>
          <GraphView data={state.data} palette={PALETTE} className="h-[min(65vh,520px)]" ariaLabel={t.graphLabel} />
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {(["center", ...SIMILAR_KINDS] as const)
              .filter((kind) => present.has(kind))
              .map((kind) => (
                <span key={kind} className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full" style={{ background: `var(${PALETTE.nodes[kind]})` }} />
                  {t.kinds[kind]}
                </span>
              ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4" style={{ background: "var(--primary)" }} />
              {t.legendChecked}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4" style={{ background: "var(--muted-foreground)" }} />
              {t.legendSimilar}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
