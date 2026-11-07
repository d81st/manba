import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { VideoForm } from "../video-form";

const messages = getMessages();
const t = messages.admin.videos;

export const metadata: Metadata = { title: t.add };

export default function NewVideoPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/videos">← {t.back}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.add}</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <NewVideo />
      </Suspense>
    </Page>
  );
}

async function NewVideo() {
  await connection();
  await requireAdmin();
  return <VideoForm id={null} initial={null} saved={false} messages={messages} />;
}
