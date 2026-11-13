import "server-only";
import { bookLabel, bookPath, isBook } from "@/shared/addresses/book-query";
import { db } from "@/shared/db";
import { hadithPath, refLabel, schemeOf } from "@/shared/addresses/hadith-query";
import { shortTitle } from "../hadith.format";
import type { HadithRef } from "../hadith.types";
import { PATH } from "./hadith.sql";

const REF_ITEMS = 10;

export async function getHadithRefs(addresses: string[]): Promise<Map<string, HadithRef>> {
  const refs = new Map<string, HadithRef>();
  if (addresses.length === 0) return refs;
  const { rows } = await db().query<{
    ref: string;
    title: string;
    short: string | null;
    path: number[];
    variants: number;
    text: string;
    total: number;
    last_ayah: number | null;
  }>(
    // One lookup per reference: joined as a whole, the planner scanned every
    // hadith text (seconds for a topic with a hundred references).
    `SELECT r.ref, w.titles->>'ru' AS title, w.titles->>'ru-short' AS short,
            ${PATH("x.address")} AS path, x.content AS text, x.total,
            CASE x.level
              WHEN 'narration' THEN (
                SELECT count(*)::int FROM addresses n
                WHERE n.address <@ subpath(x.address, 0, 2) AND n.level = 'narration'
              )
              WHEN 'passage' THEN (
                SELECT count(*)::int FROM addresses n
                WHERE n.address <@ subpath(x.address, 0, 3) AND n.level = 'passage'
              )
              ELSE 1
            END AS variants,
            (SELECT max(split_part(c.ayah::text, '.', 3)::int) FROM commentary_ayahs c
             WHERE c.comment = x.address) AS last_ayah
     FROM unnest($1::text[]) AS r(ref)
     CROSS JOIN LATERAL (
       SELECT a.address, a.level, a.ordinal, t.content, v.work_id, count(*) OVER ()::int AS total
       -- The addresses under the reference first (tree index), then their
       -- texts. OFFSET 0 keeps that order: otherwise the planner, guessing one
       -- primary version, read every text of every version for each reference
       -- (about a minute for a topic with a hundred and forty references).
       FROM (SELECT address, level, ordinal FROM addresses WHERE address <@ r.ref::extensions.ltree OFFSET 0) a
       JOIN texts t ON t.address = a.address
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.language = 'ar'
       WHERE a.address <@ r.ref::extensions.ltree
       ORDER BY a.ordinal LIMIT ${REF_ITEMS}
     ) x
     -- Every book of the library except the Quran (its ayahs are read apart)
     -- and the texts of other religions: a new section of the library (the law,
     -- 13.11.2026) must not drop out of the references.
     JOIN works w ON w.id = x.work_id AND w.category <> 'quran' AND w.canon <> 'external'
     ORDER BY r.ref, x.ordinal`,
    [addresses],
  );
  for (const row of rows) {
    const [work, ...rest] = row.ref.split(".");
    const scheme = schemeOf(work);
    // Books cited by volume and page (the Sira) have their own labels and pages.
    const label = (path: number[], variants?: number) =>
      isBook(work) ? bookLabel(work, path, variants) : refLabel(scheme, path, variants);
    let ref = refs.get(row.ref);
    if (!ref) {
      const path = rest.map(Number);
      ref = {
        address: row.ref,
        // A reference to one text knows how many share its number or page.
        // A tafsir comment on several ayahs: "Ибн Касир 2:63–64".
        title: `${shortTitle(row.title, row.short)} ${label(path, row.total === 1 && row.path.length === path.length ? row.variants : undefined)}${
          row.last_ayah && row.total === 1 && row.last_ayah > (path[1] ?? 0) ? `–${row.last_ayah}` : ""
        }`,
        href: isBook(work) ? bookPath(work, path) : hadithPath(work, path),
        items: [],
        more: row.total - Math.min(row.total, REF_ITEMS),
      };
      refs.set(row.ref, ref);
    }
    const several = row.total > 1;
    ref.items.push({ label: several ? label(row.path, row.variants) : "", text: row.text });
  }
  return refs;
}
