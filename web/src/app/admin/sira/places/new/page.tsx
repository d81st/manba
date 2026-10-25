import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { PlaceForm } from "../../place-form";

const messages = getMessages();
const t = messages.admin.sira;

export const metadata: Metadata = { title: t.addPlace };

export default function NewPlacePage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/sira">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.addPlace}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewPlace />
      </Suspense>
    </Page>
  );
}

async function NewPlace() {
  await connection();
  await requireSession();
  return <PlaceForm id={null} initial={null} saved={false} messages={messages} />;
}
