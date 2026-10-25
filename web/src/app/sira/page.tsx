import { CalendarRange, ChevronDown, Map as MapIcon, Network } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages, plural } from "@/i18n";
import { getBookWork } from "@/lib/books";
import { isDatabaseConfigured } from "@/lib/db";
import { SIRA_PERIODS, SIRA_WORK } from "@/lib/sira";
import { listPublishedTopics } from "@/lib/topics";
import { BookSearchForm } from "../library/[work]/search-form";

const messages = getMessages();
const t = messages.sira;

export const metadata: Metadata = { title: t.title };

// The section «Жизнеописание пророка» (docs/PLAN.md): the cards of people and
// events, then the life of the prophet in the order of the Sira of Ibn Hisham,
// its sections grouped in periods (lib/sira.ts).
const VIEWS = [
  { href: "/sira/timeline", icon: CalendarRange, title: t.views.timeline, hint: t.views.timelineHint },
  { href: "/sira/map", icon: MapIcon, title: t.views.map, hint: t.views.mapHint },
  { href: "/sira/people", icon: Network, title: t.views.people, hint: t.views.peopleHint },
];

const BOOKS = ["ibn_hisham", "maghazi_waqidi", "tarikh_khalifa", "tarikh_tabari"] as const;

export default function SiraPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {VIEWS.map(({ href, icon: Icon, title, hint }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full gap-3 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <Icon className="size-5 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="text-sm text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <BookSearchForm work={SIRA_WORK} />
      <p className="text-sm text-muted-foreground">{t.searchHint}</p>
      <Suspense
        fallback={
          <p className="mt-6 text-muted-foreground">
            {messages.hadith.loading}
          </p>
        }
      >
        <Cards />
        <Periods />
      </Suspense>
    </Page>
  );
}

async function Cards() {
  await connection();
  if (!isDatabaseConfigured())
    return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const cards = (await listPublishedTopics())
    .filter((topic) => topic.category === "sira")
    .sort((a, b) => a.id - b.id);
  return (
    <section>
      <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {t.cards}
      </h2>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t.noCards} <Link href="/admin/topics?category=sira">{t.drafts}</Link>
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/topics/${card.slug}`}
                className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="font-medium">{card.title}</span>
                <span className="text-sm text-muted-foreground">
                  {card.question}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function Periods() {
  await connection();
  if (!isDatabaseConfigured()) return null;
  const book = await getBookWork(SIRA_WORK);
  if (!book) return <p className="mt-6 text-muted-foreground">{t.noBook}</p>;
  return (
    <section>
      <h2 className="mt-8 mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {t.timeline}
      </h2>
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
        {t.timelineHint}
      </p>
      <ol className="space-y-3">
        {SIRA_PERIODS.map((period, index) => {
          const sections = book.sections.filter(
            (s) => s.number >= period.from && s.number <= period.to,
          );
          return (
            <li key={period.from}>
              <details
                className="group rounded-xl border bg-card text-card-foreground shadow-sm"
                open={index === 1}
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-6 text-center font-semibold tabular-nums text-primary">
                    {index + 1}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium">{period.title}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {plural(sections.length, t.sections)} ·{" "}
                      {sections[0]?.first}–{sections.at(-1)?.last}
                    </span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <ol className="border-t">
                  {sections.map((section) => (
                    <li
                      key={section.number}
                      className="border-b last:border-b-0"
                    >
                      <Link
                        href={`/library/${SIRA_WORK}/s/${section.number}`}
                        className="flex items-baseline gap-3 px-4 py-2.5 no-underline hover:bg-accent"
                      >
                        <span className="min-w-8 text-xs tabular-nums text-muted-foreground">
                          {section.number}
                        </span>
                        <span
                          className="ar flex-1 text-lg text-foreground"
                          lang="ar"
                          dir="rtl"
                        >
                          {section.title}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {section.first}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-xs text-muted-foreground">{t.source}</p>
      <h2 className="mt-8 mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.books}</h2>
      <p className="mb-2 text-sm text-muted-foreground">{t.booksHint}</p>
      <ul className="mb-8 list-disc space-y-1 ps-5 text-sm">
        {BOOKS.map((work) => (
          <li key={work}>
            <Link href={`/library/${work}`}>{t.bookTitles[work]}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
