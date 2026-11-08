import "server-only";
import { db } from "@/lib/db";
import type { Concept, GraphEdge, PageHit } from "../assistant.types";
import { like, LOCALE } from "./assistant.sql";

// Pages of the encyclopedia whose title (or question) has a word of the question.
export async function pages(concepts: Concept[], terms: { slug: string; title: string; index: number }[]): Promise<PageHit[]> {
  const found = new Map<string, PageHit>();
  const add = (hit: Omit<PageHit, "concepts">, i: number) => {
    const old = found.get(hit.href);
    if (old) {
      if (!old.concepts.includes(i)) old.concepts.push(i);
    } else found.set(hit.href, { ...hit, concepts: [i] });
  };
  for (const t of terms) add({ kind: "term", title: t.title, href: `/glossary/${t.slug}`, hint: "" }, t.index);
  await Promise.all(
    concepts.map(async (c, i) => {
      const stems = c.ru.filter((s) => s.length >= 3);
      if (stems.length === 0) return;
      const patterns = stems.map(like);
      const any = (column: string, from: number) => stems.map((_, k) => `${column} ILIKE $${from + k}`).join(" OR ");
      const [topics, history, sira, quiz] = await Promise.all([
        db().query<{ slug: string; title: string; question: string }>(
          `SELECT t.slug, x.title, x.question FROM topics t JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1
           WHERE t.status = 'published' AND (${any("x.title", 2)} OR ${any("x.question", 2)}) LIMIT 20`,
          [LOCALE, ...patterns],
        ),
        db().query<{ slug: string; title: string }>(
          `SELECT e.slug, x.title FROM history_events e JOIN history_event_texts x ON x.event_id = e.id AND x.locale = $1
           WHERE e.status = 'published' AND (${any("x.title", 2)}) LIMIT 20`,
          [LOCALE, ...patterns],
        ),
        db().query<{ slug: string; title: string }>(
          `SELECT e.slug, x.title FROM sira_events e JOIN sira_event_texts x ON x.event_id = e.id AND x.locale = $1
           WHERE e.status = 'published' AND (${any("x.title", 2)}) LIMIT 20`,
          [LOCALE, ...patterns],
        ),
        db().query<{ id: number; prompt: string }>(
          `SELECT q.id::int, x.prompt FROM quiz_questions q JOIN quiz_question_texts x ON x.question_id = q.id AND x.locale = $1
           WHERE q.status = 'published' AND (${any("x.prompt", 2)}) LIMIT 10`,
          [LOCALE, ...patterns],
        ),
      ]);
      for (const r of topics.rows) add({ kind: "topic", title: r.title, href: `/topics/${r.slug}`, hint: r.question }, i);
      for (const r of history.rows) add({ kind: "history", title: r.title, href: `/history#${r.slug}`, hint: "" }, i);
      for (const r of sira.rows) add({ kind: "sira", title: r.title, href: `/sira/events/${r.slug}`, hint: "" }, i);
      for (const r of quiz.rows) add({ kind: "quiz", title: r.prompt, href: `/tests#q-${r.id}`, hint: "" }, i);
    }),
  );
  const order = { term: 0, topic: 1, history: 2, sira: 3, quiz: 4 };
  return [...found.values()].sort((a, b) => b.concepts.length - a.concepts.length || order[a.kind] - order[b.kind]);
}

// Links between what was found: a term or a topic and the fragments it cites.
export async function edges(pageHits: PageHit[], addresses: string[]): Promise<GraphEdge[]> {
  if (addresses.length === 0) return [];
  const termSlugs = pageHits.filter((p) => p.kind === "term").map((p) => p.href.split("/").pop()!);
  const topicSlugs = pageHits.filter((p) => p.kind === "topic").map((p) => p.href.split("/").pop()!);
  const { rows } = await db().query<{ from: string; to: string }>(
    `SELECT DISTINCT 'term:' || m.slug AS from, r.address::text AS to FROM term_refs r JOIN terms m ON m.id = r.term_id
     WHERE m.slug = ANY ($1) AND r.address::text = ANY ($3)
     UNION
     SELECT DISTINCT 'topic:' || t.slug, r.address::text FROM topic_refs r JOIN topics t ON t.id = r.topic_id
     WHERE t.slug = ANY ($2) AND r.address::text = ANY ($3)`,
    [termSlugs, topicSlugs, addresses],
  );
  return rows;
}
