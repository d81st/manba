"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";
import type { ReviewCheckState } from "../server/review.actions";

type Labels = {
  note: string;
  noteHint: string;
  check: string;
  uncheck: string;
  saveNote: string;
  saved: Record<"check" | "uncheck" | "note", string>;
  failed: string;
};

// The mark and the remark of one item of «Что проверить». The pressed button
// sends what to do: mark as checked, take the mark off, or save the remark alone.
export function ReviewItemForm({
  id,
  checked,
  note,
  action: save,
  t,
}: {
  id: string;
  checked: boolean;
  note: string;
  action: (prev: ReviewCheckState, formData: FormData) => Promise<ReviewCheckState>;
  t: Labels;
}) {
  const [state, action, pending] = useActionState<ReviewCheckState, FormData>(save, {});
  return (
    <form action={action} className="space-y-3">
      <Field id={`${id}-note`} label={t.note} hint={t.noteHint}>
        <Textarea id={`${id}-note`} name="note" defaultValue={note} rows={2} maxLength={2000} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        {checked ? (
          <Button type="submit" name="decision" value="uncheck" variant="outline" disabled={pending}>
            {t.uncheck}
          </Button>
        ) : (
          <Button type="submit" name="decision" value="check" disabled={pending}>
            {t.check}
          </Button>
        )}
        <Button type="submit" name="decision" value="note" variant="ghost" disabled={pending}>
          {t.saveNote}
        </Button>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {state.failed ? <span className="text-destructive">{t.failed}</span> : state.saved ? t.saved[state.saved] : ""}
        </p>
      </div>
    </form>
  );
}
