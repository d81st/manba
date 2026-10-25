import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listCollections } from "@/lib/hadith";
import { COLLECTIONS } from "@/lib/hadith-query";
import { HadithSearchForm } from "./search-form";

const messages = getMessages();
const t = messages.hadith;

export const metadata: Metadata = { title: t.title };

export default function HadithPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <HadithSearchForm />
      <p className="text-sm text-muted-foreground">{t.search.hint}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{t.loading}</p>}>
        <Collections />
      </Suspense>
    </Page>
  );
}

async function Collections() {
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const all = await listCollections();
  const quran = all.filter((c) => COLLECTIONS[c.id]?.group === "quran");
  return (
    <>
      <CollectionList collections={all.filter((c) => !quran.includes(c))} />
      {quran.length > 0 && (
        <section>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-muted-foreground">{messages.library.quranBooks}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{messages.library.quranBooksHint}</p>
          <CollectionList collections={quran} />
        </section>
      )}
    </>
  );
}

function CollectionList({ collections }: { collections: Awaited<ReturnType<typeof listCollections>> }) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {collections.map((c) => (
        <li key={c.id}>
          <Link
            href={`/hadith/${c.id}`}
            className="flex h-full items-center justify-between gap-3 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
          >
            <span className="flex flex-col gap-1">
              <span className="font-medium">{c.title}</span>
              <Badge variant="secondary">{messages.library[c.canon === "shia" ? "shia" : "sunni"]}</Badge>
            </span>
            <span className="ar text-2xl" lang="ar" dir="rtl">
              {c.titleAr}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
