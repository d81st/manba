import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { formatBookRef } from "@/lib/book-query";
import { getHistoryEventForEdit, listHistoryTopics } from "@/lib/history";
import type { HistoryLayer } from "@/lib/history-input";
import { StatusBadge } from "../../status-badge";
import { HistoryEventForm } from "../event-form";

const messages = getMessages();
const t = messages.admin.history;

export const metadata: Metadata = { title: t.title };

export default function EditHistoryEventPage({ params, searchParams }: PageProps<"/admin/history/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/history">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditEvent params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditEvent({ params, searchParams }: Pick<PageProps<"/admin/history/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const event = await getHistoryEventForEdit(Number(raw));
  if (!event) notFound();
  const topics = await listHistoryTopics();
  const saved = (await searchParams).saved === "1";
  const { id, dates, ...rest } = event;
  const initial = {
    ...rest,
    layer: rest.layer as HistoryLayer,
    dates: dates.map(({ address, ...d }) => ({ ...d, ref: formatBookRef(address) })),
  };
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <StatusBadge status={event.status} />
        <Link href={`/history?drafts=1#${event.slug}`} className="text-sm">
          {t.preview}
        </Link>
      </div>
      <HistoryEventForm key={`${id}-${event.status}`} id={id} initial={initial} topics={topics} saved={saved} messages={messages} />
    </>
  );
}
