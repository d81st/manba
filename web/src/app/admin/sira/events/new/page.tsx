import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listChoices } from "@/lib/sira-events";
import { EventForm } from "../../event-form";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.addEvent };

export default function NewEventPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/sira">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.addEvent}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewEvent />
      </Suspense>
    </Page>
  );
}

async function NewEvent() {
  await connection();
  await requireSession();
  const choices = await listChoices();
  return <EventForm id={null} initial={null} places={choices.places} topics={choices.topics} saved={false} messages={messages} />;
}
