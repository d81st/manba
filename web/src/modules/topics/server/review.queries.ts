import "server-only";
import { db } from "@/shared/db";
import { parseRefs } from "@/shared/addresses/refs";
import { arabicQuotes } from "@/shared/content/quote-match";
import type { TopicForEdit } from "../topic.types";
import { hasOutsideSource } from "../topic.validation";
import { reviewItems, reviewProgress, reviewState, type ReviewCheck, type ReviewItem, type ReviewProgress, type ReviewState } from "../topic.review";
import { getTopicForEdit } from "./topic.queries";
import { fragmentHref, fragmentLabel, quoteLinks } from "./topic-page.queries";
import { LOCALE, SUMMARY } from "./topic.sql";

// «Что проверить»: the drafts waiting for a check and the checklist of one topic.

export type ReviewRef = { label: string; href: string };
export type ReviewQuote = { quote: string; href: string | null };
export type ReviewEntry = ReviewItem & {
  state: ReviewState;
  check: ReviewCheck | null;
  // What the item shows: the text and its note (a position's source note, the circumstances' note).
  text: string;
  note: string;
  side: string;
  recognition: string;
  refGroups: { role: "main" | "circumstances" | "related" | "position"; refs: ReviewRef[] }[];
  // Each Arabic quotation of the text and the fragment it stands in (null — found nowhere).
  quotes: ReviewQuote[];
};

export type TopicReview = {
  id: number;
  slug: string;
  title: string;
  question: string;
  category: string;
  status: string;
  missing: string;
  // What a published topic must have (topic.validation.ts).
  ready: { main: boolean; circumstances: boolean; positions: boolean };
  entries: ReviewEntry[];
  progress: ReviewProgress;
};

export type ReviewQueueRow = { id: number; slug: string; title: string; category: string; status: string; updatedAt: string; progress: ReviewProgress };

const REVIEW_STATUSES = ["draft", "review"];

async function checksOf(topicIds: number[]): Promise<Map<number, ReviewCheck[]>> {
  const { rows } = await db().query<ReviewCheck & { topicId: number }>(
    `SELECT topic_id::int AS "topicId", item, fingerprint, checked, note, actor, updated_at::text AS "updatedAt"
     FROM topic_review_checks WHERE topic_id = ANY($1::bigint[])`,
    [topicIds],
  );
  const map = new Map<number, ReviewCheck[]>();
  for (const { topicId, ...check } of rows) map.set(topicId, [...(map.get(topicId) ?? []), check]);
  return map;
}

export async function listReviewQueue(): Promise<ReviewQueueRow[]> {
  const { rows } = await db().query<{ id: number; slug: string; title: string; category: string; status: string; updatedAt: string }>(
    `${SUMMARY} WHERE t.status = ANY($1::text[]) ORDER BY t.status DESC, t.updated_at DESC`,
    [REVIEW_STATUSES],
  );
  const topics = await Promise.all(rows.map((r) => getTopicForEdit(r.id)));
  const checks = await checksOf(rows.map((r) => r.id));
  return rows.map((r, i) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    status: r.status,
    updatedAt: r.updatedAt,
    progress: topics[i] ? reviewProgress(reviewItems(topics[i]), checks.get(r.id) ?? []) : { total: 0, checked: 0, changed: 0, notes: 0 },
  }));
}

const refsOf = (text: string): ReviewRef[] =>
  parseRefs(text).addresses.map((address) => ({ label: fragmentLabel(address), href: fragmentHref(address) }));

export async function getTopicReview(id: number): Promise<TopicReview | null> {
  const topic: TopicForEdit | null = await getTopicForEdit(id);
  if (!topic) return null;
  const sides = await db().query<{ id: number; title: string }>(
    "SELECT side_id::int AS id, title FROM position_side_texts WHERE locale = $1",
    [LOCALE],
  );
  const sideTitle = new Map(sides.rows.map((s) => [s.id, s.title]));
  const checks = new Map(((await checksOf([id])).get(id) ?? []).map((c) => [c.item, c]));
  const items = reviewItems(topic);
  const topicAddresses = [topic.mainRefs, topic.circumstancesRefs, topic.relatedRefs].flatMap((r) => parseRefs(r).addresses);

  const bodies = items.map((item) => {
    if (item.kind === "question") return { text: `${topic.title}\n\n${topic.question}`, note: "", addresses: [] as string[] };
    if (item.kind === "texts") return { text: "", note: "", addresses: [] };
    if (item.kind === "circumstances") return { text: topic.circumstances, note: topic.circumstancesNote, addresses: topicAddresses };
    const p = topic.positions.find((x) => x.holder === item.holder)!;
    return { text: p.text, note: p.sourceNote, addresses: parseRefs(p.refs).addresses };
  });
  const links = await quoteLinks(bodies.map((b) => ({ text: b.text, addresses: b.addresses })));

  const entries: ReviewEntry[] = items.map((item, i) => {
    const check = checks.get(item.key) ?? null;
    const p = item.kind === "position" ? topic.positions.find((x) => x.holder === item.holder)! : null;
    const refGroups: ReviewEntry["refGroups"] =
      item.kind === "texts"
        ? (
            [
              ["main", topic.mainRefs],
              ["circumstances", topic.circumstancesRefs],
              ["related", topic.relatedRefs],
            ] as const
          ).map(([role, text]) => ({ role, refs: refsOf(text) }))
        : p
          ? [{ role: "position", refs: refsOf(p.refs) }]
          : [];
    return {
      ...item,
      state: reviewState(item, check ?? undefined),
      check,
      text: bodies[i].text,
      note: bodies[i].note,
      side: p ? (sideTitle.get(p.sideId) ?? "") : "",
      recognition: p?.recognition ?? "",
      refGroups,
      quotes: arabicQuotes(bodies[i].text).map((quote) => ({ quote, href: links[i][quote] ?? null })),
    };
  });

  return {
    id,
    slug: topic.slug,
    title: topic.title,
    question: topic.question,
    category: topic.category,
    status: topic.status,
    missing: topic.circumstancesNote,
    ready: {
      main: parseRefs(topic.mainRefs).addresses.length > 0 || hasOutsideSource(topic.circumstancesNote),
      circumstances: topic.circumstances.trim() !== "",
      positions: topic.positions.length > 0,
    },
    entries,
    progress: reviewProgress(items, [...checks.values()]),
  };
}
