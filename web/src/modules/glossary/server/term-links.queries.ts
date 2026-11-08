import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { GLOSSARY_TAG } from "../term.constants";
import type { RelationKind } from "../term.types";

// Links between published terms (each pair once), by permanent ids, for the knowledge map.
export async function listTermLinks(): Promise<{ a: string; b: string; kind: RelationKind }[]> {
  "use cache";
  cacheTag(GLOSSARY_TAG);
  cacheLife("hours");
  const { rows } = await db().query<{ a: string; b: string; kind: RelationKind }>(
    `SELECT t1.slug AS a, t2.slug AS b, r.kind
     FROM term_relations r
     JOIN terms t1 ON t1.id = r.term_id AND t1.status = 'published'
     JOIN terms t2 ON t2.id = r.related_id AND t2.status = 'published'
     WHERE t1.slug < t2.slug`,
  );
  return rows;
}
