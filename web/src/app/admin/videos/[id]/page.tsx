import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { getVideoForEdit } from "@/lib/videos";
import { VideoForm } from "../video-form";

const messages = getMessages();
const t = messages.admin.videos;

export const metadata: Metadata = { title: t.title };

export default function EditVideoPage({ params, searchParams }: PageProps<"/admin/videos/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/videos">← {t.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <EditVideo params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function EditVideo({ params, searchParams }: Pick<PageProps<"/admin/videos/[id]">, "params" | "searchParams">) {
  await connection();
  await requireAdmin();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const video = await getVideoForEdit(Number(raw));
  if (!video) notFound();
  const saved = (await searchParams).saved === "1";
  const { id, linkState, checkedAt, ...initial } = video;
  return (
    <>
      <h1 className="mt-3 text-2xl font-semibold" dir="auto">
        {video.title}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          {t.open}
        </a>
        {linkState === "unavailable" && <Badge variant="destructive">{t.unavailable}</Badge>}
        {checkedAt && <span>{t.checkedAt.replace("{date}", checkedAt)}</span>}
      </p>
      <VideoForm key={`${id}-${initial.status}`} id={id} initial={initial} saved={saved} messages={messages} />
    </>
  );
}
