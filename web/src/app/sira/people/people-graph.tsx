"use client";

import Link from "next/link";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Messages } from "@/i18n";
import type { CoMention } from "@/lib/sira-graph";

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

// The graph of people: relations stated by the sources as solid lines,
// "mentioned together" as dashed ones; a click shows a person's relations
// with the quoted words.
export function PeopleGraph({
  size,
  positions,
  people,
  relations,
  pairs,
  t,
}: {
  size: { width: number; height: number };
  positions: Record<string, [number, number]>;
  people: Person[];
  relations: Relation[];
  pairs: CoMention[];
  t: Strings;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [together, setTogether] = useState(false);
  const byslug = new Map(people.map((p) => [p.slug, p]));
  const top = Math.max(1, ...pairs.map((p) => p.count));
  const touches = (e: { a: string; b: string }) => !selected || e.a === selected || e.b === selected;
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
        <div className="overflow-x-auto rounded-xl border bg-card">
          <svg viewBox={`0 0 ${size.width} ${size.height}`} className="block h-auto w-full min-w-[640px]" role="img" aria-label={t.title}>
            {pairs
              .filter((p) => together || (selected && (p.a === selected || p.b === selected)))
              .map((p) => {
                const [a, b] = [positions[p.a], positions[p.b]];
                if (!a || !b) return null;
                return (
                  <line
                    key={`${p.a}-${p.b}`}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    strokeDasharray="4 4"
                    strokeWidth={0.5 + (3 * p.count) / top}
                    className={`stroke-muted-foreground ${touches(p) ? "opacity-60" : "opacity-10"}`}
                  >
                    <title>{`${byslug.get(p.a)?.name} — ${byslug.get(p.b)?.name}: ${p.count} ${t.togetherHint}`}</title>
                  </line>
                );
              })}
            {relations.map((r, i) => {
              const [a, b] = [positions[r.a], positions[r.b]];
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  strokeWidth={2}
                  className={`stroke-primary ${touches(r) ? "opacity-90" : "opacity-15"}`}
                />
              );
            })}
            {people.map((p) => {
              const at = positions[p.slug];
              if (!at) return null;
              const active = p.slug === selected;
              return (
                <g
                  key={p.slug}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  onClick={() => setSelected(active ? null : p.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(active ? null : p.slug);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={at[0]}
                    cy={at[1]}
                    r={active ? 10 : 7}
                    strokeWidth={2}
                    strokeDasharray={p.draft ? "3 2" : undefined}
                    className={active ? "fill-primary stroke-foreground" : "fill-card stroke-primary"}
                  />
                  <text
                    x={at[0]}
                    y={at[1] - 13}
                    textAnchor="middle"
                    strokeWidth={3}
                    paintOrder="stroke"
                    className="fill-foreground stroke-card text-[13px]"
                  >
                    {p.name.split(",")[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
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
