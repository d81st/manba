"use client";

import { useLayoutEffect } from "react";
import type { Locale } from "@/shared/i18n";

// The root <html> stays in the static shell. This sets its language once the
// request has chosen one, before the browser paints.
export function DocumentLang({ locale }: { locale: Locale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
