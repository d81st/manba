import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { EXTERNAL_WORKS, externalHref, externalLabel, formatExternalRefs } from "@/shared/addresses/external";
import { PARALLELS_TAG } from "../parallel.constants";
import { isOutside } from "../parallel.refs";
import type { PublicParallel, RefItem } from "../parallel.types";
import { LOCALE, SUMMARY, type SummaryRow, toSummary } from "./parallel.sql";
import { getHadithRefs } from "@/modules/hadith/server";
import type { HadithRef } from "@/modules/hadith";

export async function getParallel(slug: string, drafts: boolean): Promise<PublicParallel | null> {
  "use cache";
  cacheTag(PARALLELS_TAG);
  cacheLife("hours");
  const statuses = drafts ? ["draft", "review", "published"] : ["published"];
  const { rows } = await db().query<SummaryRow>(
    `${SUMMARY} WHERE p.slug = $1 AND p.status = ANY($2) GROUP BY p.id, x.title`,
    [slug, statuses],
  );
  const row = rows[0];
  if (!row) return null;
  const texts = (
    await db().query(
      `SELECT basis_note, tradition_reading, tradition_note, research_reading, research_note
       FROM parallel_texts WHERE parallel_id = $1 AND locale = $2`,
      [row.id, LOCALE],
    )
  ).rows[0];
  const refs = await db().query<{ role: string; address: string }>(
    "SELECT role, address::text FROM parallel_refs WHERE parallel_id = $1 ORDER BY position",
    [row.id],
  );
  const items = await resolveRefs([...new Set(refs.rows.map((r) => r.address))]);
  const itemsOf = (role: string) => groupItems(refs.rows.filter((r) => r.role === role).map((r) => r.address), items);
  return {
    ...toSummary(row),
    basisNote: texts.basis_note,
    traditionReading: texts.tradition_reading,
    traditionNote: texts.tradition_note,
    researchReading: texts.research_reading,
    researchNote: texts.research_note,
    islamItems: itemsOf("islam"),
    externalItems: itemsOf("external"),
    basisItems: itemsOf("basis"),
    traditionItems: itemsOf("tradition"),
    researchItems: itemsOf("research"),
  };
}

type Resolved = {
  ayahs: Map<string, { text: string; sura: string }>;
  hadiths: Map<string, HadithRef>;
  external: Map<string, { original: string; translation: string }>;
};

async function resolveRefs(addresses: string[]): Promise<Resolved> {
  const quran = addresses.filter((a) => a.startsWith("quran."));
  const outside = addresses.filter(isOutside);
  const own = addresses.filter((a) => !a.startsWith("quran.") && !isOutside(a));
  const [ayahs, hadiths, external] = await Promise.all([
    db().query<{ address: string; text: string; sura: string }>(
      `SELECT a.address::text, t.content AS text, s.names->>'translit' AS sura
       FROM addresses a
       JOIN texts t ON t.address = a.address
       JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published' AND v.work_id = 'quran' AND v.language = 'ar'
       JOIN addresses s ON s.address = subpath(a.address, 0, 2)
       WHERE a.address = ANY($1::extensions.ltree[])`,
      [quran],
    ),
    getHadithRefs(own),
    db().query<{ address: string; kind: string; content: string }>(
      `SELECT t.address::text, v.kind, t.content
       FROM texts t JOIN text_versions v ON v.id = t.version_id AND v.is_primary AND v.status = 'published'
       WHERE t.address = ANY($1::extensions.ltree[])`,
      [outside],
    ),
  ]);
  const externalTexts = new Map<string, { original: string; translation: string }>();
  for (const r of external.rows) {
    const entry = externalTexts.get(r.address) ?? { original: "", translation: "" };
    if (r.kind === "original") entry.original = r.content;
    else entry.translation = r.content;
    externalTexts.set(r.address, entry);
  }
  return {
    ayahs: new Map(ayahs.rows.map((r) => [r.address, { text: r.text, sura: r.sura }])),
    hadiths,
    external: externalTexts,
  };
}

// Consecutive verses of one chapter become one passage.
function groupItems(addresses: string[], resolved: Resolved): RefItem[] {
  const out: RefItem[] = [];
  for (const address of addresses) {
    if (address.startsWith("quran.")) {
      const ayah = resolved.ayahs.get(address);
      if (!ayah) continue;
      const [, sura, n] = address.split(".");
      out.push({ kind: "ayah", address, label: `${sura}:${n} ${ayah.sura}`, href: `/quran/${sura}#${sura}-${n}`, text: ayah.text });
    } else if (isOutside(address)) {
      const text = resolved.external.get(address);
      if (!text) continue;
      const p = address.split(".");
      const verse = { address, n: Number(p[3]), original: text.original, translation: text.translation };
      const last = out.at(-1);
      const chapter = p.slice(0, 3).join(".");
      if (last?.kind === "external" && last.verses[0].address.startsWith(`${chapter}.`) && last.verses.at(-1)!.n + 1 === verse.n) {
        last.verses.push(verse);
        last.label = formatExternalRefs(last.verses.map((v) => v.address));
        continue;
      }
      const work = EXTERNAL_WORKS[p[0] as keyof typeof EXTERNAL_WORKS];
      out.push({
        kind: "external",
        label: externalLabel(address),
        href: externalHref(address),
        dir: work.dir,
        language: work.language,
        verses: [verse],
      });
    } else {
      const ref = resolved.hadiths.get(address);
      if (ref) out.push({ kind: "hadith", ref });
    }
  }
  return out;
}
