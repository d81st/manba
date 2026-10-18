import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AyahList } from "@/components/ayah-list";
import { LinkedParagraphs, LinkedText } from "@/components/linked-text";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getPublishedTerm } from "@/lib/glossary";

const messages = getMessages();
const t = messages.glossary;

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

  return (
    <article className="mt-3 space-y-8">
      <header className="flex flex-col gap-1 border-b pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold">{term.translation}</h1>
          <span className="ar text-4xl leading-loose" lang="ar">
            {term.arabic}
          </span>
        </div>
        <p className="text-muted-foreground">{term.transliteration}</p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.short}</h2>
        <p className="text-lg">{term.short}</p>
      </section>

      {term.detail && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.detail}</h2>
          <LinkedParagraphs text={term.detail} />
        </section>
      )}

      {term.refs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.examples}</h2>
          <AyahList ayahs={term.refs} />
        </section>
      )}

      {term.definitions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.definitions}</h2>
          <ul className="space-y-4">
            {term.definitions.map((definition, i) => (
              <li key={i} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{definition.holder}</span>
                  <Badge variant={definition.recognition === "minority" ? "outline" : "secondary"}>
                    {messages.admin.recognitions[definition.recognition as keyof typeof messages.admin.recognitions]}
                  </Badge>
                </div>
                <p className="mt-2 leading-relaxed">
                  <LinkedText text={definition.text} />
                </p>
                {definition.refs.length > 0 && <AyahList ayahs={definition.refs} compact className="mt-3" />}
                {definition.sourceNote && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t.sourceNote}: {definition.sourceNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {term.related.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.related}</h2>
          <ul className="flex flex-wrap gap-2">
            {term.related.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/glossary/${related.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm no-underline hover:bg-accent"
                >
                  {related.translation}
                  <span className="text-xs text-muted-foreground">
                    {messages.admin.relationKinds[related.kind]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
