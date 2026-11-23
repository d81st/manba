import "server-only";
import type pg from "pg";

// A date cites one page. Pulling every text under a work root (the whole
// Quran, a whole tafsir) would hold a database connection and a large string.
// More passages than this means the address is the book, not the page.
export const QUOTE_TEXT_LIMIT = 200;

export type Passage = "missing" | "wide" | { text: string };

export async function passageForQuote(client: pg.PoolClient, address: string): Promise<Passage> {
  const { rows } = await client.query<{ known: boolean; n: number; text: string | null }>(
    `WITH scope AS (
       SELECT t.address, t.content
       FROM addresses a
       -- Descendants through addresses, whose GiST index serves <@ (texts has none).
       JOIN texts t ON t.address = a.address
       WHERE a.address <@ $1::extensions.ltree
       ORDER BY t.address
       LIMIT $2
     )
     SELECT EXISTS (SELECT 1 FROM addresses WHERE address = $1::extensions.ltree) AS known,
            (SELECT count(*)::int FROM scope) AS n,
            (SELECT string_agg(content, ' ' ORDER BY address) FROM scope) AS text`,
    [address, QUOTE_TEXT_LIMIT + 1],
  );
  const row = rows[0];
  if (!row?.known) return "missing";
  if (row.n > QUOTE_TEXT_LIMIT) return "wide";
  return { text: row.text ?? "" };
}
