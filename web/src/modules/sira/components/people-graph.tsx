"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GraphView, type GraphPalette } from "@/shared/graph/graph-view";
import type { GraphData } from "@/shared/graph/graph.types";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import type { Messages } from "@/shared/i18n";
import type { CoMention } from "../sira.graph";

type Person = {
  slug: string;
  name: string;
  nameAr: string;
  draft: boolean;
  card: string | null;
  mentions: number | null;
};
type Relation = { a: string; b: string; kind: string; quote: string; note: string; href: string; ref: string; draft: boolean };
type Strings = Messages["sira"]["peoplePage"] & { relationKinds: Messages["sira"]["relationKinds"]; draft: string };

// Relations stated by the sources in the main color, "mentioned together" in a
// paler one (shown on request or for the chosen person).
const PALETTE: GraphPalette = {
  nodes: { person: "--primary" },
  edges: { relation: "--primary", together: "--muted-foreground" },
};

// The graph of people: relations stated by the sources and "mentioned
// together"; a click shows a person's relations with the quoted words.
export function PeopleGraph({
  positions,
  people,
  relations,
  pairs,
  t,
}: {
  positions: Record<string, [number, number]>;
  people: Person[];
  relations: Relation[];
  pairs: CoMention[];
  t: Strings;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [together, setTogether] = useState(false);
  const byslug = new Map(people.map((p) => [p.slug, p]));
  const data = useMemo<GraphData>(() => {
    const top = Math.max(1, ...pairs.map((p) => p.count));
    return {
      nodes: people
        .filter((p) => positions[p.slug])
        .map((p) => ({
          id: p.slug,
          label: p.name.split(",")[0],
          x: positions[p.slug][0],
          y: positions[p.slug][1],
          kind: "person",
          muted: p.draft,
        })),
      edges: [
        ...relations.map((r) => ({ source: r.a, target: r.b, kind: "relation", weight: 0.6 })),
        ...pairs.map((p) => ({ source: p.a, target: p.b, kind: "together", weight: (0.8 * p.count) / top })),
      ],
    };
  }, [people, relations, pairs, positions]);
  const person = selected ? byslug.get(selected) : null;
  const own = selected ? relations.filter((r) => r.a === selected || r.b === selected) : [];
  const near = selected ? pairs.filter((p) => p.a === selected || p.b === selected).slice(0, 10) : [];
  const kindLabel = (r: Relation) => {
    const labels = t.relationKinds[r.kind as keyof typeof t.relationKinds] ?? [r.kind, r.kind];
    // Who the other person is to the selected one.
    return r.a === selected ? labels[1] : labels[0];
  };

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Checkbox id="together" checked={together} onCheckedChange={(v) => setTogether(v === true)} />
          <Label htmlFor="together" className="font-normal">
            {t.showTogether}
          </Label>
        </div>
        <GraphView
          data={data}
          palette={PALETTE}
          selected={selected}
          onSelect={(id) => setSelected(id === selected ? null : id)}
          labels="all"
          hideEdge={(e) => e.kind === "together" && !together && !(selected && (e.source === selected || e.target === selected))}
          filterKey={`${together}-${selected}`}
          className="h-[min(70vh,640px)]"
          ariaLabel={t.title}
        />
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-primary" /> {t.legendRelation}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-muted-foreground opacity-60" /> {t.legendTogether}
          </span>
        </p>
        <nav aria-label={t.listLabel} className="mt-3 flex flex-wrap gap-1.5 text-sm">
          {people.map((p) => (
            <button
              key={p.slug}
              type="button"
              aria-pressed={p.slug === selected}
              onClick={() => setSelected(p.slug === selected ? null : p.slug)}
              className={
                p.slug === selected
                  ? "rounded-full border border-primary bg-primary px-2.5 py-0.5 text-primary-foreground"
                  : "rounded-full border px-2.5 py-0.5 hover:bg-accent"
              }
            >
              {p.name.split(",")[0]}
            </button>
          ))}
        </nav>
      </div>
      <aside className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
        {!person ? (
          <p className="text-sm text-muted-foreground">{t.pick}</p>
        ) : (
          <>
            <h2 className="font-semibold">{person.name}</h2>
            <p className="ar text-lg" lang="ar" dir="rtl">
              {person.nameAr}
            </p>
            {person.card && (
              <p className="mt-1 text-sm">
                <Link href={person.card}>{person.card.replace("/topics/", "")}</Link>
              </p>
            )}
            {person.mentions !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.mentions}: {person.mentions}
              </p>
            )}
            <h3 className="mt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.relations}</h3>
            {own.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">{t.none}</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {own.map((r, i) => {
                  const other = byslug.get(r.a === selected ? r.b : r.a);
                  return (
                    <li key={i} className="text-sm">
                      <button type="button" className="text-start font-medium text-primary" onClick={() => setSelected(other?.slug ?? null)}>
                        {kindLabel(r)}: {other?.name}
                      </button>
                      {r.draft && <span className="ms-1 text-xs text-muted-foreground">({t.draft})</span>}
                      <p className="ar mt-1 text-base leading-relaxed" lang="ar" dir="rtl">
                        {r.quote}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Link href={r.href}>{r.ref}</Link>
                        {r.note ? ` · ${r.note}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            {near.length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.together}</h3>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {near.map((p) => {
                    const other = byslug.get(p.a === selected ? p.b : p.a);
                    return (
                      <li key={`${p.a}-${p.b}`} className="flex justify-between gap-2">
                        <button type="button" className="text-start text-primary" onClick={() => setSelected(other?.slug ?? null)}>
                          {other?.name.split(",")[0]}
                        </button>
                        <span className="tabular-nums text-muted-foreground">{p.count}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">{t.togetherHint}</p>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
