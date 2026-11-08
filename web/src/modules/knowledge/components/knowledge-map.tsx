"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GraphView, type GraphPalette } from "@/shared/graph/graph-view";
import { getMessages } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import type { KnowledgeItem, KnowledgeKind, KnowledgeMap as Data } from "../knowledge.types";

const t = getMessages().knowledge;

// One color per kind of node; the color says what a node is, nothing more.
const PALETTE: GraphPalette = {
  nodes: { section: "--primary", topic: "--graph-2", term: "--graph-3", parallel: "--graph-4" },
  edges: { section: "--border", link: "--muted-foreground" },
};
const KIND_TOKEN: Record<KnowledgeKind, string> = PALETTE.nodes as Record<KnowledgeKind, string>;
const KINDS: KnowledgeKind[] = ["section", "topic", "term", "parallel"];

// The knowledge map: the sections, topics, terms and links of the site as one
// graph. Choosing a node shows what it is, its neighbours and the way to its page.
export function KnowledgeMap({ data }: { data: Data }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(data.items.map((i) => [i.id, i])), [data.items]);
  const item = selected ? byId.get(selected) : undefined;
  const neighbours = useMemo(() => {
    if (!selected) return [];
    const ids = data.graph.edges.flatMap((e) => (e.source === selected ? [e.target] : e.target === selected ? [e.source] : []));
    return [...new Set(ids)].flatMap((id) => byId.get(id) ?? []).sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
  }, [selected, data.graph.edges, byId]);
  const found = query.trim().length > 1 ? data.items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8) : [];

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div>
          <GraphView
            data={data.graph}
            palette={PALETTE}
            selected={selected}
            onSelect={(id) => setSelected(id === selected ? null : id)}
            className="h-[min(72vh,680px)]"
            ariaLabel={t.graphLabel}
          />
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {KINDS.map((kind) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full" style={{ background: `var(${KIND_TOKEN[kind]})` }} />
                {t.kinds[kind]}
              </span>
            ))}
          </p>
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

          <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
            {!item ? (
              <p className="text-sm text-muted-foreground">{t.pick}</p>
            ) : (
              <>
                <Badge variant="outline">{t.kinds[item.kind]}</Badge>
                <h2 className="mt-2 font-semibold">{item.label}</h2>
                {item.hint && <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>}
                <Link href={item.href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                  {t.open}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
                {neighbours.length > 0 && (
                  <>
                    <h3 className="mt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.neighbours}</h3>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {neighbours.map((n) => (
                        <li key={n.id}>
                          <button type="button" className="text-start text-primary" onClick={() => setSelected(n.id)}>
                            {n.label}
                          </button>
                          <span className="text-xs text-muted-foreground"> · {t.kinds[n.kind]}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <details className="rounded-xl border bg-card p-4 text-card-foreground">
        <summary className="cursor-pointer font-medium">{t.asList}</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KINDS.map((kind) => (
            <ItemList key={kind} title={t.kinds[kind]} items={data.items.filter((i) => i.kind === kind)} />
          ))}
        </div>
      </details>
    </div>
  );
}

function ItemList({ title, items }: { title: string; items: KnowledgeItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="mt-1 space-y-0.5 text-sm">
        {items.map((i) => (
          <li key={i.id}>
            <Link href={i.href}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
