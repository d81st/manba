import { BookA } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.title };

export default function AdminPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href="/admin/terms"
            className="flex h-full gap-3 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
          >
            <BookA className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-medium">{t.sections.terms}</span>
              <span className="text-sm text-muted-foreground">{t.sections.termsHint}</span>
            </span>
          </Link>
        </li>
      </ul>
    </Page>
  );
}
