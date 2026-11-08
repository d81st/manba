import "server-only";
import { bookScheme } from "@/lib/book-query";

// "Ибн Касир 2:64" names an ayah that the comment 2:63 covers: such
// references become the comment's address. Others are left as they are.
export async function resolveBookRefs(
  client: { query: (sql: string, params: unknown[]) => Promise<{ rows: { a: string; to: string }[] }> },
  addresses: string[],
): Promise<string[]> {
  const ayahRefs = addresses.filter((a) => {
    const [work, ...path] = a.split(".");
    return bookScheme(work) === "ayah" && path.length === 2 && Number(path[0]) > 0 && Number(path[1]) > 0;
  });
  if (ayahRefs.length === 0) return addresses;
  const { rows } = await client.query(
    `SELECT r.a, (
       SELECT c.comment::text FROM commentary_ayahs c JOIN addresses k ON k.address = c.comment
       WHERE c.comment <@ subpath(r.a::extensions.ltree, 0, 1)
         AND c.ayah = ('quran.' || subpath(r.a::extensions.ltree, 1)::text)::extensions.ltree
       ORDER BY k.ordinal LIMIT 1
     ) AS to
     FROM unnest($1::text[]) AS r(a)
     WHERE NOT EXISTS (SELECT 1 FROM addresses x WHERE x.address = r.a::extensions.ltree)`,
    [ayahRefs],
  );
  const map = new Map(rows.filter((r) => r.to).map((r) => [r.a, r.to]));
  return [...new Set(addresses.map((a) => map.get(a) ?? a))];
}
