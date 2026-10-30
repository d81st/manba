import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type pg from "pg";
import { defaultLocale } from "@/i18n";
import { db } from "@/lib/db";
import { EXTERNAL_WORKS, externalHref, externalLabel, formatExternalRefs, isExternal } from "@/lib/external";
import { formatRefs, type InputProblem } from "@/lib/glossary-input";
import { getHadithRefs, type HadithRef } from "@/lib/hadith";
import { type CheckedParallel, PARALLEL_REF_FIELDS, type ParallelInput, REF_ROLES } from "@/lib/parallels-input";

// Links of «Истоки и связи» (db/migrations/017): reading for the pages, and
// saving from the admin panel with every change in change_log.

export const PARALLELS_TAG = "parallels";
const LOCALE = defaultLocale;

export type ParallelSummary = {
  id: number;
  slug: string;
  title: string;
  tradition: string;
  kind: string;
  degree: string;
  basis: string;
  status: string;
  islam: string; // "5:45"
  external: string; // "Исход 21:23-25"
};

const isOutside = (address: string) => isExternal(address.split(".")[0]);
// Islamic references first, then the others, each in their usual form.
export function formatAnyRefs(addresses: string[]) {
  return [formatRefs(addresses.filter((a) => !isOutside(a))), formatExternalRefs(addresses.filter(isOutside))]
    .filter(Boolean)
    .join(", ");
}

const SUMMARY = `
  SELECT p.id::int, p.slug, x.title, p.tradition, p.kind, p.degree, p.basis, p.status,
         coalesce(array_agg(r.address::text ORDER BY r.position) FILTER (WHERE r.role = 'islam'), '{}') AS islam,
         coalesce(array_agg(r.address::text ORDER BY r.position) FILTER (WHERE r.role = 'external'), '{}') AS external
  FROM parallels p
  JOIN parallel_texts x ON x.parallel_id = p.id AND x.locale = '${LOCALE}'
  LEFT JOIN parallel_refs r ON r.parallel_id = p.id AND r.role IN ('islam', 'external')`;

type SummaryRow = Omit<ParallelSummary, "islam" | "external"> & { islam: string[]; external: string[] };
const toSummary = (row: SummaryRow): ParallelSummary => ({
  ...row,
  islam: formatRefs(row.islam),
  external: formatExternalRefs(row.external),
});

// drafts: also what is not published yet (the preview of the admin); never what is retired.
export async function listParallels(drafts: boolean): Promise<ParallelSummary[]> {
  "use cache";
  cacheTag(PARALLELS_TAG);
  cacheLife("hours");
  const statuses = drafts ? ["draft", "review", "published"] : ["published"];
  const { rows } = await db().query<SummaryRow>(
    `${SUMMARY} WHERE p.status = ANY($1) GROUP BY p.id, x.title ORDER BY p.tradition, x.title`,
    [statuses],
  );
  return rows.map(toSummary);
}

export async function listParallelsForAdmin(): Promise<ParallelSummary[]> {
  const { rows } = await db().query<SummaryRow>(`${SUMMARY} GROUP BY p.id, x.title ORDER BY p.updated_at DESC`);
  return rows.map(toSummary);
}

export type ParallelForEdit = ParallelInput & { id: number };

export async function getParallelForEdit(id: number): Promise<ParallelForEdit | null> {
  const { rows } = await db().query(
    `SELECT p.id::int, p.slug, p.status, p.tradition, p.kind, p.degree, p.basis, x.title, x.basis_note, x.tradition_reading,
            x.tradition_note, x.research_reading, x.research_note
     FROM parallels p JOIN parallel_texts x ON x.parallel_id = p.id AND x.locale = $2 WHERE p.id = $1`,
    [id, LOCALE],
  );
  const p = rows[0];
  if (!p) return null;
  const refs = await db().query<{ role: string; address: string }>(
    "SELECT role, address::text FROM parallel_refs WHERE parallel_id = $1 ORDER BY position",
    [id],
  );
  const field = (role: string) => formatAnyRefs(refs.rows.filter((r) => r.role === role).map((r) => r.address));
  return {
    id: p.id,
    slug: p.slug,
    status: p.status,
    title: p.title,
    tradition: p.tradition,
    kind: p.kind,
    degree: p.degree,
    basis: p.basis,
    islamRefs: field("islam"),
    externalRefs: field("external"),
    basisRefs: field("basis"),
    basisNote: p.basis_note,
    traditionReading: p.tradition_reading,
    traditionRefs: field("tradition"),
    traditionNote: p.tradition_note,
    researchReading: p.research_reading,
    researchRefs: field("research"),
    researchNote: p.research_note,
    reason: "",
  };
}

type Saved = { id?: number; problems: InputProblem[] };

export async function saveParallel(id: number | null, input: CheckedParallel, actor: string): Promise<Saved> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await save(client, id, input, actor);
    await client.query(result.problems.length ? "ROLLBACK" : "COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function save(client: pg.PoolClient, id: number | null, input: CheckedParallel, actor: string): Promise<Saved> {
  const problems: InputProblem[] = [];
  const all = [...new Set(PARALLEL_REF_FIELDS.flatMap((f) => input.refs[f]))];
  const missing = await client.query<{ a: string }>(
    `SELECT a FROM unnest($1::text[]) AS a
     WHERE NOT EXISTS (SELECT 1 FROM addresses x WHERE x.address = a::extensions.ltree AND x.status = 'active')`,
    [all],
  );
  for (const field of PARALLEL_REF_FIELDS) {
    const absent = input.refs[field].filter((a) => missing.rows.some((r) => r.a === a));
    if (absent.length) problems.push({ field, code: "missing", detail: formatAnyRefs(absent) });
  }
  const taken = await client.query("SELECT 1 FROM parallels WHERE slug = $1 AND id IS DISTINCT FROM $2", [input.slug, id]);
  if (taken.rowCount) problems.push({ field: "slug", code: "slugTaken" });
  const before = id ? await getParallelForEdit(id) : null;
  if (id && !before) problems.push({ field: "", code: "notFound" });
  if (before && before.slug !== input.slug) {
    const published = await client.query(
      `SELECT 1 FROM change_log WHERE entity = 'parallel' AND entity_id = $1 AND new_value->>'status' = 'published' LIMIT 1`,
      [String(id)],
    );
    if (published.rowCount) problems.push({ field: "slug", code: "slugPublished" });
  }
  if (before?.status === "published" && !input.reason) problems.push({ field: "reason", code: "reason" });
  if (problems.length) return { problems };

  let parallelId = id;
  const values = [input.slug, input.tradition, input.kind, input.degree, input.basis, input.status, actor];
  if (parallelId) {
    await client.query(
      `UPDATE parallels SET slug = $2, tradition = $3, kind = $4, degree = $5, basis = $6, status = $7,
              updated_by = $8, updated_at = now() WHERE id = $1`,
      [parallelId, ...values],
    );
    await client.query("DELETE FROM parallel_refs WHERE parallel_id = $1", [parallelId]);
  } else {
    parallelId = (
      await client.query(
        `INSERT INTO parallels (slug, tradition, kind, degree, basis, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id::int`,
        values,
      )
    ).rows[0].id;
  }
  await client.query(
    `INSERT INTO parallel_texts (parallel_id, locale, title, basis_note, tradition_reading, tradition_note, research_reading, research_note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (parallel_id, locale) DO UPDATE SET title = excluded.title, basis_note = excluded.basis_note,
       tradition_reading = excluded.tradition_reading, tradition_note = excluded.tradition_note,
       research_reading = excluded.research_reading, research_note = excluded.research_note`,
    [parallelId, LOCALE, input.title, input.basisNote, input.traditionReading, input.traditionNote, input.researchReading, input.researchNote],
  );
  for (const field of PARALLEL_REF_FIELDS) {
    await client.query(
      `INSERT INTO parallel_refs (parallel_id, role, address, position)
       SELECT $1, $2, a::extensions.ltree, o - 1 FROM unnest($3::text[]) WITH ORDINALITY AS t(a, o)`,
      [parallelId, REF_ROLES[field], input.refs[field]],
    );
  }
  const { reason, refs, ...after } = input;
  void refs;
  await client.query(
    `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
     VALUES ('parallel', $1, $2, $3, $4, $5, $6)`,
    [String(parallelId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(after), reason, actor],
  );
  return { id: parallelId!, problems: [] };
}

// What a link shows: each referenced passage with its text.
export type RefItem =
  | { kind: "ayah"; address: string; label: string; href: string; text: string }
  | { kind: "hadith"; ref: HadithRef }
  | {
      kind: "external";
      label: string; // "Исход 21:23-25"
      href: string;
      dir: "rtl" | "ltr";
      language: string;
      verses: { address: string; n: number; original: string; translation: string }[];
    };

export type PublicParallel = ParallelSummary & {
  basisNote: string;
  traditionReading: string;
  traditionNote: string;
  researchReading: string;
  researchNote: string;
  islamItems: RefItem[];
  externalItems: RefItem[];
  basisItems: RefItem[];
  traditionItems: RefItem[];
  researchItems: RefItem[];
};

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
