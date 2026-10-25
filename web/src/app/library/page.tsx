import { BookOpen, BookText, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listBookWorks } from "@/lib/books";
import { listCollections } from "@/lib/hadith";

const messages = getMessages();
const t = messages.library;

export const metadata: Metadata = { title: t.title };

const card =
  "flex h-full items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent";

export default function LibraryPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <li>
          <Link href="/quran" className={card}>
            <BookOpen className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-medium">{t.quran}</span>
              <span className="text-sm text-muted-foreground">{t.quranHint}</span>
            </span>
          </Link>
        </li>
      </ul>
      <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.hadith}</h2>
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Collections />
      </Suspense>
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Books />
      </Suspense>
    </Page>
  );
}

async function Collections() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="text-destructive">{messages.quran.noDatabase}</p>;
  const collections = await listCollections();
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {collections.map((c) => (
        <li key={c.id}>
          <Link href={`/hadith/${c.id}`} className={card}>
            <ScrollText className="size-5 shrink-0 text-primary" />
            <span className="flex-1">
              <span className="block font-medium">{c.title}</span>
              <span className="text-sm text-muted-foreground">{t[c.canon === "shia" ? "shia" : "sunni"]}</span>
            </span>
            <span className="ar text-xl" lang="ar" dir="rtl">
              {c.titleAr}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function Books() {
  await connection();
  if (!isDatabaseConfigured()) return null;
  const books = await listBookWorks();
  return (["sira", "tafsir"] as const).map((category) => {
    const group = books.filter((b) => b.category === category);
    if (group.length === 0) return null;
    return (
      <section key={category}>
        <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t[category]}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {group.map((b) => (
            <li key={b.id}>
              <Link href={`/library/${b.id}`} className={card}>
                <BookText className="size-5 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="block font-medium">{b.title}</span>
                  <span className="text-sm text-muted-foreground">{t[`${category}Hint`]}</span>
                </span>
                <span className="ar text-xl" lang="ar" dir="rtl">
                  {b.titleAr}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  });
}
