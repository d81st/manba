import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listTermChoices } from "@/lib/glossary";
import { TermForm } from "../term-form";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.terms.newTitle };

export default function NewTermPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/terms">← {t.terms.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.terms.newTitle}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewTerm />
      </Suspense>
    </Page>
  );
}

async function NewTerm() {
  await connection();
  await requireSession();
  const choices = await listTermChoices();
  return <TermForm id={null} initial={null} choices={choices} relatedNames={{}} saved={false} t={t} />;
}
