import type { Metadata } from "next";
import Link from "next/link";
import { ProposeForm } from "@/modules/debates";
import { getMessages } from "@/shared/i18n";
import { Page } from "@/shared/layout/page";

const messages = getMessages();
const t = messages.debates;

export function generateMetadata(): Metadata {
  return { title: t.new };
}

export default function NewDebatePage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/debates">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.new}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t.intro}</p>
      <ProposeForm />
    </Page>
  );
}
