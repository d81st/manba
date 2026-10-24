import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { getMessages } from "@/i18n";
import { getBookSection, getBookWork } from "@/lib/books";
import { isDatabaseConfigured } from "@/lib/db";
import { HadithAttribution } from "../../../../hadith/attribution";

const messages = getMessages();
const t = messages.library;

export const metadata: Metadata = { title: t.sira };

export default function BookSectionPage({ params }: PageProps<"/library/[work]/s/[section]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{messages.hadith.loading}</p>}>
        <SectionText params={params} />
      </Suspense>
    </Page>
  );
}

// Paragraphs of the source, separated by a blank line.
function ArabicText({ text }: { text: string }) {
  return (
    <div className="flex-1" lang="ar" dir="rtl">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="ar text-[1.3rem] leading-[2.1] sm:text-[1.4rem]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

async function SectionText({ params }: { params: PageProps<"/library/[work]/s/[section]">["params"] }) {
  await connection();
  const { work, section: raw } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !/^\d{1,4}$/.test(raw) || !isDatabaseConfigured()) notFound();
  const [book, section] = await Promise.all([getBookWork(work), getBookSection(work, Number(raw))]);
  if (!book || !section) notFound();

  const nav = (
    <nav className="flex items-center justify-between gap-4 py-4 text-sm">
      {section.previous !== null ? (
        <Link href={`/library/${work}/s/${section.previous}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.book.previous}
        </Link>
      ) : (
        <span />
      )}
      {section.next !== null ? (
        <Link href={`/library/${work}/s/${section.next}`} className="inline-flex items-center gap-1">
          {t.book.next}
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );

  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={`/library/${work}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {book.title} · {t.book.allSections}
        </Link>
      </nav>
      <header className="flex flex-col gap-1 border-b pt-3 pb-4">
        <p className="text-sm text-muted-foreground">
          {t.book.section} {section.number}
        </p>
        <h1 className="ar text-3xl leading-loose" lang="ar" dir="rtl">
          {section.title}
        </h1>
      </header>

      {section.chapters.map((chapter) => (
        <section key={chapter.index} className="border-b py-4">
          {chapter.title && (
            <h2 className="ar text-xl font-semibold leading-loose text-primary" lang="ar" dir="rtl">
              {chapter.title}
            </h2>
          )}
          <ol>
            {chapter.pieces.map((piece) => (
              <li
                key={piece.anchor}
                id={piece.anchor}
                className="flex scroll-mt-4 flex-col gap-1 border-t py-3 first:border-t-0 target:bg-highlight sm:flex-row sm:items-baseline sm:gap-4"
              >
                <a href={`#${piece.anchor}`} className="min-w-20 shrink-0 text-sm font-medium tabular-nums no-underline">
                  {book.shortTitle} {piece.label}
                </a>
                <ArabicText text={piece.text} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      <ScrollToHash />
      {nav}
      <HadithAttribution collection={book} />
    </>
  );
}
