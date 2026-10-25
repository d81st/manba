import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { formatBookRef } from "@/lib/book-query";
import { getPersonForEdit, listChoices } from "@/lib/sira-events";
import type { PersonRelationInput } from "@/lib/sira-input";
import { StatusBadge } from "../../../status-badge";
import { PersonForm } from "../../person-form";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.people };

export default function EditPersonPage({ params, searchParams }: PageProps<"/admin/sira/people/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/sira">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditPerson params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditPerson({ params, searchParams }: Pick<PageProps<"/admin/sira/people/[id]">, "params" | "searchParams">) {
  await connection();
  await requireSession();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const person = await getPersonForEdit(Number(raw));
  if (!person) notFound();
  const choices = await listChoices();
  const saved = (await searchParams).saved === "1";
  const { id, relations, forms, ...rest } = person;
  const initial = {
    ...rest,
    forms: forms.join("\n"),
    relations: relations.map(({ address, ...r }) => ({
      ...r,
      kind: r.kind as PersonRelationInput["kind"],
      status: r.status as PersonRelationInput["status"],
      ref: formatBookRef(address),
    })),
  };
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{person.name}</h1>
        <StatusBadge status={person.status} />
        <Link href="/sira/people?drafts=1" className="text-sm">
          {t.preview}
        </Link>
      </div>
      <PersonForm key={`${id}-${person.status}`} id={id} initial={initial} people={choices.people} topics={choices.topics} saved={saved} messages={messages} />
    </>
  );
}
