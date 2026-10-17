import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { listSuras } from "@/lib/quran";
import { QuranNav } from "./nav";
import { SearchForm } from "./search-form";
import { SuraMeta } from "./sura-meta";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.title };

export default function QuranPage() {
  return (
    <Page>
      <QuranNav current="list" />
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground">{t.subtitle}</p>
      <SearchForm />
      <p className="text-sm text-muted-foreground">{t.placeNote}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{t.loading}</p>}>
        <SuraList />
      </Suspense>
    </Page>
  );
}

async function SuraList() {
  // Read the database at request time only, never during the build.
  await connection();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{t.noDatabase}</p>;
  const suras = await listSuras();

  return (
    <ol className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {suras.map((sura) => (
        <li key={sura.number}>
          <Link
            href={`/quran/${sura.number}`}
            className="flex h-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
          >
            <span className="min-w-9 text-center font-semibold tabular-nums text-primary">{sura.number}</span>
            <span className="flex min-w-0 flex-1 flex-col text-[0.95rem]">
              <span>{sura.names.translit}</span>
              <SuraMeta sura={sura} showBasis={false} className="text-xs" />
            </span>
            <span className="quran text-2xl leading-relaxed" lang="ar" dir="rtl">
              {sura.names.ar}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
