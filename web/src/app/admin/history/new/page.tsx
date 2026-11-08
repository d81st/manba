import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { listHistoryTopics } from "@/modules/history/server";
import { HistoryEventForm } from "@/modules/history";

const messages = getMessages();
const t = messages.admin.history;

export const metadata: Metadata = { title: t.add };

export default function NewHistoryEventPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/history">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.add}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewEvent />
      </Suspense>
    </Page>
  );
}

async function NewEvent() {
  await connection();
  await requireAdmin();
  const topics = await listHistoryTopics();
  return <HistoryEventForm id={null} initial={null} topics={topics} saved={false} messages={messages} />;
}
