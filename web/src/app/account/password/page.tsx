import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { requireSession } from "@/shared/auth/auth";
import { PasswordForm } from "@/modules/accounts";

const t = getMessages().account;

export const metadata: Metadata = { title: t.title };

export default function PasswordPage() {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Body />
      </Suspense>
    </Page>
  );
}

async function Body() {
  const session = await requireSession();
  if (!session.uid) return <p className="mt-4 text-muted-foreground">{t.mainAdmin}</p>;
  return (
    <div className="mt-4 space-y-4">
      {session.pc && <p className="rounded-lg border border-dashed px-3 py-2 text-sm">{t.mustChange}</p>}
      <PasswordForm t={t} />
    </div>
  );
}
