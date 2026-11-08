"use client";

import { Waypoints } from "lucide-react";
import { useState } from "react";
import { GraphView, type GraphPalette } from "@/shared/graph/graph-view";
import type { GraphData } from "@/shared/graph/graph.types";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

const t = getMessages().topics.schema;

// All sides in one color: the color says what a node is, not who is right.
const PALETTE: GraphPalette = {
  nodes: { topic: "--primary", quran: "--graph-1", hadith: "--graph-4", side: "--graph-2", position: "--graph-2", term: "--graph-3", related: "--muted-foreground" },
  edges: { main: "--muted-foreground", circumstances: "--border", basis: "--border", outer: "--border" },
};
const LEGEND: [string, string][] = [
  ["--graph-1", t.quran],
  ["--graph-4", t.hadith],
  ["--graph-2", t.sides],
  ["--graph-3", t.terms],
  ["--muted-foreground", t.related],
];

// The scheme of the topic, shown on request (sigma is loaded only then): the
// texts, the sides with their positions and what each position rests on.
export function TopicSchema({ data }: { data: GraphData }) {
  const [open, setOpen] = useState(false);
  if (data.nodes.length < 3) return null;
  return (
    <section aria-label={t.title}>
      <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Waypoints />
        {open ? t.hide : t.show}
      </Button>
      {open && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-muted-foreground">{t.hint}</p>
          <GraphView data={data} palette={PALETTE} className="h-[min(65vh,520px)]" ariaLabel={t.title} />
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {LEGEND.map(([token, label]) => (
              <span key={token} className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full" style={{ background: `var(${token})` }} />
                {label}
              </span>
            ))}
          </p>
        </div>
      )}
    </section>
  );
}
