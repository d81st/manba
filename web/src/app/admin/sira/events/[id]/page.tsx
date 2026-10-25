import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { formatBookRef } from "@/lib/book-query";
import { getEventForEdit, listChoices } from "@/lib/sira-events";
import { StatusBadge } from "../../../status-badge";
import { EventForm } from "../../event-form";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.events };

export default function EditEventPage({ params, searchParams }: PageProps<"/admin/sira/events/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/sira">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditEvent params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditEvent({ params, searchParams }: Pick<PageProps<"/admin/sira/events/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const event = await getEventForEdit(Number(raw));
  if (!event) notFound();
  const choices = await listChoices();
  const saved = (await searchParams).saved === "1";
  const { id, dates, ...rest } = event;
  const initial = { ...rest, dates: dates.map(({ address, ...d }) => ({ ...d, ref: formatBookRef(address) })) };
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <StatusBadge status={event.status} />
        <Link href={`/sira/events/${event.slug}?drafts=1`} className="text-sm">
          {t.preview}
        </Link>
      </div>
      <EventForm key={`${id}-${event.status}`} id={id} initial={initial} places={choices.places} topics={choices.topics} saved={saved} messages={messages} />
    </>
  );
}
