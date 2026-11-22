import "server-only";
import { db } from "@/shared/db";
import type { InputProblem } from "@/shared/forms/input";
import type { VersionPointInput } from "../topic.versions";
import { LOCALE } from "./topic.sql";

// Saves a point of «Версии рядом» with all its cells. Every quotation must
// stand word for word in the text of its position and in the primary Arabic
// text of its place (or of a fragment inside it), else nothing is saved.
export async function saveVersionPoint(
  topicId: number,
  pointId: number | null,
  input: VersionPointInput,
  actor: string,
): Promise<InputProblem[]> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const topic = await client.query("SELECT 1 FROM topics WHERE id = $1 FOR UPDATE", [topicId]);
    if (!topic.rowCount) {
      await client.query("ROLLBACK");
      return [{ field: "", code: "notFound" }];
    }
    const problems: InputProblem[] = [];
    for (const cell of input.cells) {
      const i = cell.row;
      const check = await client.query<{ in_position: boolean; place: boolean; in_source: boolean }>(
        `SELECT
           EXISTS (SELECT 1 FROM topic_positions p WHERE p.topic_id = $1 AND p.locale = $2 AND p.holder = $3
                   AND position($4 IN p.text) > 0) AS in_position,
           EXISTS (SELECT 1 FROM addresses WHERE address = $5::extensions.ltree) AS place,
           EXISTS (SELECT 1 FROM addresses a
                   JOIN texts x ON x.address = a.address
                   JOIN text_versions v ON v.id = x.version_id AND v.is_primary AND v.language = 'ar'
                   WHERE a.address <@ $5::extensions.ltree AND position($4 IN x.content) > 0) AS in_source`,
        [topicId, LOCALE, cell.holder, cell.quote, cell.address],
      );
      const { in_position, place, in_source } = check.rows[0];
      if (!in_position) problems.push({ field: `cells.${i}.quote`, code: "quoteNotInPosition" });
      else if (!place) problems.push({ field: `cells.${i}.ref`, code: "placeMissing" });
      else if (!in_source) problems.push({ field: `cells.${i}.quote`, code: "quoteNotInSource" });
    }
    if (problems.length) {
      await client.query("ROLLBACK");
      return problems;
    }
    const before = pointId
      ? (
          await client.query(
            `SELECT p.label, p.position,
                    coalesce(jsonb_agg(jsonb_build_object('holder', c.holder, 'quote', c.quote, 'address', c.address::text)
                             ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL), '[]') AS cells
             FROM topic_version_points p LEFT JOIN topic_version_cells c ON c.point_id = p.id
             WHERE p.id = $1 AND p.topic_id = $2 GROUP BY p.id`,
            [pointId, topicId],
          )
        ).rows[0]
      : null;
    if (pointId && !before) {
      await client.query("ROLLBACK");
      return [{ field: "", code: "notFound" }];
    }
    let id = pointId;
    if (id) {
      await client.query("UPDATE topic_version_points SET label = $2, position = $3 WHERE id = $1", [id, input.label, input.position]);
      await client.query("DELETE FROM topic_version_cells WHERE point_id = $1", [id]);
    } else {
      const created = await client.query<{ id: number }>(
        "INSERT INTO topic_version_points (topic_id, locale, label, position) VALUES ($1, $2, $3, $4) RETURNING id::int",
        [topicId, LOCALE, input.label, input.position],
      );
      id = created.rows[0].id;
    }
    for (const cell of input.cells) {
      await client.query(
        "INSERT INTO topic_version_cells (point_id, holder, quote, address) VALUES ($1, $2, $3, $4::extensions.ltree)",
        [id, cell.holder, cell.quote, cell.address],
      );
    }
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
       VALUES ('topic_version_point', $1, $2, $3, $4, $5)`,
      [String(id), pointId ? "updated" : "created", before ? JSON.stringify(before) : null, JSON.stringify({ topicId, label: input.label, position: input.position, cells: input.cells.map(({ holder, quote, address }) => ({ holder, quote, address })) }), actor],
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

export async function deleteVersionPoint(topicId: number, pointId: number, actor: string): Promise<boolean> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const before = await client.query(
      `SELECT p.label, p.position,
              coalesce(jsonb_agg(jsonb_build_object('holder', c.holder, 'quote', c.quote, 'address', c.address::text)
                       ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL), '[]') AS cells
       FROM topic_version_points p LEFT JOIN topic_version_cells c ON c.point_id = p.id
       WHERE p.id = $1 AND p.topic_id = $2 GROUP BY p.id`,
      [pointId, topicId],
    );
    if (!before.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("DELETE FROM topic_version_points WHERE id = $1", [pointId]);
    await client.query(
      `INSERT INTO change_log (entity, entity_id, action, old_value, actor)
       VALUES ('topic_version_point', $1, 'deleted', $2, $3)`,
      [String(pointId), JSON.stringify({ topicId, ...before.rows[0] }), actor],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
