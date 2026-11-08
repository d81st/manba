import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { FindingForm } from "@/modules/findings";

const messages = getMessages();
const t = messages.admin.findings;

export const metadata: Metadata = { title: t.add };

export default function NewFindingPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/findings">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.add}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewFinding />
      </Suspense>
    </Page>
  );
}

async function NewFinding() {
  await connection();
  await requireAdmin();
  return <FindingForm id={null} initial={null} saved={false} messages={messages} />;
}
