import { ExternalLink, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { Badge } from "@/shared/ui/badge";
import { getMessages } from "@/shared/i18n";
import { requireAdmin } from "@/shared/auth/auth";
import { ReviewItemForm } from "@/modules/topics";
import { getTopicReview, saveReviewCheckAction, type ReviewEntry } from "@/modules/topics/server";
import { PreviewLink } from "../../preview-link";
import { StatusBadge } from "../../status-badge";

const t = getMessages().admin;
const r = t.review;

export function generateMetadata(): Metadata {
  return { title: r.title };
}

export default function TopicReviewPage({ params }: PageProps<"/admin/review/[id]">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin/review">← {r.back}</Link>
      </nav>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <TopicReview params={params} />
      </Suspense>
    </Page>
  );
}

const STATE_VARIANT = { open: "outline", checked: "default", changed: "secondary" } as const;

async function TopicReview({ params }: { params: PageProps<"/admin/review/[id]">["params"] }) {
  await connection();
  await requireAdmin();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const review = await getTopicReview(Number(raw));
  if (!review) notFound();
  const { progress, ready } = review;
  const done = progress.checked === progress.total;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{review.title}</h1>
        <StatusBadge status={review.status} />
      </div>
      <p className="mt-1 text-muted-foreground">{review.question}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href={`/admin/topics/${review.id}`} className="inline-flex items-center gap-1">
          <Pencil className="size-4" />
          {r.editTopic}
        </Link>
        <PreviewLink href={`/topics/${review.slug}`} className="inline-flex items-center gap-1">
          <ExternalLink className="size-4" />
          {r.preview}
        </PreviewLink>
      </div>

      <section className="mt-6 space-y-3 rounded-xl border bg-card p-4">
        <p className="text-lg font-medium tabular-nums">
          {r.columns.progress}: {progress.checked} {r.of} {progress.total}
          {progress.changed > 0 && (
            <Badge variant="secondary" className="ms-2 align-middle">
              {r.changed}: {progress.changed}
            </Badge>
          )}
        </p>
        <p className="text-sm">
          {r.ready.title}:{" "}
          {(["main", "circumstances", "positions"] as const).map((key, i) => (
            <span key={key}>
              {i > 0 && " · "}
              {r.ready[key]} — <span className={ready[key] ? "" : "font-medium text-destructive"}>{ready[key] ? r.ready.yes : r.ready.no}</span>
            </span>
          ))}
        </p>
        {review.missing && (
          <div className="text-sm">
            <p className="font-medium">{r.missing}</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{review.missing}</p>
          </div>
        )}
        {done && <p className="text-sm font-medium">{r.allChecked}</p>}
      </section>

      <ol className="mt-6 space-y-4">
        {review.entries.map((entry, i) => (
          <li key={entry.key} id={`item-${i + 1}`} className="scroll-mt-20 rounded-xl border bg-card p-4">
            <Entry entry={entry} index={i + 1} topicId={review.id} />
          </li>
        ))}
      </ol>
    </>
  );
}

function Entry({ entry, index, topicId }: { entry: ReviewEntry; index: number; topicId: number }) {
  const recognition = t.recognitions[entry.recognition as keyof typeof t.recognitions] ?? entry.recognition;
  return (
    <article className="space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
          {index}. {r.kinds[entry.kind]}
          {entry.holder && `: ${entry.holder}`}
        </h2>
        <Badge variant={STATE_VARIANT[entry.state]}>{r.states[entry.state]}</Badge>
      </header>
      <p className="text-sm text-muted-foreground">{r.hints[entry.kind]}</p>

      {entry.kind === "position" && (
        <p className="text-sm">
          {r.side}: {entry.side} · {r.recognition}: {recognition}
        </p>
      )}
      {entry.text && <p className="whitespace-pre-line">{entry.text}</p>}
      {entry.note && (
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{r.sourceNote}: </span>
          {entry.note}
        </p>
      )}

      {entry.refGroups.map((group) => (
        <div key={group.role} className="text-sm">
          <span className="font-medium">{r.roles[group.role]}: </span>
          {group.refs.length === 0 ? (
            <span className="text-muted-foreground">{r.noRefs}</span>
          ) : (
            group.refs.map((ref, k) => (
              <span key={ref.href + k}>
                {k > 0 && ", "}
                <Link href={ref.href}>{ref.label}</Link>
              </span>
            ))
          )}
        </div>
      ))}

      {entry.quotes.length > 0 && (
        <div className="text-sm">
          <p className="font-medium">{r.quotes}</p>
          <ul className="mt-1 space-y-1">
            {entry.quotes.map((q) => (
              <li key={q.quote} className="flex flex-wrap items-baseline gap-x-2">
                <span lang="ar" dir="rtl" className="quran text-base">
                  {q.quote}
                </span>
                {q.href ? (
                  <Link href={q.href}>{r.quoteFound}</Link>
                ) : (
                  <span className="font-medium text-destructive">{r.quoteMissing}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.check?.checked && (
        <p className="text-xs text-muted-foreground">
          {r.checkedBy}: {entry.check.actor},{" "}
          {new Date(entry.check.updatedAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}
      <ReviewItemForm
        id={`item-${index}`}
        checked={entry.state === "checked"}
        note={entry.check?.note ?? ""}
        action={saveReviewCheckAction.bind(null, topicId, entry.key)}
        t={{ note: r.note, noteHint: r.noteHint, check: r.check, uncheck: r.uncheck, saveNote: r.saveNote, saved: r.saved, failed: r.failed }}
      />
    </article>
  );
}
