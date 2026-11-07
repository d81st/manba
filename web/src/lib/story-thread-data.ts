import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { inTextOrder, storyPattern, type Story } from "@/lib/story-threads";

// The ayahs of a story thread (lib/story-threads.ts) and the published
// parallels from «Истоки и связи» that touch them.
export async function storyThread(story: Story): Promise<{ addresses: string[]; parallels: { slug: string; title: string }[] }> {
  "use cache";
  cacheTag("story-threads");
  cacheLife("days");
  const ayahs = await db().query<{ a: string }>(
    `SELECT subpath(address, 1)::text AS a FROM texts
     WHERE version_id = 'quran.ar.hafs-simple' AND search_plain ~ $1`,
    [storyPattern(story)],
  );
  const addresses = inTextOrder(ayahs.rows.map((r) => r.a.replace(".", ":")));
  const parallels = await db().query<{ slug: string; title: string }>(
    `SELECT DISTINCT p.slug, x.title FROM parallels p
     JOIN parallel_texts x ON x.parallel_id = p.id AND x.locale = 'ru'
     JOIN parallel_refs r ON r.parallel_id = p.id AND r.role = 'islam'
     WHERE p.status = 'published' AND r.address::text = ANY($1::text[])
     ORDER BY x.title`,
    [addresses.map((a) => `quran.${a.replace(":", ".")}`)],
  );
  return { addresses, parallels: parallels.rows };
}
