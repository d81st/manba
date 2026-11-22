import "server-only";
import { db } from "@/shared/db";
import { formatRefs } from "@/shared/addresses/refs";
import { LOCALE } from "./topic.sql";

export type VersionPointForEdit = {
  id: number;
  label: string;
  position: number;
  cells: { holder: string; quote: string; ref: string }[];
};

// The points of «Версии рядом» of a topic with their cells, places written
// as in the rest of the admin ("Ибн Хишам 2:245b"), and the holders of the
// topic's current positions (the columns a cell may name).
export async function listVersionPointsForEdit(topicId: number): Promise<{ points: VersionPointForEdit[]; holders: string[] }> {
  const [points, cells, holders] = await Promise.all([
    db().query<{ id: number; label: string; position: number }>(
      "SELECT id::int, label, position FROM topic_version_points WHERE topic_id = $1 AND locale = $2 ORDER BY position, id",
      [topicId, LOCALE],
    ),
    db().query<{ point_id: number; holder: string; quote: string; address: string }>(
      `SELECT c.point_id::int, c.holder, c.quote, c.address::text FROM topic_version_cells c
       JOIN topic_version_points p ON p.id = c.point_id WHERE p.topic_id = $1 AND p.locale = $2 ORDER BY c.id`,
      [topicId, LOCALE],
    ),
    db().query<{ holder: string }>(
      `SELECT p.holder FROM topic_positions p JOIN position_sides s ON s.id = p.side_id
       WHERE p.topic_id = $1 AND p.locale = $2 ORDER BY s.position, p.position`,
      [topicId, LOCALE],
    ),
  ]);
  return {
    points: points.rows.map((point) => ({
      ...point,
      cells: cells.rows
        .filter((c) => c.point_id === point.id)
        .map((c) => ({ holder: c.holder, quote: c.quote, ref: formatRefs([c.address]) })),
    })),
    holders: [...new Set(holders.rows.map((r) => r.holder))],
  };
}
