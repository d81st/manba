import "server-only";
import { db } from "@/shared/db";
import type { InputProblem } from "@/shared/forms/input";
import type { CheckedFinding } from "../finding.validation";
import { getFinding } from "./finding.queries";

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
