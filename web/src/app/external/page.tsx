import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { EXTERNAL_IDS } from "@/lib/external";

const messages = getMessages();
const t = messages.external;

export const metadata: Metadata = { title: t.title };

export default function ExternalPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/origins">← {messages.origins.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <ul className="mt-6 mb-8 grid gap-3 sm:grid-cols-3">
        {EXTERNAL_IDS.map((work) => (
          <li key={work}>
            <Link
              href={`/external/${work}`}
              className="flex h-full flex-col gap-1 rounded-xl border bg-card px-4 py-3 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="font-medium">{t.works[work]}</span>
              <span className="text-sm text-muted-foreground">{t.hints[work]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
