import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getCollection, locateHadith } from "@/lib/hadith";

const t = getMessages().hadith;

export const metadata: Metadata = { title: t.title };

// A permanent link to one hadith: /hadith/bukhari/3951 opens it in its book.
export default function HadithNumberPage({ params }: PageProps<"/hadith/[work]/[number]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{t.loading}</p>}>
        <Locate params={params} />
      </Suspense>
    </Page>
  );
}

async function Locate({ params }: { params: PageProps<"/hadith/[work]/[number]">["params"] }) {
  await connection();
  const { work, number: raw } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(work) || !/^\d{1,5}$/.test(raw) || !isDatabaseConfigured()) notFound();
  const number = Number(raw);
  const [collection, place] = await Promise.all([getCollection(work), locateHadith(work, number)]);
  if (!collection || !place) notFound();
  if (place.book !== null) redirect(`/hadith/${work}/book/${place.book}#h-${number}`);

  const beyond = place.after === null;
  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={`/hadith/${work}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {collection.title}
        </Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">
        {t.notMarkedTitle}: {number}
      </h1>
      {beyond ? (
        <p className="mt-3 text-muted-foreground">{t.tooBig}</p>
      ) : (
        <>
          <p className="mt-3 text-muted-foreground">{t.notMarked.replace("{number}", String(number))}</p>
          <ul className="mt-3 flex gap-3">
            {[place.before, place.after].map(
              (n) =>
                n !== null && (
                  <li key={n}>
                    <Link href={`/hadith/${work}/${n}`}>
                      {collection.title} {n}
                    </Link>
                  </li>
                ),
            )}
          </ul>
        </>
      )}
    </>
  );
}
