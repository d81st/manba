"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { currentPlace, type Place } from "../bookmark.place";
import { MAX_NOTE, MAX_TITLE } from "../bookmark.validation";
import { type BookmarkFormState, saveBookmarkAction } from "../server/bookmark.actions";

const t = getMessages().bookmarks;

// "Add a bookmark": a small button in the corner of every page, above "report
// a mistake". The form already knows the place (the page and the fragment on
// screen) and proposes a name for it; the reader may change the name and add a note.
export function BookmarkButton() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [place, setPlace] = useState<Place>({ page: "", title: "" });
  // A new form (and a clean state) every time the window is opened.
  const [round, setRound] = useState(0);
  if (pathname === "/login" || pathname.startsWith("/account/password") || pathname === "/bookmarks") return null;

  function open() {
    setPlace(currentPlace());
    setRound((n) => n + 1);
    dialog.current?.showModal();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed end-3 bottom-16 z-40 size-10 rounded-full bg-card shadow-md print:hidden"
        aria-label={t.button}
        title={t.button}
        onClick={open}
      >
        <Bookmark />
      </Button>
      <dialog
        ref={dialog}
        aria-label={t.dialogTitle}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <BookmarkForm key={round} place={place} onClose={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}

function BookmarkForm({ place, onClose }: { place: Place; onClose: () => void }) {
  const [state, action, pending] = useActionState<BookmarkFormState, FormData>(saveBookmarkAction, {});
  return (
    <form action={action} className="flex flex-col gap-3 p-5">
      <h2 className="text-lg font-semibold">{t.dialogTitle}</h2>
      {state.saved ? (
        <>
          <p role="status">{t.saved}</p>
          <div className="flex items-center justify-between gap-2">
            <Link href="/bookmarks" onClick={onClose}>
              {t.all}
            </Link>
            <Button type="button" onClick={onClose}>
              {t.close}
            </Button>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="page" value={place.page} />
          <p className="text-sm break-all">
            <span className="text-muted-foreground">{t.where}:</span> <bdi dir="ltr">{readable(place.page)}</bdi>
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.name}
            <Input name="title" required maxLength={MAX_TITLE} defaultValue={place.title.slice(0, MAX_TITLE)} className="font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.note}
            <Input name="note" maxLength={MAX_NOTE} className="font-normal" />
          </label>
          {state.problem && (
            <p role="alert" className="text-sm text-destructive">
              {t.problems[state.problem]}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <Link href="/bookmarks" className="text-sm" onClick={onClose}>
              {t.all}
            </Link>
            <span className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t.close}
              </Button>
              <Button type="submit" disabled={pending}>
                {t.save}
              </Button>
            </span>
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
