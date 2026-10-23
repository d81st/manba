import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getCollection } from "@/lib/hadith";
import { HadithAttribution } from "../attribution";
import { HadithSearchForm } from "../search-form";

const messages = getMessages();
const t = messages.hadith;

export const metadata: Metadata = { title: t.title };

export default function CollectionPage({ params }: PageProps<"/hadith/[work]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/hadith" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.title}
        </Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{t.loading}</p>}>
        <CollectionBooks params={params} />
      </Suspense>
    </Page>
  );
}

async function CollectionBooks({ params }: { params: PageProps<"/hadith/[work]">["params"] }) {
  await connection();
  const { work } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !isDatabaseConfigured()) notFound();
  const collection = await getCollection(work);
  if (!collection) notFound();

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b pt-3 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{collection.title}</h1>
          <p className="text-muted-foreground">
            {plural(collection.hadiths, t.hadiths)}
            {collection.narrations !== null && (
              <span title={t.narrationsHint}> · {plural(collection.narrations, t.narrations)}</span>
            )}
          </p>
        </div>
        <span className="ar text-3xl leading-loose" lang="ar" dir="rtl">
          {collection.titleAr}
        </span>
      </header>
      <HadithSearchForm work={collection.id} />
      <h2 className="mt-6 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.books}</h2>
      <ol className="mb-8 grid gap-2.5 sm:grid-cols-2">
        {collection.books.map((book) => (
          <li key={book.number}>
            <Link
              href={`/hadith/${collection.id}/book/${book.number}`}
              className="flex h-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="min-w-9 text-center font-semibold tabular-nums text-primary">
                {book.number === 0 ? "" : book.number}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="ar text-lg" lang="ar" dir="rtl">
                  {book.title}
                </span>
                {book.first !== null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {book.number === 0 && `${t.preface} · `}
                    {t.numbers} {book.first}–{book.last} · {plural(book.hadiths, t.hadiths)}
                    {book.narrations !== null && ` · ${plural(book.narrations, t.narrations)}`}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <HadithAttribution collection={collection} />
    </>
  );
}
