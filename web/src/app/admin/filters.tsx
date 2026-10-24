import Link from "next/link";
import { cn } from "@/lib/utils";

// A row of choices as links, the chosen one filled.
export function Filters({
  items,
  current,
  href,
}: {
  items: { key?: string; label: string }[];
  current?: string;
  href: (key?: string) => string;
}) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <Link
          key={item.label}
          href={href(item.key)}
          className={cn(
            "rounded-full border px-3 py-1 no-underline",
            item.key === current ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
