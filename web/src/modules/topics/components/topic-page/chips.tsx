import Link from "next/link";

// Links shown as rounded chips: glossary terms and related topics.
export function Chips({ items }: { items: { href: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="inline-flex rounded-full border bg-card px-3 py-1 text-sm no-underline hover:bg-accent"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
