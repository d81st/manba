"use client";

import { useState } from "react";
import { getMessages } from "@/shared/i18n";

const t = getMessages().quran.translation;

// The translator's footnote stays in the line (so a page search still finds it)
// and is shown when the reader asks. The words are the edition's note, unchanged.
export function TranslatorNote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label={t.note}
        onClick={() => setOpen((value) => !value)}
        className="ms-1 inline cursor-pointer rounded-sm border-0 bg-transparent p-0 align-baseline text-xs text-primary underline decoration-dotted underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.noteMark}
      </button>
      <span role="note" className={open ? "mx-1 text-xs text-muted-foreground" : "sr-only"}>
        {text}
      </span>
    </>
  );
}
