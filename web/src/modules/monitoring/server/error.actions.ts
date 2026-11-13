"use server";

import { refresh } from "next/cache";
import { requireAdmin, requireSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { clientErrorEntry } from "../monitoring.entry";
import { clearErrors, recordError } from "./error.commands";

// The error page in the reader's browser reports an error that happened
// there (one without a code: errors of the server are already in the journal).
export async function reportClientErrorAction(input: { message?: unknown; path?: unknown; stack?: unknown }) {
  await requireSession();
  const entry = clientErrorEntry(input ?? {});
  if (!entry || !isDatabaseConfigured()) return;
  try {
    await recordError(entry);
  } catch {
    // Nothing to tell the reader: the page already says that it failed.
  }
}

export async function clearErrorsAction() {
  await requireAdmin();
  await clearErrors();
  refresh();
}
