"use client";

import { useEffect, useRef, useState } from "react";
import { getMessages } from "@/shared/i18n";

const t = getMessages().rail;

export type RailPlace = {
  id: string;
  label: string;
  // A published debate cites this place. The mark is a type, not a rank.
  mark?: boolean;
};

// The places on this page as one row above the text, the same idea as a graph:
// a scan of what is already written below. A number is a place in the text.
// The color means "a published debate cites this place". A press opens that place.
export function PlaceRail({ items }: { items: RailPlace[] }) {
  const scroller = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace(/^#/, "");
      setCurrent(id);
      const box = scroller.current;
      const item = id ? box?.querySelector<HTMLElement>(`[data-place="${CSS.escape(id)}"]`) : null;
      if (item && box) box.scrollLeft = Math.max(0, item.offsetLeft - (box.clientWidth - item.clientWidth) / 2);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [items]);

  if (items.length < 2) return null;
  const marked = items.some((item) => item.mark);

  return (
    <nav aria-label={t.label} className="mt-4 max-w-full rounded-xl border bg-card p-3">
      <p className="pe-12 text-sm text-muted-foreground sm:pe-0">{t.hint}</p>
      {marked && (
        <p className="mt-1 flex items-center gap-1 pe-12 text-xs text-muted-foreground sm:pe-0">
          <span className="inline-block size-2 rounded-sm" style={{ background: "var(--graph-3)" }} />
          {t.marked}
        </p>
      )}
      <ol ref={scroller} dir="ltr" className="mt-3 flex max-w-full gap-1 overflow-x-auto pb-1">
        {items.map((item) => (
          <li key={item.id} data-place={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              title={item.mark ? `${item.label}. ${t.marked}` : item.label}
              data-current={current === item.id ? "true" : undefined}
              className="flex h-8 min-w-8 items-center justify-center rounded-md border border-s-4 px-1 text-xs tabular-nums no-underline hover:bg-accent data-[current=true]:ring-2 data-[current=true]:ring-ring"
              style={{ borderInlineStartColor: item.mark ? "var(--graph-3)" : "var(--border)" }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
