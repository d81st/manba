"use server";

import { refresh } from "next/cache";
import { requireAdmin, requireSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { checkReport, REPORT_STATUSES, type ReportProblem } from "../report.validation";
import { addReport, setReportStatus } from "./report.commands";

export type ReportFormState = { sent?: boolean; problem?: ReportProblem | "tooMany" | "unavailable" };

// Any signed-in person may report a mistake on the page they are reading.
export async function sendReportAction(_prev: ReportFormState, formData: FormData): Promise<ReportFormState> {
  const session = await requireSession();
  const { report, problem } = checkReport({ page: formData.get("page"), quote: formData.get("quote"), message: formData.get("message") });
  if (!report) return { problem };
  if (!isDatabaseConfigured()) return { problem: "unavailable" };
  try {
    return (await addReport(report, session.login)) ? { sent: true } : { problem: "tooMany" };
  } catch {
    return { problem: "unavailable" };
  }
}

// The administrator marks a report done or returns it.
export async function setReportStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  const status = REPORT_STATUSES.find((s) => s === formData.get("status"));
  if (!Number.isInteger(id) || id < 1 || !status) return;
  await setReportStatus(id, status, session.login);
  refresh();
}
