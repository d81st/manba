import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { bookPath } from "@/lib/book-query";
import { isDatabaseConfigured } from "@/lib/db";
import { getSura } from "@/lib/quran";
import { QuranNav } from "../nav";
import { SuraMeta } from "../sura-meta";
import { ScrollToHash } from "@/components/scroll-to-hash";

// The commentary each ayah links to.
const TAFSIR = "tafsir_ibn_kathir";

const t = getMessages().quran;

export const metadata: Metadata = { title: t.title };

export default function SuraPage({ params }: PageProps<"/quran/[sura]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{t.loading}</p>}>
        <SuraText params={params} />
      </Suspense>
    </Page>
  );
}

async function SuraText({ params }: { params: PageProps<"/quran/[sura]">["params"] }) {
  await connection();
  const { sura: raw } = await params;
  const number = Number(raw);
  if (!/^\d+$/.test(raw) || number < 1 || number > 114) notFound();
  if (!isDatabaseConfigured()) return <p className="mt-8 text-destructive">{t.noDatabase}</p>;

  const sura = await getSura(number);
  if (!sura) notFound();

  return (
    <>
      <QuranNav current="sura" />
      <header className="flex flex-col gap-1 border-b pt-3 pb-4">
        <h1 className="text-2xl font-semibold">
          {t.sura} {sura.number} · {sura.names.translit}
        </h1>
        <p className="quran text-start text-4xl leading-loose" lang="ar" dir="rtl">
          {sura.names.ar}
        </p>
        <SuraMeta sura={sura} />
      </header>

      <ol className="mt-2 mb-6">
        {sura.segments.map((segment) =>
          segment.level === "basmala" ? (
            <li key={segment.address} className="pt-5 pb-2">
              <p className="quran text-center text-[1.6rem] leading-loose" lang="ar" dir="rtl">
                {segment.text}
              </p>
            </li>
          ) : (
            <li
              key={segment.address}
              id={`${sura.number}-${segment.number}`}
              className="flex scroll-mt-4 flex-col gap-1 border-b py-4 target:bg-highlight sm:flex-row sm:items-baseline sm:gap-4"
            >
              <span className="flex min-w-16 shrink-0 gap-3 text-xs sm:flex-col sm:gap-1">
                <a
                  href={`#${sura.number}-${segment.number}`}
                  className="tabular-nums text-muted-foreground no-underline"
                >
                  {sura.number}:{segment.number}
                </a>
                <Link href={bookPath(TAFSIR, [sura.number, segment.number])} title={t.tafsirHint}>
                  {t.tafsir}
                </Link>
              </span>
              <p className="quran flex-1 text-[1.55rem] leading-[2.3] sm:text-[1.75rem]" lang="ar" dir="rtl">
                {segment.text}
              </p>
            </li>
          ),
        )}
      </ol>
      <ScrollToHash />

      <nav className="flex justify-between gap-4 pb-6">
        {number > 1 ? (
          <Link href={`/quran/${number - 1}`} className="inline-flex items-center gap-1">
            <ArrowLeft className="size-4" />
            {t.previous}
          </Link>
        ) : (
          <span />
        )}
        {number < 114 && (
          <Link href={`/quran/${number + 1}`} className="inline-flex items-center gap-1">
            {t.next}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </nav>

      {sura.attribution && (
        <footer className="border-t pt-4 text-sm text-muted-foreground">
          {t.attribution}: {sura.attribution.title} {sura.attribution.version},{" "}
          <a href={sura.attribution.url} target="_blank" rel="noreferrer">
            Tanzil Project (tanzil.net)
          </a>
          , {sura.attribution.license}, {t.unchanged}.
        </footer>
      )}
    </>
  );
}
