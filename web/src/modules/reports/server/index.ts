// Server side of the reports module. Import from "@/modules/reports/server".
import "server-only";

export { sendReportAction, setReportStatusAction } from "./report.actions";
export { countNewReports, listReports } from "./report.queries";
