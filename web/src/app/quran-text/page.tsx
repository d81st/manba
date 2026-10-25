import { BookText, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listPublishedTopics } from "@/lib/topics";

const messages = getMessages();
const t = messages.quranText;

export const metadata: Metadata = { title: t.title };

// The section «История текста Корана» (docs/PLAN.md): its topics in the order
// they were set up, and the books of the library it draws on.
const BOOKS = [
  { href: "/hadith/masahif_ibn_abi_dawud", work: "masahif_ibn_abi_dawud" },
  { href: "/hadith/fadail_abu_ubayd", work: "fadail_abu_ubayd" },
  { href: "/library/sabaa_ibn_mujahid", work: "sabaa_ibn_mujahid" },
  { href: "/library/ansab_baladhuri", work: "ansab_baladhuri" },
] as const;

const card =
  "flex h-full items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent";

export default function QuranTextPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {t.topics}
      </h2>
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Topics />
      </Suspense>
      <h2 className="mt-8 mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {t.sources}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">{t.sourcesHint}</p>
      <ul className="mb-8 grid gap-3 sm:grid-cols-2">
        {BOOKS.map((book) => (
          <li key={book.work}>
            <Link href={book.href} className={card}>
              {book.href.startsWith("/hadith") ? (
                <ScrollText className="size-5 shrink-0 text-primary" />
              ) : (
                <BookText className="size-5 shrink-0 text-primary" />
              )}
              <span className="font-medium">
                {messages.quranText.books[book.work]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

async function Topics() {
  await connection();
  if (!isDatabaseConfigured())
    return <p className="text-destructive">{messages.quran.noDatabase}</p>;
  const topics = (await listPublishedTopics())
    .filter((topic) => topic.category === "quran_text")
    .sort((a, b) => a.id - b.id);
  if (topics.length === 0) {
    return (
      <p className="text-muted-foreground">
        {t.empty}{" "}
        <Link href="/admin/topics?category=quran_text">{t.drafts}</Link>
      </p>
    );
  }
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link
            href={`/topics/${topic.slug}`}
            className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
          >
            <span className="font-medium">{topic.title}</span>
            <span className="text-sm text-muted-foreground">
              {topic.question}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
