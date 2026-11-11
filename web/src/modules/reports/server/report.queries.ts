import "server-only";
import { db } from "@/shared/db";
import type { Report } from "../report.types";
import type { ReportStatus } from "../report.validation";

const LIMIT = 200;

// Reports for the panel, the newest first.
export async function listReports(status: ReportStatus): Promise<Report[]> {
  const { rows } = await db().query<Report>(
    `SELECT id::int, status, page, quote, message, created_by AS "createdBy",
            to_char(created_at AT TIME ZONE 'UTC', 'DD.MM.YYYY HH24:MI') AS "createdAt", done_by AS "doneBy"
     FROM reports WHERE status = $1 ORDER BY id DESC LIMIT ${LIMIT}`,
    [status],
  );
  return rows;
}

export async function countNewReports(): Promise<number> {
  const { rows } = await db().query<{ n: number }>("SELECT count(*)::int AS n FROM reports WHERE status = 'new'");
  return rows[0].n;
}
