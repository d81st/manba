import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { TOPICS_TAG } from "../topic.constants";
import type { TopicForEdit, TopicSummary } from "../topic.types";
import { LOCALE, SUMMARY, type RefRole } from "./topic.sql";
import { formatRefs } from "@/shared/addresses/refs";

// Lists and the edit form; the public page of one topic is in topic-page.queries.ts.

export async function listTopicsForAdmin(status?: string, category?: string): Promise<TopicSummary[]> {
  const { rows } = await db().query<TopicSummary>(
    `${SUMMARY} WHERE ($1::text IS NULL OR t.status = $1) AND ($2::text IS NULL OR t.category = $2)
     ORDER BY t.updated_at DESC`,
    [status ?? null, category ?? null],
  );
  return rows;
}

export async function getTopicForEdit(id: number): Promise<TopicForEdit | null> {
  const topic = await db().query(
    `SELECT t.*, x.title, x.question, x.circumstances, x.circumstances_note,
            (SELECT slug FROM places WHERE id = t.place_id) AS place_slug FROM topics t
     JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $2 WHERE t.id = $1`,
    [id, LOCALE],
  );
  const row = topic.rows[0];
  if (!row) return null;

  const refs = await db().query<{ role: RefRole; position_id: string | null; address: string }>(
    "SELECT role, position_id, address::text FROM topic_refs WHERE topic_id = $1 ORDER BY position",
    [id],
  );
  const positions = await db().query(
    `SELECT id, side_id::int, holder, recognition, text, source_note FROM topic_positions
     WHERE topic_id = $1 AND locale = $2 ORDER BY position`,
    [id, LOCALE],
  );
  const terms = await db().query<{ id: number }>("SELECT term_id::int AS id FROM topic_terms WHERE topic_id = $1", [id]);
  const related = await db().query<{ id: number }>(
    "SELECT related_id::int AS id FROM topic_relations WHERE topic_id = $1",
    [id],
  );
  const refsOf = (role: RefRole, positionId: string | null = null) =>
    formatRefs(refs.rows.filter((r) => r.role === role && r.position_id === positionId).map((r) => r.address));

  return {
    id,
    slug: row.slug,
    category: row.category,
    status: row.status,
    place: row.place_slug ?? "",
    title: row.title,
    question: row.question,
    mainRefs: refsOf("main"),
    circumstances: row.circumstances,
    circumstancesNote: row.circumstances_note,
    circumstancesRefs: refsOf("circumstances"),
    relatedRefs: refsOf("related"),
    positions: positions.rows.map((p) => ({
      sideId: p.side_id,
      holder: p.holder,
      recognition: p.recognition,
      text: p.text,
      sourceNote: p.source_note,
      refs: refsOf("position", String(p.id)),
    })),
    terms: terms.rows.map((r) => r.id),
    related: related.rows.map((r) => r.id),
    reason: "",
  };
}

// Topics to pick as related ones (any status, so drafts can be linked).
export async function listTopicChoices(): Promise<{ id: number; name: string }[]> {
  const { rows } = await db().query<{ id: number; name: string }>(
    `SELECT t.id::int, x.title AS name FROM topics t
     JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $1
     WHERE t.status <> 'retired' ORDER BY x.title`,
    [LOCALE],
  );
  return rows;
}

export async function listPublishedTopics(): Promise<TopicSummary[]> {
  "use cache";
  cacheTag(TOPICS_TAG);
  cacheLife("hours");
  const { rows } = await db().query<TopicSummary>(
    `${SUMMARY} WHERE t.status = 'published' ORDER BY lower(x.title)`,
  );
  return rows;
}
