"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/ui/utils";
import { activeHref, filterNav, type NavGroup } from "./site-nav";

type Labels = { sections: string; filter: string; menu: string; close: string; nothing: string };

// The tree of the site: groups, sections and their second level. The page
// being read is marked; the branch it is in stays open; the field above
// narrows the list by name.
function NavTree({ groups, labels, onNavigate }: { groups: NavGroup[]; labels: Labels; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const active = activeHref(pathname, groups);
  const shown = filterNav(groups, query);
  const link = (href: string, label: string, nested = false) => {
    const current = href.split("?")[0] === active && !href.includes("?");
    return (
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={cn(
          "block rounded-md px-2 py-1.5 text-sm no-underline hover:bg-accent",
          nested && "ps-4",
          current ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
      </Link>
    );
  };
  return (
    <nav aria-label={labels.sections} className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.filter}
          aria-label={labels.filter}
          className="ps-8"
        />
      </div>
      {shown.length === 0 && <p className="px-2 text-sm text-muted-foreground">{labels.nothing}</p>}
      {shown.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const open = Boolean(query) || item.href.split("?")[0] === active || (item.children ?? []).some((c) => c.href.split("?")[0] === active);
              return (
                <li key={item.href + item.label}>
                  {link(item.href, item.label)}
                  {item.children && open && (
                    <ul className="mt-0.5 space-y-0.5 border-s ms-2">
                      {item.children.map((child) => (
                        <li key={child.href + child.label}>{link(child.href, child.label, true)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// On a wide screen the tree stands to the left of the page and stays in view.
export function SiteSidebar({ groups, labels }: { groups: NavGroup[]; labels: Labels }) {
  return (
    // A block of the screen's height that stays in place, not a column as tall
    // as the page: a stretched column threw off the jump to an #anchor.
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-y-auto border-e px-3 py-6 lg:block">
      <NavTree groups={groups} labels={labels} />
    </aside>
  );
}

// On a phone the tree opens over the page from the "Menu" button.
// "children": the language switch and the account, at the foot of the menu.
export function MobileMenu({ groups, labels, children }: { groups: NavGroup[]; labels: Labels; children?: React.ReactNode }) {
  // Open for the page it was opened on: going to another page closes it.
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent"
      >
        <Menu className="size-4" />
        {labels.menu}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={labels.sections}>
          <button type="button" aria-label={labels.close} className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-80 max-w-[85vw] overflow-y-auto border-e bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium">{labels.sections}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="inline-flex size-11 items-center justify-center rounded-md hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavTree groups={groups} labels={labels} onNavigate={() => setOpen(false)} />
            {children && <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4">{children}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
