import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AyahList } from "@/components/ayah-list";
import { HadithRefList } from "@/components/hadith-ref-list";
import { LinkedParagraphs, LinkedText } from "@/components/linked-text";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getPublishedTopic, type MainPassage } from "@/lib/topics";

const messages = getMessages();
const t = messages.topics;

export const metadata: Metadata = { title: t.title };

export default function TopicPage({ params }: PageProps<"/topics/[slug]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/topics" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.back}
        </Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Topic params={params} />
      </Suspense>
    </Page>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

async function Topic({ params }: { params: PageProps<"/topics/[slug]">["params"] }) {
  await connection();
  const { slug } = await params;
  if (!/^[a-z][a-z0-9-]*$/.test(slug) || !isDatabaseConfigured()) notFound();
  const topic = await getPublishedTopic(slug);
  if (!topic) notFound();

  return (
    <article className="mt-3 space-y-8">
      <header className="space-y-2 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{topic.title}</h1>
          {topic.category === "hard" && <Badge variant="secondary">{t.hardBadge}</Badge>}
          {topic.category === "quran_text" && (
            <Link href="/quran-text" className="no-underline">
              <Badge variant="outline">{t.quranTextBadge}</Badge>
            </Link>
          )}
        </div>
        <p className="text-lg text-muted-foreground">{topic.question}</p>
      </header>

      {(topic.main.length > 0 || topic.mainHadiths.length > 0) && (
        <section>
          <Heading>{t.texts}</Heading>
          <div className="space-y-6">
            {topic.main.map((passage) => (
              <Passage key={`${passage.sura}-${passage.from}`} passage={passage} />
            ))}
            {topic.mainHadiths.length > 0 && (
              <div className="rounded-xl border bg-card px-4 shadow-sm">
                <HadithRefList hadiths={topic.mainHadiths} className="border-t-0" />
              </div>
            )}
          </div>
        </section>
      )}

      {(topic.circumstances ||
        topic.circumstancesRefs.length > 0 ||
        topic.circumstancesHadiths.length > 0 ||
        topic.circumstancesNote) && (
        <section>
          <Heading>{t.circumstances}</Heading>
          {topic.circumstances && <LinkedParagraphs text={topic.circumstances} />}
          {topic.circumstancesRefs.length > 0 && (
            <AyahList ayahs={topic.circumstancesRefs} compact className="mt-3" />
          )}
          {topic.circumstancesHadiths.length > 0 && (
            <HadithRefList hadiths={topic.circumstancesHadiths} className="mt-3" />
          )}
          {topic.circumstancesNote && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t.sourceNote}: {topic.circumstancesNote}
            </p>
          )}
        </section>
      )}

      <section>
        <Heading>{t.positions}</Heading>
        {topic.sides.length === 0 ? (
          <p className="text-muted-foreground">{t.noPositions}</p>
        ) : (
          <div className="space-y-6">
            {topic.sides.map((side) => (
              <div key={side.title}>
                <h3 className="mb-2 font-semibold">{side.title}</h3>
                <ul className="space-y-4">
                  {side.positions.map((position, i) => (
                    <li key={i} className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{position.holder}</span>
                        <Badge variant={position.recognition === "minority" ? "outline" : "secondary"}>
                          {messages.admin.recognitions[position.recognition as keyof typeof messages.admin.recognitions]}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <LinkedParagraphs text={position.text} />
                      </div>
                      {position.refs.length > 0 && <AyahList ayahs={position.refs} compact className="mt-3" />}
                      {position.hadiths.length > 0 && <HadithRefList hadiths={position.hadiths} className="mt-3" />}
                      {position.sourceNote && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t.sourceNote}: <LinkedText text={position.sourceNote} />
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {(topic.relatedRefs.length > 0 || topic.relatedHadiths.length > 0) && (
        <section>
          <Heading>{t.relatedRefs}</Heading>
          {topic.relatedRefs.length > 0 && <AyahList ayahs={topic.relatedRefs} compact />}
          {topic.relatedHadiths.length > 0 && <HadithRefList hadiths={topic.relatedHadiths} className="mt-3" />}
        </section>
      )}

      {(topic.terms.length > 0 || topic.related.length > 0) && (
        <section className="grid gap-6 sm:grid-cols-2">
          {topic.terms.length > 0 && (
            <div>
              <Heading>{t.terms}</Heading>
              <Chips items={topic.terms.map((term) => ({ href: `/glossary/${term.slug}`, label: term.translation }))} />
            </div>
          )}
          {topic.related.length > 0 && (
            <div>
              <Heading>{t.related}</Heading>
              <Chips items={topic.related.map((related) => ({ href: `/topics/${related.slug}`, label: related.title }))} />
            </div>
          )}
        </section>
      )}
    </article>
  );
}

// A main passage in full; the ayahs around it open on request.
function Passage({ passage }: { passage: MainPassage }) {
  return (
    <div className="rounded-xl border bg-card px-4 shadow-sm">
      {passage.before.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground">{t.contextBefore}</summary>
          <AyahList ayahs={passage.before} compact muted />
        </details>
      )}
      <AyahList ayahs={passage.ayahs} className={passage.before.length > 0 ? undefined : "border-t-0"} />
      {passage.after.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground">{t.contextAfter}</summary>
          <AyahList ayahs={passage.after} compact muted />
        </details>
      )}
    </div>
  );
}

function Chips({ items }: { items: { href: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="inline-flex rounded-full border bg-card px-3 py-1 text-sm no-underline hover:bg-accent"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
