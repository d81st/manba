"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/ui/utils";

const KEY = "manba:open:";

function remembered(id: string): boolean | null {
  try {
    const value = window.localStorage.getItem(KEY + id);
    return value === null ? null : value === "1";
  } catch {
    return null; // private mode, storage turned off
  }
}

function remember(id: string, open: boolean) {
  try {
    window.localStorage.setItem(KEY + id, open ? "1" : "0");
  } catch {}
}

// A second level of a page: closed until the reader opens it, its button says
// what is inside and how much. It is not hidden from the reader: a link to it
// or to anything inside it (#id) opens it, the browser's find-in-page opens
// it, and whether the reader opened this kind of block is remembered in their
// browser only (by "remember", the kind of block, or else by its id).
export function Reveal({
  id,
  title,
  count,
  defaultOpen = false,
  remember: kind,
  className,
  children,
}: {
  id: string;
  title: React.ReactNode;
  count?: string;
  defaultOpen?: boolean;
  remember?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const key = kind ?? id;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const saved = remembered(key);
    // Reading the reader's own choice once, after the page is on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved !== null) setOpen(saved);
    const follow = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash || !ref.current) return;
      const target = document.getElementById(hash);
      if (target && (target === ref.current.parentElement || ref.current.contains(target))) {
        setOpen(true);
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      }
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [key]);

  return (
    <section id={id} className={cn("scroll-mt-4", className)}>
      <details
        ref={ref}
        open={open}
        onToggle={(e) => {
          const now = e.currentTarget.open;
          if (now !== open) {
            setOpen(now);
            remember(key, now);
          }
        }}
        className="group rounded-xl border bg-card"
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-2 hover:bg-accent [&::-webkit-details-marker]:hidden">
          <span className="font-medium">{title}</span>
          {count && <span className="text-sm text-muted-foreground">{count}</span>}
          <ChevronDown className="ms-auto size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t px-4 py-4">{children}</div>
      </details>
    </section>
  );
}
