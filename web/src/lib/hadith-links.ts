import "server-only";
import { db } from "@/lib/db";
import { shortTitle } from "@/lib/hadith";
import { COLLECTION_ORDER, hadithPath, refLabel, schemeOf } from "@/lib/hadith-query";

// Pairs of similar texts (hadith_links) and a person's verdict on them
// (hadith_link_reviews, only added: the latest row is the current verdict).

export const VERDICTS = ["same", "different", "cleared"] as const;
export type Verdict = (typeof VERDICTS)[number];
export const REVIEW_STATUSES = ["unchecked", "same", "different", "all"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export const REVIEW_PAGE_SIZE = 20;

// The current verdict of every reviewed pair; "cleared" means unchecked again.
export const CURRENT_VERDICTS = `
  SELECT DISTINCT ON (link_id) link_id, verdict, note, actor, created_at
  FROM hadith_link_reviews ORDER BY link_id, id DESC`;

export type PairSide = { address: string; label: string; href: string; text: string };
export type ReviewPair = {
  id: number;
  share: number;
  status: Exclude<ReviewStatus, "all">;
  note: string;
  actor: string | null;
  reviewedAt: string | null;
  first: PairSide;
  second: PairSide;
};
export type ReviewList = {
  counts: Record<ReviewStatus, number>;
  total: number; // pairs with the chosen status
  page: number;
  pages: number;
  pairs: ReviewPair[];
};
export type ReviewFilter = {
  status: ReviewStatus;
  work: string | null; // one side in this collection
  address: string | null; // one side at or under this address
  order: "asc" | "desc"; // by share
  page: number;
};

// Name, link and text of each address (primary published version).
async function describe(addresses: string[]): Promise<Map<string, PairSide>> {
  const { rows } = await db().query<{
    address: string;
    work: string;
    title: string;
    short: string | null;
    path: number[];
    variants: number;
    text: string;
  }>(
    `SELECT a.address::text, w.id AS work, w.titles->>'ru' AS title, w.titles->>'ru-short' AS short,
            string_to_array(subpath(a.address, 1)::text, '.')::int[] AS path, t.content AS text,
            CASE WHEN a.level = 'narration' THEN (
              SELECT count(*)::int FROM addresses n
              WHERE n.address <@ subpath(a.address, 0, 2) AND n.level = 'narration'
            ) ELSE 1 END AS variants
     FROM unnest($1::text[]) AS x(address)
     JOIN addresses a ON a.address = x.address::extensions.ltree
     JOIN works w ON w.id = a.work_id
     JOIN texts t ON t.address = a.address
     JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'`,
    [addresses],
  );
  return new Map(
    rows.map((r) => [
      r.address,
      {
        address: r.address,
        label: `${shortTitle(r.title, r.short)} ${refLabel(schemeOf(r.work), r.path, r.variants)}`,
        href: hadithPath(r.work, r.path),
        text: r.text,
      },
    ]),
  );
}

export async function listPairsForReview(filter: ReviewFilter): Promise<ReviewList> {
  const pairs = `
    WITH current AS (${CURRENT_VERDICTS}),
    pairs AS (
      SELECT l.id, l.a, l.b, l.share,
             coalesce(nullif(c.verdict, 'cleared'), 'unchecked') AS status,
             coalesce(c.note, '') AS note, c.actor, c.created_at
      FROM hadith_links l LEFT JOIN current c ON c.link_id = l.id
      WHERE ($1::text IS NULL OR subpath(l.a, 0, 1)::text = $1 OR subpath(l.b, 0, 1)::text = $1)
        AND ($2::text IS NULL OR l.a <@ $2::extensions.ltree OR l.b <@ $2::extensions.ltree)
    )`;
  const params = [filter.work, filter.address];
  const counted = await db().query<{ status: string; n: number }>(
    `${pairs} SELECT status, count(*)::int AS n FROM pairs GROUP BY status`,
    params,
  );
  const counts = { unchecked: 0, same: 0, different: 0, all: 0 } as Record<ReviewStatus, number>;
  for (const row of counted.rows) {
    counts[row.status as ReviewStatus] = row.n;
    counts.all += row.n;
  }
  const total = counts[filter.status];
  const pages = Math.max(1, Math.ceil(total / REVIEW_PAGE_SIZE));
  const page = Math.min(Math.max(1, filter.page), pages);
  const { rows } = await db().query<{
    id: number;
    a: string;
    b: string;
    share: string;
    status: ReviewPair["status"];
    note: string;
    actor: string | null;
    created_at: string | null;
  }>(
    `${pairs}
     SELECT id::int, a::text, b::text, share::text, status, note, actor, created_at::text FROM pairs
     WHERE $3::text = 'all' OR status = $3
     ORDER BY share ${filter.order === "asc" ? "ASC" : "DESC"}, id
     LIMIT $4 OFFSET $5`,
    [...params, filter.status, REVIEW_PAGE_SIZE, (page - 1) * REVIEW_PAGE_SIZE],
  );
  const sides = await describe(rows.flatMap((r) => [r.a, r.b]));
  // The side the filter asks about comes first; otherwise the collections' order.
  const firstOf = (a: string, b: string) => {
    const work = (x: string) => x.split(".")[0];
    if (filter.address) return a === filter.address || a.startsWith(`${filter.address}.`) ? a : b;
    if (filter.work) return work(a) === filter.work ? a : b;
    return COLLECTION_ORDER.indexOf(work(a)) <= COLLECTION_ORDER.indexOf(work(b)) ? a : b;
  };
  return {
    counts,
    total,
    page,
    pages,
    pairs: rows.flatMap((r) => {
      const first = firstOf(r.a, r.b);
      const one = sides.get(first);
      const two = sides.get(first === r.a ? r.b : r.a);
      if (!one || !two) return [];
      return [
        {
          id: r.id,
          share: Number(r.share),
          status: r.status,
          note: r.note,
          actor: r.actor,
          reviewedAt: r.created_at,
          first: one,
          second: two,
        },
      ];
    }),
  };
}

// Records a verdict on a pair, with a journal entry. False when the pair does not exist.
export async function reviewPair(id: number, verdict: Verdict, note: string, actor: string): Promise<boolean> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const link = await client.query<{ a: string; b: string; verdict: string | null }>(
      `SELECT l.a::text, l.b::text,
              (SELECT verdict FROM hadith_link_reviews r WHERE r.link_id = l.id ORDER BY r.id DESC LIMIT 1) AS verdict
       FROM hadith_links l WHERE l.id = $1 FOR UPDATE OF l`,
      [id],
    );
    const pair = link.rows[0];
    if (!pair) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      "INSERT INTO hadith_link_reviews (link_id, verdict, note, actor) VALUES ($1, $2, $3, $4)",
      [id, verdict, note, actor],
    );
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('hadith_link', $1, 'reviewed', $2, $3, $4, $5)`,
      [
        String(id),
        JSON.stringify({ verdict: pair.verdict }),
        JSON.stringify({ a: pair.a, b: pair.b, verdict }),
        note,
        actor,
      ],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
