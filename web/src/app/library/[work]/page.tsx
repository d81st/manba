import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages, plural } from "@/i18n";
import { BOOKS } from "@/lib/book-query";
import { getBookWork } from "@/lib/books";
import { isDatabaseConfigured } from "@/lib/db";
import { HadithAttribution } from "../../hadith/attribution";
import { BookSearchForm } from "./search-form";

const messages = getMessages();
const t = messages.library;

export const metadata: Metadata = { title: t.title };

// Contents of a book cited by volume and page: its sections with their pages.
export default function BookContentsPage({ params }: PageProps<"/library/[work]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/library" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.title}
        </Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Contents params={params} />
      </Suspense>
    </Page>
  );
}

async function Contents({ params }: { params: PageProps<"/library/[work]">["params"] }) {
  await connection();
  const { work } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !isDatabaseConfigured()) notFound();
  const book = await getBookWork(work);
  if (!book) notFound();
  const tafsir = book.category === "tafsir";

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b pt-3 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="text-muted-foreground">
            {tafsir
              ? plural(book.sections.filter((s) => s.number > 0).length, t.book.surahs)
              : book.volumes.map((v) => `${t.book.volume} ${v.volume}: ${t.book.pagesShort} ${v.first}–${v.last}`).join(" · ")}
          </p>
        </div>
        <span className="ar text-3xl leading-loose" lang="ar" dir="rtl">
          {book.titleAr}
        </span>
      </header>
      <BookSearchForm work={book.id} tafsir={tafsir} />
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{tafsir ? t.book.tafsirIntro : t.book.intro.replace("{label}", BOOKS[book.id]?.label ?? book.title)}</p>
      <h2 className="mt-6 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {tafsir ? t.book.surahsTitle : t.book.sections}
      </h2>
      <ol className="mb-8 grid gap-2.5 sm:grid-cols-2">
        {book.sections.map((section) => (
          <li key={section.number}>
            <Link
              href={`/library/${book.id}/s/${section.number}`}
              className="flex h-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="min-w-9 text-center font-semibold tabular-nums text-primary">
                {tafsir && section.number === 0 ? "" : section.number}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="ar text-lg" lang="ar" dir="rtl">
                  {section.title}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {(tafsir
                    ? [section.number === 0 && t.book.introduction, plural(section.chapters, t.book.parts)]
                    : [
                        section.first === section.last ? section.first : `${section.first}–${section.last}`,
                        section.chapters > 0 && plural(section.chapters, t.book.chapters),
                      ]
                  )
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <HadithAttribution collection={book} />
    </>
  );
}
