import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { formatBookRef, isBook } from "@/lib/book-query";
import { db } from "@/lib/db";
import type { CheckedFinding } from "@/lib/findings-input";
import type { InputProblem } from "@/lib/glossary-input";
import { formatHadithRef } from "@/lib/hadith-query";

// «Новые находки» and «Не найдено в источниках» (migration 025).

export const FINDINGS_TAG = "findings";

export type Finding = {
  id: number;
  status: string;
  leadUrl: string;
  leadDate: string;
  claimedSource: string;
  claimedText: string;
  foundAddress: string | null;
  searched: string;
  note: string;
  public: boolean;
  updatedAt: string;
};

const COLUMNS = `id::int, status, lead_url AS "leadUrl", coalesce(to_char(lead_date, 'YYYY-MM-DD'), '') AS "leadDate",
  claimed_source AS "claimedSource", claimed_text AS "claimedText", found_address::text AS "foundAddress",
  searched, note, public, to_char(updated_at, 'DD.MM.YYYY') AS "updatedAt"`;

export const foundLabel = (address: string) => {
  const work = address.split(".")[0];
  return work === "quran" ? address.split(".").slice(1).join(":") : isBook(work) ? formatBookRef(address) : formatHadithRef(address);
};

export async function listFindings(status?: string): Promise<Finding[]> {
  const { rows } = await db().query<Finding>(
    `SELECT ${COLUMNS} FROM findings WHERE ($1::text IS NULL OR status = $1) ORDER BY id DESC`,
    [status ?? null],
  );
  return rows;
}

export async function getFinding(id: number): Promise<Finding | null> {
  const { rows } = await db().query<Finding>(`SELECT ${COLUMNS} FROM findings WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// The public section: checked leads whose text is not in the source named.
export async function listPublicNotFound(): Promise<Finding[]> {
  "use cache";
  cacheTag(FINDINGS_TAG);
  cacheLife("hours");
  const { rows } = await db().query<Finding>(`SELECT ${COLUMNS} FROM findings WHERE public AND status = 'not_found' ORDER BY updated_at DESC`);
  return rows;
}

export async function saveFinding(id: number | null, input: CheckedFinding, actor: string): Promise<{ id?: number; problems: InputProblem[] }> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const problems: InputProblem[] = [];
    if (input.foundAddress) {
      const known = await client.query("SELECT 1 FROM addresses WHERE address = $1::extensions.ltree", [input.foundAddress]);
      if (!known.rowCount) problems.push({ field: "found", code: "foundMissing", detail: input.found });
    }
    const before = id ? await getFinding(id) : null;
    if (id && !before) problems.push({ field: "", code: "notFound" });
    if (before?.public && !input.reason) problems.push({ field: "reason", code: "reason" });
    if (problems.length) {
      await client.query("ROLLBACK");
      return { problems };
    }
    const values = [
      input.status,
      input.leadUrl,
      input.leadDate || null,
      input.claimedSource,
      input.claimedText,
      input.foundAddress,
      input.searched,
      input.note,
      input.public,
      actor,
    ];
    let findingId = id;
    if (id) {
      await client.query(
        `UPDATE findings SET status = $2, lead_url = $3, lead_date = $4, claimed_source = $5, claimed_text = $6,
           found_address = $7::extensions.ltree, searched = $8, note = $9, public = $10, updated_by = $11, updated_at = now()
         WHERE id = $1`,
        [id, ...values],
      );
    } else {
      findingId = (
        await client.query(
          `INSERT INTO findings (status, lead_url, lead_date, claimed_source, claimed_text, found_address, searched, note, public,
             created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6::extensions.ltree, $7, $8, $9, $10, $10) RETURNING id::int`,
          values,
        )
      ).rows[0].id;
    }
    const { reason, ...after } = input;
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
       VALUES ('finding', $1, $2, $3, $4, $5, $6)`,
      [String(findingId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(after), reason, actor],
    );
    await client.query("COMMIT");
    return { id: findingId!, problems: [] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
