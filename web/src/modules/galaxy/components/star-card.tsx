"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { GraphEdge } from "@/shared/graph/graph.types";
import { getMessages } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { GALAXY_KINDS } from "../galaxy.constants";
import type { GalaxyItem } from "../galaxy.types";

const t = getMessages().galaxy;
const SHOWN = 12;

// The chosen star: what it is, the way to its page and what it is joined to
// (whole works first, then the strongest ties).
export function StarCard({
  selected,
  byId,
  edges,
  onSelect,
}: {
  selected: string | null;
  byId: Map<string, GalaxyItem>;
  edges: GraphEdge[];
  onSelect: (id: string) => void;
}) {
  const item = selected ? byId.get(selected) : undefined;
  const neighbours = useMemo(() => {
    if (!selected) return [];
    const weight = new Map<string, number>();
    for (const e of edges) {
      const other = e.source === selected ? e.target : e.target === selected ? e.source : null;
      if (other) weight.set(other, Math.max(weight.get(other) ?? 0, e.weight ?? 0));
    }
    return [...weight]
      .flatMap(([id, w]) => {
        const n = byId.get(id);
        return n ? [{ ...n, w }] : [];
      })
      .sort((a, b) => Number(b.work) - Number(a.work) || GALAXY_KINDS.indexOf(a.kind) - GALAXY_KINDS.indexOf(b.kind) || b.w - a.w);
  }, [selected, edges, byId]);

  return (
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
                {neighbours.slice(0, SHOWN).map((n) => (
                  <li key={n.id}>
                    <button type="button" className="text-start text-primary" onClick={() => onSelect(n.id)}>
                      {n.label}
                    </button>
                  </li>
                ))}
              </ul>
              {neighbours.length > SHOWN && (
                <p className="mt-1 text-xs text-muted-foreground">{t.more.replace("{count}", String(neighbours.length - SHOWN))}</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
