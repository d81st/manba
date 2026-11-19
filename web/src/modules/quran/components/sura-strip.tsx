"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { getMessages } from "@/shared/i18n";
import type { SuraSummary } from "../quran.types";

const t = getMessages().quran;

function placeColor(place: string | null) {
  if (place === "meccan") return "var(--map-meccan)";
  if (place === "medinan") return "var(--map-medinan)";
  return "var(--border)";
}

// The 114 suras as one row above the ayahs. The number is the place in the
// mushaf. The color is the traditional place of revelation, the same one the
// map uses, and does not rank the suras.
export function SuraStrip({ suras, current }: { suras: SuraSummary[]; current: number }) {
  const scroller = useRef<HTMLOListElement>(null);
  const here = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const item = here.current;
    const box = scroller.current;
    if (!item || !box) return;
    box.scrollLeft = Math.max(0, item.offsetLeft - (box.clientWidth - item.clientWidth) / 2);
  }, [current]);

  if (suras.length < 2) return null;

  return (
    <nav aria-label={t.strip} className="mt-4 max-w-full rounded-xl border bg-card p-3">
      <p className="text-sm text-muted-foreground">{t.stripHint}</p>
      <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ background: placeColor("meccan") }} />
          {t.revelationPlace.meccan}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ background: placeColor("medinan") }} />
          {t.revelationPlace.medinan}
        </span>
      </p>
      <ol ref={scroller} dir="ltr" className="mt-3 flex max-w-full gap-1 overflow-x-auto pb-1">
        {suras.map((sura) => {
          const currentSura = sura.number === current;
          return (
            <li key={sura.number} ref={currentSura ? here : undefined} className="shrink-0">
              <Link
                href={`/quran/${sura.number}`}
                aria-current={currentSura ? "page" : undefined}
                aria-label={`${sura.number} ${sura.names.translit}`}
                title={sura.names.translit}
                className="flex h-8 min-w-8 items-center justify-center rounded-md border border-s-4 px-1 text-sm tabular-nums no-underline hover:bg-accent aria-current:ring-2 aria-current:ring-ring"
                style={{ borderInlineStartColor: placeColor(sura.revelationPlace) }}
              >
                {sura.number}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
