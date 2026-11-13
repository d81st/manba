import type { ErrorEntry } from "./monitoring.types";

// Limits of the columns of site_errors (migration 059).
export const MAX = { route: 200, path: 500, method: 10, digest: 64, message: 1000, stack: 4000 } as const;

// Rows older than this leave the journal; more than this many an hour are not kept.
export const KEEP_DAYS = 30;
export const PER_HOUR = 500;

const cut = (value: unknown, max: number) => (typeof value === "string" ? value : "").slice(0, max);

// The page without its query and #anchor: a search query may be personal.
export function pagePath(value: unknown) {
  const path = typeof value === "string" ? value.split(/[?#]/)[0] : "";
  return path.startsWith("/") ? path.slice(0, MAX.path) : "";
}

function describe(error: unknown) {
  if (error instanceof Error) return { message: error.message || error.name, stack: error.stack ?? "" };
  return { message: String(error), stack: "" };
}

// What Next.js gives to onRequestError, as a row of the journal.
export function serverErrorEntry(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string },
): ErrorEntry {
  const { message, stack } = describe(error);
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : "";
  return {
    kind: "server",
    route: cut(context.routePath, MAX.route),
    path: pagePath(request.path),
    method: cut(request.method, MAX.method),
    digest: cut(digest, MAX.digest),
    message: cut(message, MAX.message) || "(no message)",
    stack: cut(stack, MAX.stack),
  };
}

// What the error page in the browser sends (it is the reader's browser, so
// every field is checked); null when there is nothing to keep.
export function clientErrorEntry(input: { message?: unknown; path?: unknown; stack?: unknown }): ErrorEntry | null {
  const message = cut(input.message, MAX.message).trim();
  if (!message) return null;
  return {
    kind: "client",
    route: "",
    path: pagePath(input.path),
    method: "",
    digest: "",
    message,
    stack: cut(input.stack, MAX.stack),
  };
}
