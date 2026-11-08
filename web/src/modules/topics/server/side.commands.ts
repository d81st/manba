import "server-only";
import { db } from "@/shared/db";
import type { SideInput } from "../topic.validation";
import { LOCALE } from "./topic.sql";
import type { InputProblem } from "@/shared/forms/input";

export async function saveSide(id: number | null, input: SideInput, actor: string): Promise<InputProblem[]> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const taken = await client.query("SELECT 1 FROM position_sides WHERE slug = $1 AND id IS DISTINCT FROM $2", [
      input.slug,
      id,
    ]);
    if (taken.rowCount) {
      await client.query("ROLLBACK");
      return [{ field: "slug", code: "slugTaken" }];
    }
    const before = id
      ? (
          await client.query(
            `SELECT s.slug, x.title, s.position FROM position_sides s
             JOIN position_side_texts x ON x.side_id = s.id AND x.locale = $2 WHERE s.id = $1 FOR UPDATE OF s`,
            [id, LOCALE],
          )
        ).rows[0]
      : null;
    if (id && !before) {
      await client.query("ROLLBACK");
      return [{ field: "", code: "notFound" }];
    }
    let sideId = id;
    if (sideId) {
      await client.query("UPDATE position_sides SET slug = $2, position = $3 WHERE id = $1", [
        sideId,
        input.slug,
        input.position,
      ]);
    } else {
      const created = await client.query<{ id: number }>(
        "INSERT INTO position_sides (slug, position) VALUES ($1, $2) RETURNING id::int",
        [input.slug, input.position],
      );
      sideId = created.rows[0].id;
    }
    await client.query(
      `INSERT INTO position_side_texts (side_id, locale, title) VALUES ($1, $2, $3)
       ON CONFLICT (side_id, locale) DO UPDATE SET title = EXCLUDED.title`,
      [sideId, LOCALE, input.title],
    );
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
       VALUES ('position_side', $1, $2, $3, $4, $5)`,
      [String(sideId), id ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify(input), actor],
    );
    await client.query("COMMIT");
    return [];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
