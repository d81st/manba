import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getBook, getCollection } from "@/lib/hadith";
import { HadithAttribution } from "../../../attribution";

const t = getMessages().hadith;

export const metadata: Metadata = { title: t.title };

export default function BookPage({ params }: PageProps<"/hadith/[work]/book/[book]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{t.loading}</p>}>
        <BookText params={params} />
      </Suspense>
    </Page>
  );
}

// Paragraphs of the source, separated by a blank line.
function ArabicText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className} lang="ar" dir="rtl">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="ar text-[1.3rem] leading-[2.1] sm:text-[1.4rem]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

async function BookText({ params }: { params: PageProps<"/hadith/[work]/book/[book]">["params"] }) {
  await connection();
  const { work, book: raw } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !/^\d{1,4}$/.test(raw) || !isDatabaseConfigured()) notFound();
  const [collection, book] = await Promise.all([getCollection(work), getBook(work, Number(raw))]);
  if (!collection || !book) notFound();

  const nav = (
    <nav className="flex justify-between gap-4 py-4 text-sm">
      {book.previous ? (
        <Link href={`/hadith/${work}/book/${book.previous}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.previous}
        </Link>
      ) : (
        <span />
      )}
      {book.next && (
        <Link href={`/hadith/${work}/book/${book.next}`} className="inline-flex items-center gap-1">
          {t.next}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={`/hadith/${work}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {collection.title} · {t.allBooks}
        </Link>
      </nav>
      <header className="flex flex-col gap-1 border-b pt-3 pb-4">
        <p className="text-sm text-muted-foreground">
          {t.book} {book.number}
        </p>
        <h1 className="ar text-3xl leading-loose" lang="ar" dir="rtl">
          {book.title}
        </h1>
      </header>

      {book.chapters.map((chapter) => (
        <section key={chapter.index} className="border-b py-4">
          {chapter.title && (
            <h2 className="ar text-xl font-semibold leading-loose text-primary" lang="ar" dir="rtl">
              {chapter.title}
            </h2>
          )}
          {chapter.intro && <ArabicText text={chapter.intro} className="text-muted-foreground" />}
          <ol>
            {chapter.hadiths.map((hadith) => (
              <li
                key={hadith.number}
                id={`h-${hadith.number}`}
                className="flex scroll-mt-4 flex-col gap-1 border-t py-4 first:border-t-0 target:bg-highlight sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="flex min-w-20 shrink-0 flex-col gap-1">
                  <a href={`#h-${hadith.number}`} className="text-sm font-medium tabular-nums no-underline">
                    {collection.title.replace(/^Сахих /, "")} {hadith.number}
                  </a>
                  {hadith.numbering !== "marker" && (
                    <Badge variant="outline" className="w-fit text-[0.7rem]" title={t.inferredHint}>
                      {t.inferred}
                    </Badge>
                  )}
                </span>
                <ArabicText text={hadith.text} className="flex-1" />
              </li>
            ))}
          </ol>
          {chapter.unnumbered && (
            <div className="mt-2 rounded-lg border border-dashed p-3">
              <p className="mb-1 text-sm font-medium">{t.unnumbered}</p>
              <p className="mb-2 text-xs text-muted-foreground">{t.unnumberedHint}</p>
              <ArabicText text={chapter.unnumbered} />
            </div>
          )}
        </section>
      ))}
      <ScrollToHash />
      {nav}
      <HadithAttribution collection={collection} />
    </>
  );
}
