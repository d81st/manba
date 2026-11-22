import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GLOSSARY_TAG } from "@/modules/glossary";
import { db } from "@/shared/db";
import { TOPICS_TAG } from "../topic.constants";
import { LOCALE } from "./topic.sql";

// Links of published topics with each other and with published glossary terms,
// by permanent ids (slugs), for the knowledge map.
export async function listTopicLinks(): Promise<{
  related: { a: string; b: string }[];
  terms: { topic: string; term: string }[];
}> {
  "use cache";
  cacheTag(TOPICS_TAG, GLOSSARY_TAG);
  cacheLife("hours");
  const related = await db().query<{ a: string; b: string }>(
    `SELECT DISTINCT LEAST(t1.slug, t2.slug) AS a, GREATEST(t1.slug, t2.slug) AS b
     FROM topic_relations r
     JOIN topics t1 ON t1.id = r.topic_id AND t1.status = 'published'
     JOIN topics t2 ON t2.id = r.related_id AND t2.status = 'published'`,
  );
  const terms = await db().query<{ topic: string; term: string }>(
    `SELECT t.slug AS topic, m.slug AS term
     FROM topic_terms r
     JOIN topics t ON t.id = r.topic_id AND t.status = 'published'
     JOIN terms m ON m.id = r.term_id AND m.status = 'published'`,
  );
  return { related: related.rows, terms: terms.rows };
}

// Topics about an event of the Prophet's life (topic_sira_events), by title.
export async function listTopicsForEvent(eventId: number, drafts: boolean): Promise<{ slug: string; title: string; published: boolean }[]> {
  const statuses = drafts ? ["draft", "review", "published"] : ["published"];
  const { rows } = await db().query<{ slug: string; title: string; published: boolean }>(
    `SELECT t.slug, coalesce(x.title, t.slug) AS title, t.status = 'published' AS published
     FROM topic_sira_events ts
     JOIN topics t ON t.id = ts.topic_id AND t.status = ANY ($2)
     LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = $3
     WHERE ts.event_id = $1 ORDER BY title`,
    [eventId, statuses, LOCALE],
  );
  return rows;
}

// The events a topic is linked to, and every event the admin may choose.
export async function listEventLinksForEdit(topicId: number): Promise<{ linked: number[]; events: { id: number; title: string; status: string }[] }> {
  const [linked, events] = await Promise.all([
    db().query<{ id: number }>("SELECT event_id::int AS id FROM topic_sira_events WHERE topic_id = $1", [topicId]),
    db().query<{ id: number; title: string; status: string }>(
      `SELECT e.id::int, coalesce(x.title, e.slug) AS title, e.status FROM sira_events e
       LEFT JOIN sira_event_texts x ON x.event_id = e.id AND x.locale = $1
       WHERE e.status <> 'retired' ORDER BY e.position, e.id`,
      [LOCALE],
    ),
  ]);
  return { linked: linked.rows.map((r) => r.id), events: events.rows };
}

// The places a topic is linked to, and every place the admin may choose.
export async function listPlaceLinksForEdit(topicId: number): Promise<{ linked: number[]; places: { id: number; title: string; status: string }[] }> {
  const [linked, places] = await Promise.all([
    db().query<{ id: number }>("SELECT place_id::int AS id FROM topic_places WHERE topic_id = $1", [topicId]),
    db().query<{ id: number; title: string; status: string }>(
      `SELECT p.id::int, coalesce(x.name, p.slug) AS title,
              CASE WHEN p.lat IS NULL THEN 'nocoords' ELSE 'published' END AS status
       FROM places p LEFT JOIN place_texts x ON x.place_id = p.id AND x.locale = $1
       ORDER BY title`,
      [LOCALE],
    ),
  ]);
  return { linked: linked.rows.map((r) => r.id), places: places.rows };
}
