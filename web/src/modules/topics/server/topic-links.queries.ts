import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GLOSSARY_TAG } from "@/modules/glossary";
import { db } from "@/shared/db";
import { TOPICS_TAG } from "../topic.constants";

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
