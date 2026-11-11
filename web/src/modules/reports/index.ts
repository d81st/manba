// Public entry of the reports module: "report a mistake" — a reader's note to
// the editors about the page they are reading. Database access is in "@/modules/reports/server".
export type { Report } from "./report.types";
export * from "./report.validation";

export { ReportButton } from "./components/report-button";
