import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { listChoices } from "@/modules/sira/server";
import { PersonForm } from "@/modules/sira";

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
  await requireAdmin();
  const choices = await listChoices();
  return <PersonForm id={null} initial={null} people={choices.people} topics={choices.topics} saved={false} messages={messages} />;
}
