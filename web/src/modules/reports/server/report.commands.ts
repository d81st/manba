import "server-only";
import { db } from "@/shared/db";
import { type CheckedReport, REPORTS_PER_DAY, type ReportStatus } from "../report.validation";

// Saves a reader's report; false when this person has sent too many today.
export async function addReport(report: CheckedReport, login: string): Promise<boolean> {
  const { rowCount } = await db().query(
    `INSERT INTO reports (page, quote, message, created_by)
     SELECT $1, $2, $3, $4
     WHERE (SELECT count(*) FROM reports WHERE created_by = $4 AND created_at > now() - interval '1 day') < $5`,
    [report.page, report.quote, report.message, login, REPORTS_PER_DAY],
  );
  return rowCount === 1;
}

// Marks a report done, or returns it to the new ones.
export async function setReportStatus(id: number, status: ReportStatus, login: string) {
  await db().query(
    `UPDATE reports SET status = $2,
       done_by = CASE WHEN $2 = 'done' THEN $3 ELSE NULL END,
       done_at = CASE WHEN $2 = 'done' THEN now() ELSE NULL END
     WHERE id = $1`,
    [id, status, login],
  );
}
