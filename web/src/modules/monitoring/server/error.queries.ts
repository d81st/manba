import "server-only";
import { db } from "@/shared/db";
import type { ErrorGroup } from "../monitoring.types";

const LIMIT = 200;

// The errors of the journal grouped by kind, place and message, the group
// with the latest error first; each group shows its last error.
export async function listErrorGroups(): Promise<ErrorGroup[]> {
  const { rows } = await db().query<ErrorGroup>(
    `SELECT kind, route, message, count, first, last, path, digest, stack
     FROM (
       SELECT DISTINCT ON (kind, route, message) kind, route, message,
              (count(*) OVER w)::int AS count,
              to_char(min(at) OVER w AT TIME ZONE 'UTC', 'DD.MM.YYYY HH24:MI') AS first,
              to_char(at AT TIME ZONE 'UTC', 'DD.MM.YYYY HH24:MI') AS last,
              path, digest, stack, at
       FROM site_errors
       WINDOW w AS (PARTITION BY kind, route, message)
       ORDER BY kind, route, message, at DESC
     ) g
     ORDER BY at DESC
     LIMIT ${LIMIT}`,
  );
  return rows;
}
