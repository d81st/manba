import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/shared/db";
import { PARALLELS_TAG } from "../parallel.constants";
import { formatAnyRefs } from "../parallel.refs";
import type { ParallelForEdit, ParallelSummary } from "../parallel.types";
import { LOCALE, SUMMARY, type SummaryRow, toSummary } from "./parallel.sql";

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
