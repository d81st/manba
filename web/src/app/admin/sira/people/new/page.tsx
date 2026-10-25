import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listChoices } from "@/lib/sira-events";
import { PersonForm } from "../../person-form";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.addPerson };

export default function NewPersonPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/sira">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.addPerson}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewPerson />
      </Suspense>
    </Page>
  );
}

async function NewPerson() {
  await connection();
  await requireSession();
  const choices = await listChoices();
  return <PersonForm id={null} initial={null} people={choices.people} topics={choices.topics} saved={false} messages={messages} />;
}
