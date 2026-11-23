"use client";

import { useEffect, useRef, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { cn } from "@/shared/ui/utils";

// The introduction under a page's title. On a phone it shows three lines and
// a "Read more" button, so the section itself is in view first; on a wider
// screen it is shown in full. The words are all on the page either way.
export function Lead({ className, children }: { className?: string; children: React.ReactNode }) {
  const t = getMessages().forms;
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const measure = () => setLong(p.scrollHeight > p.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(p);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={cn("max-w-3xl", className)}>
      <p ref={ref} className={cn("text-muted-foreground", !open && "line-clamp-3 sm:line-clamp-none")}>
        {children}
      </p>
      {(long || open) && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 min-h-11 text-sm text-primary sm:hidden">
          {open ? t.readLess : t.readMore}
        </button>
      )}
    </div>
  );
}
