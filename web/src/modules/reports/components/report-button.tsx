"use client";

import { Flag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { MAX_MESSAGE, MAX_QUOTE } from "../report.validation";
import { type ReportFormState, sendReportAction } from "../server/report.actions";

const t = getMessages().reports;

// "Report a mistake": a small button in the corner of every page. It opens a
// form that already knows the page (with the #anchor of the chosen fragment)
// and the text the reader had selected; the reader adds what is wrong.
export function ReportButton() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [place, setPlace] = useState({ page: "", quote: "" });
  // A new form (and a clean state) every time the window is opened.
  const [round, setRound] = useState(0);
  if (pathname === "/login" || pathname.startsWith("/account/password")) return null;

  function open() {
    setPlace({
      page: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      quote: (window.getSelection()?.toString() ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUOTE),
    });
    setRound((n) => n + 1);
    dialog.current?.showModal();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed end-3 bottom-3 z-40 size-10 rounded-full bg-card shadow-md print:hidden"
        aria-label={t.button}
        title={t.button}
        // Keep the selection: pressing a button would otherwise clear it.
        onPointerDown={(e) => e.preventDefault()}
        onClick={open}
      >
        <Flag />
      </Button>
      <dialog
        ref={dialog}
        aria-label={t.title}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-xl border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <ReportForm key={round} place={place} onClose={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}

function ReportForm({ place, onClose }: { place: { page: string; quote: string }; onClose: () => void }) {
  const [state, action, pending] = useActionState<ReportFormState, FormData>(sendReportAction, {});
  return (
    <form action={action} className="flex flex-col gap-3 p-5">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      {state.sent ? (
        <>
          <p role="status">{t.sent}</p>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
          <input type="hidden" name="page" value={place.page} />
          <input type="hidden" name="quote" value={place.quote} />
          <p className="text-sm break-all">
            <span className="text-muted-foreground">{t.where}:</span> <bdi dir="ltr">{readable(place.page)}</bdi>
          </p>
          {place.quote ? (
            <div className="text-sm">
              <span className="text-muted-foreground">{t.quote}:</span>
              <blockquote className="mt-1 max-h-28 overflow-auto rounded-md border-s-2 border-primary bg-muted/40 px-3 py-1.5" dir="auto">
                {place.quote}
              </blockquote>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t.quoteHint}</p>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.message}
            <Textarea name="message" required minLength={5} maxLength={MAX_MESSAGE} rows={4} placeholder={t.placeholder} autoFocus className="font-normal" />
          </label>
          {state.problem && (
            <p role="alert" className="text-sm text-destructive">
              {t.problems[state.problem]}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {t.send}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

// "/quran/search?q=%D9%86" as the reader sees it in the address bar.
function readable(page: string) {
  try {
    return decodeURI(page);
  } catch {
    return page;
  }
}
