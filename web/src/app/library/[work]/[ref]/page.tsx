import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { bookAnchor, bookLabel, parseBookPath } from "@/lib/book-query";
import { getBookWork, locatePage, sectionHref } from "@/lib/books";
import { isDatabaseConfigured } from "@/lib/db";

const messages = getMessages();
const t = messages.library;

export const metadata: Metadata = { title: t.title };

// A permanent link: /library/ibn_hisham/1.235 opens the Sira's section at that
// page (1.235.2 at its second piece); /library/tafsir_ibn_kathir/2.64 the
// tafsir at the comment on ayah 2:64.
export default function BookPageLink({ params }: PageProps<"/library/[work]/[ref]">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Locate params={params} />
      </Suspense>
    </Page>
  );
}

async function Locate({ params }: { params: PageProps<"/library/[work]/[ref]">["params"] }) {
  await connection();
  const { work, ref } = await params;
  let decoded = ref;
  try {
    decoded = decodeURIComponent(ref);
  } catch {}
  const path = /^[a-z][a-z0-9_]*$/.test(work) ? parseBookPath(work, decoded) : null;
  if (!path || !isDatabaseConfigured()) notFound();
  const [book, place] = await Promise.all([getBookWork(work), locatePage(work, path)]);
  if (!book) notFound();
  if (place) redirect(sectionHref(work, place.section, place.page, bookAnchor(place.path)));
  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href={`/library/${work}`} className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {book.title}
        </Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">
        {book.shortTitle} {bookLabel(work, path)}
      </h1>
      <p className="mt-3 text-muted-foreground">{book.category === "tafsir" ? t.book.noComment : t.book.noPage}</p>
    </>
  );
}
