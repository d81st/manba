import "server-only";
import { db } from "@/lib/db";
import type { Side } from "../topic.types";
import { LOCALE } from "./topic.sql";

export async function listSides(): Promise<Side[]> {
  const { rows } = await db().query<Side>(
    `SELECT s.id::int, s.slug, x.title, s.position,
            (SELECT count(*)::int FROM topic_positions p WHERE p.side_id = s.id) AS used
     FROM position_sides s JOIN position_side_texts x ON x.side_id = s.id AND x.locale = $1
     ORDER BY s.position, x.title`,
    [LOCALE],
  );
  return rows;
}
