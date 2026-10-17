"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Messages } from "@/i18n";
import { searchKey } from "@/lib/arabic";
import type { TermSummary } from "@/lib/glossary";
import { cn } from "@/lib/utils";

// Latin letters without diacritics, Cyrillic lowercased, Arabic folded.
function normalize(text: string) {
  return searchKey(text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()).replace(/[ʿʾ'’`-]/g, "");
}

export function GlossaryList({ terms, t }: { terms: TermSummary[]; t: Messages["glossary"] }) {
  const [query, setQuery] = useState("");
  const [basicOnly, setBasicOnly] = useState(false);

  const shown = useMemo(() => {
    const q = normalize(query.trim());
    const list = terms.filter(
      (term) =>
        (!basicOnly || term.isBasic) &&
        (!q || [term.translation, term.transliteration, term.arabic].some((field) => normalize(field).includes(q))),
    );
    return basicOnly ? [...list].sort((a, b) => (a.basicOrder ?? 0) - (b.basicOrder ?? 0)) : list;
  }, [terms, query, basicOnly]);

  if (terms.length === 0) return <p className="mt-6 text-muted-foreground">{t.empty}</p>;

  return (
    <>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            dir="auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="h-10 ps-9"
          />
        </div>
        <div className="flex gap-2 text-sm" role="group">
          {[false, true].map((basic) => (
            <button
              key={String(basic)}
              type="button"
              aria-pressed={basicOnly === basic}
              onClick={() => setBasicOnly(basic)}
              className={cn(
                "rounded-full border px-3 py-1",
                basicOnly === basic ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              {basic ? t.basicOnly : t.all}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.nothing}</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {shown.map((term) => (
            <li key={term.id}>
              <Link
                href={`/glossary/${term.slug}`}
                className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">
                    {basicOnly && term.basicOrder && (
                      <span className="me-2 text-muted-foreground tabular-nums">{term.basicOrder}.</span>
                    )}
                    {term.translation}
                  </span>
                  <span className="ar text-xl" lang="ar">
                    {term.arabic}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {term.transliteration}
                  {term.isBasic && !basicOnly && (
                    <Badge variant="secondary" className="ms-2">
                      {t.basicOnly}
                    </Badge>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">{term.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
