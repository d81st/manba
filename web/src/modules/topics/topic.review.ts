// «Что проверить»: the items of a topic the administrator and the specialist
// check before it is published, and the state of each. Pure functions, no
// database, so everything is unit-tested. An item is identified by a stable
// key (a position by its holder, which survives the topic form saving its
// positions anew); a check stores a fingerprint of what was checked, so an
// item edited after its check shows as changed.
import { createHash } from "node:crypto";
import type { TopicInput } from "./topic.validation";

export type ReviewKind = "question" | "texts" | "circumstances" | "position";

export type ReviewItem = {
  key: string;
  kind: ReviewKind;
  // A position's holder; empty for the other kinds.
  holder: string;
  fingerprint: string;
};

export type ReviewCheck = { item: string; fingerprint: string; checked: boolean; note: string; actor: string; updatedAt: string };

export type ReviewState = "open" | "checked" | "changed";

type ReviewTopic = Pick<
  TopicInput,
  "category" | "title" | "question" | "mainRefs" | "circumstances" | "circumstancesNote" | "circumstancesRefs" | "relatedRefs" | "positions"
>;

export const POSITION_ITEM = "position:";

function fingerprint(parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);
}

export function reviewItems(topic: ReviewTopic): ReviewItem[] {
  const items: ReviewItem[] = [
    { key: "question", kind: "question", holder: "", fingerprint: fingerprint([topic.category, topic.title, topic.question]) },
    { key: "texts", kind: "texts", holder: "", fingerprint: fingerprint([topic.mainRefs, topic.circumstancesRefs, topic.relatedRefs]) },
    {
      key: "circumstances",
      kind: "circumstances",
      holder: "",
      fingerprint: fingerprint([topic.circumstances, topic.circumstancesNote]),
    },
  ];
  const seen = new Set<string>();
  for (const p of topic.positions) {
    // Two positions with one holder would share a key; the second is checked with the first.
    if (seen.has(p.holder)) continue;
    seen.add(p.holder);
    items.push({
      key: POSITION_ITEM + p.holder,
      kind: "position",
      holder: p.holder,
      fingerprint: fingerprint([p.sideId, p.holder, p.recognition, p.text, p.sourceNote, p.refs]),
    });
  }
  return items;
}

export function reviewState(item: ReviewItem, check: ReviewCheck | undefined): ReviewState {
  if (!check?.checked) return "open";
  return check.fingerprint === item.fingerprint ? "checked" : "changed";
}

export type ReviewProgress = { total: number; checked: number; changed: number; notes: number };

export function reviewProgress(items: ReviewItem[], checks: ReviewCheck[]): ReviewProgress {
  const byItem = new Map(checks.map((c) => [c.item, c]));
  const progress: ReviewProgress = { total: items.length, checked: 0, changed: 0, notes: 0 };
  for (const item of items) {
    const check = byItem.get(item.key);
    const state = reviewState(item, check);
    if (state === "checked") progress.checked++;
    if (state === "changed") progress.changed++;
    if (check?.note) progress.notes++;
  }
  return progress;
}
