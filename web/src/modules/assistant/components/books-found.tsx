import Link from "next/link";
import { getMessages } from "@/shared/i18n";
import type { Concept } from "../assistant.types";
import { bookCounts } from "../server/books.queries";

const t = getMessages().assistant;

// "In the other books of the library": the books where the words of the
// question stand, with the number of fragments; each leads to the search of
// that book. Reading through the books takes about a second, so the page
// shows this part after the rest (inside Suspense).
export async function BooksFound({ concepts }: { concepts: Concept[] }) {
  const books = await bookCounts(concepts.map((c) => c.ar));
  if (books.length === 0) return null;
  return (
    <section>
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.books}</h2>
      <p className="mb-2 text-sm text-muted-foreground">{t.booksHint}</p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {books.map((b) => (
          <li key={`${b.concept}-${b.work}`}>
            <Link href={b.href} className="inline-flex items-baseline gap-1.5 rounded-full border px-3 py-1 no-underline hover:bg-accent">
              {b.title}
              {concepts.filter((c) => c.ar.length > 0).length > 1 && <span className="text-muted-foreground">· {concepts[b.concept]?.label}</span>}
              <span className="tabular-nums text-muted-foreground">{b.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
