import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listTopicsForAdmin } from "@/lib/topics";
import { TOPIC_CATEGORIES, TOPIC_STATUSES } from "@/lib/topics-input";
import { Filters } from "../filters";
import { StatusBadge } from "../status-badge";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.topics.title };

export default function TopicsPage({ searchParams }: PageProps<"/admin/topics">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {t.title}</Link>
      </nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.topics.title}</h1>
        <Button asChild>
          <Link href="/admin/topics/new" className="no-underline">
            <Plus />
            {t.topics.add}
          </Link>
        </Button>
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <TopicsTable searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function TopicsTable({ searchParams }: { searchParams: PageProps<"/admin/topics">["searchParams"] }) {
  await connection();
  await requireSession();
  const params = await searchParams;
  const status = TOPIC_STATUSES.find((s) => s === params.status);
  const category = TOPIC_CATEGORIES.find((c) => c === params.category);
  const topics = await listTopicsForAdmin(status, category);

  const query = (next: { status?: string; category?: string }) => {
    const search = new URLSearchParams(
      Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return search ? `/admin/topics?${search}` : "/admin/topics";
  };

  return (
    <>
      <div className="mt-4 space-y-2">
        <Filters
          items={[{ label: t.topics.allCategories }, ...TOPIC_CATEGORIES.map((key) => ({ key, label: t.categories[key] }))]}
          current={category}
          href={(key) => query({ status, category: key })}
        />
        <Filters
          items={[{ label: t.topics.all }, ...TOPIC_STATUSES.map((key) => ({ key, label: t.statuses[key] }))]}
          current={status}
          href={(key) => query({ status: key, category })}
        />
      </div>
      {topics.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.topics.empty}</p>
      ) : (
        <div className="mt-4 rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.topics.columns.topic}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.topics.columns.category}</TableHead>
                <TableHead>{t.topics.columns.status}</TableHead>
                <TableHead className="hidden md:table-cell">{t.topics.columns.updated}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="whitespace-normal">
                    <Link href={`/admin/topics/${topic.id}`} className="font-medium">
                      {topic.title}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{topic.question}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={topic.category === "hard" ? "secondary" : "outline"}>
                      {t.categories[topic.category as keyof typeof t.categories] ?? topic.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={topic.status} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {new Date(topic.updatedAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                    <span className="block">{topic.updatedBy}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
