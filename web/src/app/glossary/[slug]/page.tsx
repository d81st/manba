import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { TermArticle } from "@/modules/glossary";
import { getPublishedTerm } from "@/modules/glossary/server";

const t = getMessages().glossary;

export const metadata: Metadata = { title: t.title };

export default function TermPage({ params }: PageProps<"/glossary/[slug]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/glossary" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.back}
        </Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Term params={params} />
      </Suspense>
    </Page>
  );
}

async function Term({ params }: { params: PageProps<"/glossary/[slug]">["params"] }) {
  await connection();
  const { slug } = await params;
  if (!/^[a-z][a-z0-9-]*$/.test(slug) || !isDatabaseConfigured()) notFound();
  const term = await getPublishedTerm(slug);
  if (!term) notFound();

  return <TermArticle term={term} />;
}
