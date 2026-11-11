// "Report a mistake": what a reader may send. No database here, so it is unit-tested.

export const REPORT_STATUSES = ["new", "done"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const MIN_MESSAGE = 5;
export const MAX_MESSAGE = 2000;
export const MAX_QUOTE = 1000;
export const MAX_PAGE = 500;
// One person may send this many reports a day; more looks like a mistake or abuse.
export const REPORTS_PER_DAY = 20;

export type ReportProblem = "tooShort" | "tooLong" | "badPage";
export type CheckedReport = { page: string; quote: string; message: string };

// The page is a path of this site ("/quran/2#2-255"), never another site's address.
export function checkReport(raw: { page: unknown; quote: unknown; message: unknown }): { report?: CheckedReport; problem?: ReportProblem } {
  const page = typeof raw.page === "string" ? raw.page.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const quote = typeof raw.quote === "string" ? raw.quote.replace(/\s+/g, " ").trim().slice(0, MAX_QUOTE) : "";
  if (!page.startsWith("/") || page.startsWith("//") || page.startsWith("/\\") || page.length > MAX_PAGE || /[\u0000-\u001f]/.test(page)) {
    return { problem: "badPage" };
  }
  if (message.length < MIN_MESSAGE) return { problem: "tooShort" };
  if (message.length > MAX_MESSAGE) return { problem: "tooLong" };
  return { report: { page, quote, message } };
}
