import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import { listPairsForReview, REVIEW_STATUSES, type PairSide, type ReviewFilter, type ReviewPair } from "@/lib/hadith-links";
import { COLLECTION_ORDER, COLLECTIONS, formatHadithRef, parseHadithRef } from "@/lib/hadith-query";
import { markShared } from "@/lib/shared-words";
import { Filters } from "../filters";
import { reviewPairAction } from "./actions";

const t = getMessages().admin;

export const metadata: Metadata = { title: t.links.title };

export default function LinksPage({ searchParams }: PageProps<"/admin/links">) {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {t.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.links.title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.links.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <PairList searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

// A hadith written as in search ("Бухари 1") or as an address (bukhari.1).
function addressOf(text: string | undefined) {
  if (!text) return null;
  const trimmed = text.trim();
  return /^[a-z_]+(\.\d+)+$/.test(trimmed) ? trimmed : parseHadithRef(trimmed);
}

async function PairList({ searchParams }: { searchParams: PageProps<"/admin/links">["searchParams"] }) {
  await connection();
  await requireSession();
  const params = await searchParams;
  const status = REVIEW_STATUSES.find((s) => s === params.status) ?? "unchecked";
  const work = COLLECTION_ORDER.find((w) => w === params.work) ?? null;
  const order = params.order === "desc" ? "desc" : "asc";
  const query = one(params.q);
  const address = addressOf(query);
  const pageParam = one(params.page);
  const page = pageParam && /^\d{1,5}$/.test(pageParam) ? Number(pageParam) : 1;
  const filter: ReviewFilter = { status, work, address, order, page };
  const list = await listPairsForReview(filter);

  const href = (next: Partial<ReviewFilter>) => {
    const f = { ...filter, page: 1, ...next };
    const search = new URLSearchParams();
    if (f.status !== "unchecked") search.set("status", f.status);
    if (f.work) search.set("work", f.work);
    if (f.address) search.set("q", f.address);
    if (f.order !== "asc") search.set("order", f.order);
    if (f.page > 1) search.set("page", String(f.page));
    const s = search.toString();
    return s ? `/admin/links?${s}` : "/admin/links";
  };

  const pager = list.pages > 1 && (
    <nav className="flex items-center justify-between gap-4 py-3 text-sm">
      {list.page > 1 ? <Link href={href({ page: list.page - 1 })}>← {t.links.previous}</Link> : <span />}
      <span className="text-muted-foreground tabular-nums">
        {t.links.page} {list.page} {t.links.of} {list.pages}
      </span>
      {list.page < list.pages ? <Link href={href({ page: list.page + 1 })}>{t.links.next} →</Link> : <span />}
    </nav>
  );

  return (
    <>
      <div className="mt-4 space-y-2">
        <Filters
          items={REVIEW_STATUSES.map((key) => ({ key, label: `${t.links.statuses[key]} · ${list.counts[key]}` }))}
          current={status}
          href={(key) => href({ status: (key as ReviewFilter["status"]) ?? "unchecked" })}
        />
        <Filters
          items={[{ label: t.links.allCollections }, ...COLLECTION_ORDER.map((key) => ({ key, label: COLLECTIONS[key].label }))]}
          current={work ?? undefined}
          href={(key) => href({ work: key ?? null })}
        />
        <Filters
          items={(["asc", "desc"] as const).map((key) => ({ key, label: t.links.order[key] }))}
          current={order}
          href={(key) => href({ order: key === "desc" ? "desc" : "asc" })}
        />
        <form action="/admin/links" className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          {status !== "unchecked" && <input type="hidden" name="status" value={status} />}
          {work && <input type="hidden" name="work" value={work} />}
          {order !== "asc" && <input type="hidden" name="order" value={order} />}
          <label htmlFor="q">{t.links.find}</label>
          <Input
            id="q"
            name="q"
            defaultValue={address ? formatHadithRef(address) : query}
            placeholder={t.links.findPlaceholder}
            className="h-8 w-48"
          />
          <Button type="submit" size="sm" variant="outline">
            {t.links.findSubmit}
          </Button>
          {query && <Link href={href({ address: null })}>{t.links.findReset}</Link>}
        </form>
        {query && !address && <p className="text-sm text-destructive">{t.links.findInvalid}</p>}
      </div>

      {list.pairs.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t.links.empty}</p>
      ) : (
        <>
          {pager}
          <ul className="flex flex-col gap-4">
            {list.pairs.map((pair) => (
              <PairCard key={pair.id} pair={pair} />
            ))}
          </ul>
          {pager}
        </>
      )}
    </>
  );
}

// Paragraphs of the source with the words the other text shares marked.
function MarkedText({ side, other }: { side: PairSide; other: PairSide }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Link href={side.href} className="text-sm font-medium">
        {side.label}
      </Link>
      <div lang="ar" dir="rtl">
        {side.text.split(/\n\s*\n/).map((paragraph, i) => (
          <p key={i} className="ar text-lg leading-[2]">
            {markShared(paragraph, other.text).map((piece, k) =>
              piece.shared ? (
                <mark key={k} className="rounded-sm bg-highlight text-inherit">
                  {piece.text}
                </mark>
              ) : (
                piece.text
              ),
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

function PairCard({ pair }: { pair: ReviewPair }) {
  return (
    <li className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">
          {pair.first.label} ↔ {pair.second.label}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {t.links.share} {Math.round(pair.share * 100)}%
        </span>
        {pair.status !== "unchecked" && (
          <Badge variant={pair.status === "same" ? "default" : "outline"}>{t.links.statuses[pair.status]}</Badge>
        )}
      </div>
      {pair.status !== "unchecked" && pair.actor && pair.reviewedAt && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t.links.reviewed
            .replace("{actor}", pair.actor)
            .replace(
              "{date}",
              new Date(pair.reviewedAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }),
            )}
          {pair.note && ` · ${pair.note}`}
        </p>
      )}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <MarkedText side={pair.first} other={pair.second} />
        <MarkedText side={pair.second} other={pair.first} />
      </div>
      <form action={reviewPairAction} className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        <input type="hidden" name="id" value={pair.id} />
        <Input
          name="note"
          maxLength={1000}
          aria-label={t.links.note}
          placeholder={t.links.notePlaceholder}
          className="h-8 min-w-48 flex-1"
        />
        <Button type="submit" name="verdict" value="same" size="sm">
          {t.links.same}
        </Button>
        <Button type="submit" name="verdict" value="different" size="sm" variant="outline">
          {t.links.different}
        </Button>
        {pair.status !== "unchecked" && (
          <Button type="submit" name="verdict" value="cleared" size="sm" variant="ghost">
            {t.links.clear}
          </Button>
        )}
      </form>
    </li>
  );
}
