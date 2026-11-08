import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { hadithPath, refLabel, schemeOf } from "@/shared/addresses/hadith-query";
import type { GraphData } from "@/shared/graph/graph.types";
import { HADITH_TAG } from "../hadith.constants";
import { shortTitle } from "../hadith.format";
import { pickSimilar, similarGraph, type SimilarLink } from "../hadith.similar-graph";
import { PATH } from "./hadith.sql";

// Links of the given texts, both directions, without the pairs a person
// marked "not the same hadith"; confirmed pairs are flagged.
const LINKS = `
  WITH pairs AS (
    SELECT l.id, l.a, l.b, l.share FROM hadith_links l
    WHERE l.a = ANY($1::extensions.ltree[]) OR l.b = ANY($1::extensions.ltree[])
  ),
  verdicts AS (
    SELECT DISTINCT ON (r.link_id) r.link_id, r.verdict FROM hadith_link_reviews r
    WHERE r.link_id IN (SELECT id FROM pairs) ORDER BY r.link_id, r.id DESC
  )
  SELECT p.a::text AS a, p.b::text AS b, p.share::float AS share, coalesce(v.verdict = 'same', false) AS checked
  FROM pairs p LEFT JOIN verdicts v ON v.link_id = p.id
  WHERE v.verdict IS DISTINCT FROM 'different'
  ORDER BY p.share DESC, p.a, p.b`;

async function linksOf(addresses: string[]): Promise<SimilarLink[]> {
  if (addresses.length === 0) return [];
  return (await db().query<SimilarLink>(LINKS, [addresses])).rows;
}

// The graph of similar texts around a hadith (null if it has none).
export async function similarNetwork(address: string): Promise<GraphData | null> {
  "use cache";
  cacheTag(HADITH_TAG);
  cacheLife("days");
  const other = (from: string[]) => (l: SimilarLink) => {
    const inA = from.includes(l.a);
    return inA === from.includes(l.b) ? [] : [{ other: inA ? l.b : l.a, share: l.share }];
  };
  const first = (await linksOf([address])).flatMap(other([address]));
  if (first.length === 0) return null;
  // The closest texts, then the closest texts of those.
  const near = pickSimilar(address, first, []);
  const second = (await linksOf(near.slice(1))).flatMap(other(near));
  const chosen = pickSimilar(address, first, second);

  // Links among the chosen texts only.
  const set = new Set(chosen);
  const links = (await linksOf(chosen)).filter((l) => set.has(l.a) && set.has(l.b));
  const { rows } = await db().query<{
    address: string;
    work: string;
    title: string;
    short: string | null;
    path: number[];
    variants: number;
  }>(
    `SELECT o.address::text, w.id AS work, w.titles->>'ru' AS title, w.titles->>'ru-short' AS short,
            ${PATH("o.address")} AS path,
            CASE WHEN o.level = 'narration' THEN (
              SELECT count(*)::int FROM addresses n
              WHERE n.address <@ subpath(o.address, 0, 2) AND n.level = 'narration'
            ) ELSE 1 END AS variants
     FROM addresses o JOIN works w ON w.id = o.work_id
     WHERE o.address = ANY($1::extensions.ltree[])`,
    [chosen],
  );
  const byAddress = new Map(rows.map((r) => [r.address, r]));
  const texts = chosen.flatMap((a) => {
    const r = byAddress.get(a);
    if (!r) return [];
    return [
      {
        address: a,
        work: r.work,
        label: `${shortTitle(r.title, r.short)} ${refLabel(schemeOf(r.work), r.path, r.variants)}`,
        href: hadithPath(r.work, r.path),
      },
    ];
  });
  return similarGraph(address, texts, links);
}
