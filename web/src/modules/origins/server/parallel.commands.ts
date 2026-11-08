import "server-only";
import type pg from "pg";
import { db } from "@/lib/db";
import type { InputProblem } from "@/lib/input";
import { formatAnyRefs } from "../parallel.refs";
import { type CheckedParallel, PARALLEL_REF_FIELDS, REF_ROLES } from "../parallel.validation";
import { getParallelForEdit } from "./parallel.queries";
import { LOCALE } from "./parallel.sql";

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
