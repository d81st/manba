import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../status-badge";
import { listVideos } from "@/modules/videos/server";
import { CheckLinks, VIDEO_STATUSES } from "@/modules/videos";

const messages = getMessages();
const t = messages.admin.videos;

export const metadata: Metadata = { title: t.title };

export default function AdminVideosPage({ searchParams }: PageProps<"/admin/videos">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/admin/videos/new">+ {t.add}</Link>
        <CheckLinks t={t} />
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Videos searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Videos({ searchParams }: Pick<PageProps<"/admin/videos">, "searchParams">) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const status = VIDEO_STATUSES.find((s) => s === params.status);
  const videos = await listVideos(status);
  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {[undefined, ...VIDEO_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/videos?status=${s}` : "/admin/videos"}
            className={cn(
              "rounded-full border px-3 py-1 no-underline",
              status === s ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            {s ? messages.admin.statuses[s] : t.all}
          </Link>
        ))}
      </nav>
      {videos.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-4 divide-y rounded-xl border bg-card">
          {videos.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Link href={`/admin/videos/${v.id}`} className="font-medium" dir="auto">
                {v.title}
              </Link>
              <StatusBadge status={v.status} />
              <Badge variant="outline">{t.platforms[v.platform]}</Badge>
              {v.linkState === "unavailable" && <Badge variant="destructive">{t.unavailable}</Badge>}
              <span className="ms-auto text-sm text-muted-foreground">
                {t.counts.replace("{places}", String(v.places)).replace("{topics}", String(v.topics))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
