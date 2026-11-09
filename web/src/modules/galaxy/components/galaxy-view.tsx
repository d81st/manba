"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { GraphPalette } from "@/shared/graph/graph-colors";
import { GraphView } from "@/shared/graph/graph-view";
import { getMessages } from "@/shared/i18n";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/ui/utils";
import { GALAXY_KINDS, MIN_SHARED_TEXTS } from "../galaxy.constants";
import type { Galaxy } from "../galaxy.types";
import { Galaxy3D } from "./galaxy-3d";
import { StarCard } from "./star-card";

const t = getMessages().galaxy;

// One color per kind of star; a line has the color of what makes it.
const PALETTE: GraphPalette = {
  nodes: { quran: "--primary", hadith: "--graph-1", books: "--graph-2", external: "--graph-4", topic: "--graph-3" },
  edges: { part: "--border", similar: "--graph-1", cites: "--graph-3", commentary: "--graph-2", parallel: "--graph-4" },
};
const LINES = ["part", "similar", "cites", "commentary", "parallel"] as const;

export type GalaxyMode = "2d" | "3d";

// The galaxy of the library in 2D (sigma) or 3D (three.js), with a search,
// the card of the chosen star and the same content as a list.
export function GalaxyView({ data, initialView }: { data: Galaxy; initialView: GalaxyMode }) {
  const [view, setView] = useState<GalaxyMode>(initialView);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(data.items.map((i) => [i.id, i])), [data.items]);
  const found =
    query.trim().length > 1 ? data.items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8) : [];

  function choose(mode: GalaxyMode) {
    setView(mode);
    // Keep the choice in the address, so a link or a reload opens the same view.
    const url = new URL(window.location.href);
    if (mode === "3d") url.searchParams.set("view", "3d");
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", url);
  }

  const toggle = (id: string | null) => setSelected(id === selected ? null : id);
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={t.view} className="inline-flex rounded-lg border p-0.5">
          {(["2d", "3d"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => choose(mode)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                view === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {mode === "2d" ? t.view2d : t.view3d}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{view === "2d" ? t.hint2d : t.hint3d}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {view === "2d" ? (
            <GraphView
              data={data.graph}
              palette={PALETTE}
              selected={selected}
              onSelect={(id) => toggle(id)}
              className="h-[min(75vh,720px)]"
              ariaLabel={t.graphLabel}
            />
          ) : (
            <Galaxy3D data={data.graph} palette={PALETTE} selected={selected} onSelect={setSelected} className="h-[min(75vh,720px)]" />
          )}
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {GALAXY_KINDS.map((kind) => (
                <span key={kind} className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full" style={{ background: `var(${PALETTE.nodes[kind]})` }} />
                  {t.kinds[kind]}
                </span>
              ))}
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {LINES.map((kind) => (
                <span key={kind} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4" style={{ background: `var(${PALETTE.edges[kind]})` }} />
                  {t.lines[kind].replace("{min}", String(MIN_SHARED_TEXTS))}
                </span>
              ))}
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="ps-8"
            />
            {found.length > 0 && (
              <ul className="mt-1 rounded-lg border bg-popover p-1 text-sm shadow-sm">
                {found.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="w-full rounded px-2 py-1 text-start hover:bg-accent"
                      onClick={() => {
                        setSelected(f.id);
                        setQuery("");
                      }}
                    >
                      {f.label} <span className="text-xs text-muted-foreground">· {t.kinds[f.kind]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <StarCard selected={selected} byId={byId} edges={data.graph.edges} onSelect={setSelected} />
        </aside>
      </div>

      <details className="rounded-xl border bg-card p-4 text-card-foreground">
        <summary className="cursor-pointer font-medium">{t.asList}</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALAXY_KINDS.map((kind) => {
            const items = data.items.filter((i) => i.kind === kind && (i.work || kind === "topic"));
            if (items.length === 0) return null;
            return (
              <section key={kind}>
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.kinds[kind]}</h3>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {items.map((i) => (
                    <li key={i.id}>
                      <Link href={i.href}>{i.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </details>
    </div>
  );
}
