// Public entry of the monitoring module: the journal of site errors (errors
// of the server and of the reader's browser, for the administrator).
// Database access is in "@/modules/monitoring/server".
export type * from "./monitoring.types";
export { KEEP_DAYS } from "./monitoring.entry";

export { ErrorReporter } from "./components/error-reporter";
