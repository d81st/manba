import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import type { MapSura, SuraSummary } from "../quran.types";

export async function getMapData(): Promise<MapSura[]> {
  "use cache";
  cacheTag("quran");
  cacheLife("hours");

  const suras = await db().query<{
    number: number;
    names: SuraSummary["names"];
    place: string | null;
    order: string | null;
  }>(
    `SELECT split_part(a.address::text, '.', 2)::int AS number, a.names,
            (SELECT value FROM classifications c WHERE c.address = a.address
               AND c.kind = 'revelation_place' AND c.recognition = 'tradition' LIMIT 1) AS place,
            (SELECT value FROM classifications c WHERE c.address = a.address
               AND c.kind = 'revelation_order' AND c.recognition = 'tradition' LIMIT 1) AS order
     FROM addresses a
     WHERE a.work_id = 'quran' AND a.level = 'sura' AND a.status = 'active'
     ORDER BY 1`,
  );
  const ayahs = await db().query<{ sura: number; ordinal: number; words: number }>(
    `SELECT split_part(a.address::text, '.', 2)::int AS sura, a.ordinal,
            coalesce(array_length(string_to_array(nullif(t.search_plain, ''), ' '), 1), 0) AS words
     FROM addresses a
     JOIN texts t ON t.address = a.address
     JOIN text_versions v ON v.id = t.version_id
     WHERE a.work_id = 'quran' AND a.level = 'ayah' AND a.status = 'active'
       AND v.work_id = 'quran' AND v.language = 'ar' AND v.is_primary AND v.status = 'published'
     ORDER BY a.ordinal`,
  );
  const juzStarts = await db().query<{ number: number; ordinal: number }>(
    `SELECT d.number, a.ordinal FROM divisions d JOIN addresses a ON a.address = d.starts_at
     WHERE d.work_id = 'quran' AND d.scheme = 'juz' ORDER BY a.ordinal`,
  );

  const byNumber = new Map<number, MapSura>(
    suras.rows.map((row) => [
      row.number,
      {
        number: row.number,
        name: row.names.translit,
        ar: row.names.ar,
        place: row.place,
        order: row.order ? Number(row.order) : null,
        words: [],
        juz: [],
      },
    ]),
  );
  let juzIndex = -1;
  for (const ayah of ayahs.rows) {
    while (juzIndex + 1 < juzStarts.rows.length && juzStarts.rows[juzIndex + 1].ordinal <= ayah.ordinal) {
      juzIndex += 1;
    }
    const sura = byNumber.get(ayah.sura);
    if (!sura) continue;
    sura.words.push(ayah.words);
    sura.juz.push(juzStarts.rows[juzIndex]?.number ?? 0);
  }
  return [...byNumber.values()];
}
