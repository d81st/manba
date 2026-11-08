import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { ParallelForm } from "@/modules/origins";

const messages = getMessages();
const t = messages.admin.origins;

export const metadata: Metadata = { title: t.add };

export default function NewParallelPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/origins">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.add}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewParallel />
      </Suspense>
    </Page>
  );
}

async function NewParallel() {
  await connection();
  await requireAdmin();
  return <ParallelForm id={null} initial={null} saved={false} messages={messages} />;
}
