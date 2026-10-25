import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMessages, plural } from "@/i18n";
import { bookAnchor, bookPath, parseBookQuery } from "@/lib/book-query";
import { BOOK_SEARCH_LIMIT, getBookWork, searchBook } from "@/lib/books";
import { isDatabaseConfigured } from "@/lib/db";
import { searchKey } from "@/lib/arabic";
import { highlight, likePatterns } from "@/lib/quran-query";
import { BookSearchForm } from "../search-form";

const messages = getMessages();
const t = messages.library.book;

export const metadata: Metadata = { title: t.search.title };

export default function BookSearchPage({ params, searchParams }: PageProps<"/library/[work]/search">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Search params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Search({
  params,
  searchParams,
}: {
  params: PageProps<"/library/[work]/search">["params"];
  searchParams: PageProps<"/library/[work]/search">["searchParams"];
}) {
  await connection();
  const [{ work }, { q: raw }] = await Promise.all([params, searchParams]);
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !isDatabaseConfigured()) notFound();
  const book = await getBookWork(work);
  if (!book) notFound();
  const query = typeof raw === "string" ? raw : "";
  const parsed = parseBookQuery(query, work);
  if (parsed.kind === "ref") redirect(bookPath(work, parsed.path));

  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={`/library/${work}`}>← {book.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">
        {t.search.title}: {book.title}
      </h1>
      <BookSearchForm work={work} query={query} />
      <p className="mb-2 text-sm text-muted-foreground">{t.search.hint}</p>
      {parsed.kind === "unsupported" && <Notice>{t.search.unsupported}</Notice>}
      {parsed.kind === "text" && (
        <Results work={work} title={book.shortTitle} words={parsed.words} diacritics={parsed.diacritics} />
      )}
    </>
  );
}

async function Results({
  work,
  title,
  words: asked,
  diacritics: vocalized,
}: {
  work: string;
  title: string;
  words: string[];
  diacritics: boolean;
}) {
  let words = asked;
  let diacritics = vocalized;
  let result = await searchBook(work, likePatterns(words), diacritics);
  // A text printed without vowel marks matches no query with them: search without.
  let dropped = false;
  if (diacritics && result.total === 0) {
    words = words.map((word) => searchKey(word));
    diacritics = false;
    dropped = true;
    result = await searchBook(work, likePatterns(words), false);
  }
  if (result.total === 0) return <Notice>{t.search.nothing}</Notice>;
  return (
    <section>
      <p className="mt-4">
        {t.search.found}: {plural(result.total, t.search.pieces)}
        {diacritics && ` (${t.search.withDiacritics})`}
        {dropped && <span className="block text-sm text-muted-foreground">{t.search.withoutDiacritics}</span>}
        {result.total > BOOK_SEARCH_LIMIT && (
          <span className="text-muted-foreground">
            {" "}
            {t.search.limited.replace("{limit}", String(BOOK_SEARCH_LIMIT))}
          </span>
        )}
      </p>
      <ol className="mt-2 mb-6">
        {result.hits.map((hit) => (
          <li key={hit.label} className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="flex min-w-24 shrink-0 flex-col gap-0.5">
              <Link
                href={`/library/${work}/s/${hit.section}#${bookAnchor(hit.path)}`}
                className="text-sm tabular-nums no-underline"
              >
                {title} {hit.label}
              </Link>
              <span className="text-xs text-muted-foreground">
                {t.section} {hit.section}
              </span>
            </span>
            <div className="flex-1" lang="ar" dir="rtl">
              <p className="ar mb-1 text-sm text-muted-foreground">{hit.sectionTitle}</p>
              <p className="ar text-[1.3rem] leading-[2.1]">
                {highlight(hit.text, words, diacritics).map((piece, i) =>
                  piece.match ? (
                    <mark key={i} className="rounded bg-highlight text-inherit">
                      {piece.text}
                    </mark>
                  ) : (
                    piece.text
                  ),
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="mt-4">
      <Info className="size-4" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
