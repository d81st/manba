import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { isExternal } from "@/lib/external";
import { getExternalContents } from "@/lib/external-texts";

const messages = getMessages();
const t = messages.external;

export const metadata: Metadata = { title: t.title };

// Books of a text of another religion, each with its chapters.
export default function ExternalWorkPage({ params }: PageProps<"/external/[work]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/external">← {t.title}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Contents params={params} />
      </Suspense>
    </Page>
  );
}

async function Contents({ params }: Pick<PageProps<"/external/[work]">, "params">) {
  await connection();
  const { work } = await params;
  if (!isExternal(work) || !isDatabaseConfigured()) notFound();
  const books = await getExternalContents(work);
  return (
    <>
      <h1 className="mt-3 text-2xl font-semibold">{t.works[work]}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.hints[work]}</p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {books.map((book) => (
          <li key={book.n} className="rounded-xl border bg-card px-4 py-3 text-card-foreground shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{book.ru}</span>
              {book.original && (
                <span lang="he" dir="rtl" className="text-lg">
                  {book.original}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{plural(book.chapters, t.chapters)}</p>
            <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm tabular-nums">
              {Array.from({ length: book.chapters }, (_, i) => (
                <Link key={i} href={`/external/${work}/${book.n}/${i + 1}`}>
                  {i + 1}
                </Link>
              ))}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-6 mb-8 text-xs text-muted-foreground">{t.credits[work]}</p>
    </>
  );
}
