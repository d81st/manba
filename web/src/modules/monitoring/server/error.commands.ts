import "server-only";
import { db, isDatabaseConfigured } from "@/shared/db";
import { KEEP_DAYS, PER_HOUR, serverErrorEntry } from "../monitoring.entry";
import type { ErrorEntry } from "../monitoring.types";

// Keeps one error. The same statement drops rows older than KEEP_DAYS and
// keeps nothing once PER_HOUR errors came in the last hour (a broken page
// opened in a loop must not fill the database).
export async function recordError(entry: ErrorEntry) {
  await db().query(
    `WITH old AS (DELETE FROM site_errors WHERE at < now() - make_interval(days => $8))
     INSERT INTO site_errors (kind, route, path, method, digest, message, stack)
     SELECT $1, $2, $3, $4, $5, $6, $7
     WHERE (SELECT count(*) FROM site_errors WHERE at > now() - interval '1 hour') < $9`,
    [entry.kind, entry.route, entry.path, entry.method, entry.digest, entry.message, entry.stack, KEEP_DAYS, PER_HOUR],
  );
}

// Called by onRequestError (src/instrumentation.ts). Never throws: an error
// about an error would only hide the first one. If the database itself is
// what failed, the Render log still has the error.
export async function logServerError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string },
) {
  if (!isDatabaseConfigured()) return;
  try {
    await recordError(serverErrorEntry(error, request, context));
  } catch (failure) {
    console.error("site_errors: could not record the error", failure);
  }
}

// The administrator empties the journal.
export async function clearErrors() {
  await db().query("DELETE FROM site_errors");
}
