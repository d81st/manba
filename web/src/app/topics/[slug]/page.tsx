import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { getMessages } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import { isPreview } from "@/shared/auth/preview";
import { TopicArticle } from "@/modules/topics";
import { getPublishedTopic, getTopicPlace } from "@/modules/topics/server";
import { videosForTopic } from "@/modules/videos/server";
import { PreviewNote } from "@/shared/layout/preview";

const t = getMessages().topics;

export const metadata: Metadata = { title: t.title };

export default function TopicPage({ params, searchParams }: PageProps<"/topics/[slug]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/topics" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-4" />
          {t.back}
        </Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Topic params={params} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Topic({ params, searchParams }: Pick<PageProps<"/topics/[slug]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  const preview = await isPreview(await searchParams);
  if (!/^[a-z][a-z0-9-]*$/.test(slug) || !isDatabaseConfigured()) notFound();
  const topic = await getPublishedTopic(slug, preview);
  if (!topic) notFound();
  const [place, videos] = await Promise.all([topic.place ? getTopicPlace(topic.place) : null, videosForTopic(slug)]);
  return (
    <TopicArticle
      topic={topic}
      place={place}
      videos={videos}
      notice={<PreviewNote preview={preview && topic.status !== "published"} />}
    />
  );
}
