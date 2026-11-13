"use client";

import { useEffect } from "react";
import { reportClientErrorAction } from "../server/error.actions";

// Put on the error pages: sends an error that happened in the browser to the
// journal. An error with a code (digest) came from the server, where
// instrumentation.ts has already recorded it.
export function ErrorReporter({ error }: { error: unknown }) {
  useEffect(() => {
    const digest = typeof error === "object" && error !== null && "digest" in error ? error.digest : undefined;
    if (digest) return;
    const message = error instanceof Error ? error.message || error.name : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    reportClientErrorAction({ message, stack, path: window.location.pathname }).catch(() => {});
  }, [error]);
  return null;
}
