import type { Instrumentation } from "next";

// Errors the server catches while rendering a page, answering a route or
// running a form action go to the journal of site errors (/admin/errors,
// migration 059). The module is loaded only in the Node.js runtime, where the
// database is.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logServerError } = await import("@/modules/monitoring/server");
  await logServerError(error, request, context);
};
