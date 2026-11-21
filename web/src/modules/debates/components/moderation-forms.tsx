"use client";

import { useActionState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { VERDICTS, type Verdict } from "../debate.types";
import { MAX_NOTE } from "../debate.validation";
import { type DebateFormState, checkMoveAction, publishDebateAction } from "../server/debate.actions";
import { FormProblem } from "./form-problem";

const t = getMessages().debates;

export function CheckForm({ debateId, moveId, verdict }: { debateId: number; moveId: number; verdict: Verdict | null }) {
  const [state, action, pending] = useActionState<DebateFormState, FormData>(checkMoveAction, {});
  return (
    <form action={action} className="mt-3 flex flex-col gap-2 border-t pt-3">
      <input type="hidden" name="id" value={debateId} />
      <input type="hidden" name="move" value={moveId} />
      <Label htmlFor={`verdict-${moveId}`}>{t.check}</Label>
      <select
        id={`verdict-${moveId}`}
        name="verdict"
        defaultValue={verdict ?? ""}
        required
        className="h-9 max-w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">{t.check}</option>
        {VERDICTS.map((item) => (
          <option key={item} value={item}>
            {t.verdicts[item]}
          </option>
        ))}
      </select>
      <Label htmlFor={`note-${moveId}`}>{t.checkNote}</Label>
      <Input id={`note-${moveId}`} name="note" maxLength={MAX_NOTE} />
      <p className="text-xs text-muted-foreground">{t.checkNoteHint}</p>
      <FormProblem code={state.problem} />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
        {t.checkSave}
      </Button>
    </form>
  );
}

export function PublishForm({ debateId, unchecked }: { debateId: number; unchecked: number }) {
  const [state, action, pending] = useActionState<DebateFormState, FormData>(publishDebateAction, {});
  return (
    <form action={action} className="mt-6 flex max-w-xl flex-col gap-2 rounded-xl border bg-card p-4">
      <input type="hidden" name="id" value={debateId} />
      <h2 className="text-lg font-semibold">{t.publish}</h2>
      <p className="text-sm text-muted-foreground">{t.publishHint}</p>
      {unchecked > 0 && <p className="text-sm text-destructive">{t.unchecked.replace("{n}", String(unchecked))}</p>}
      <Label htmlFor="editor-note">{t.publishNote}</Label>
      <Textarea id="editor-note" name="note" maxLength={MAX_NOTE} rows={3} />
      <FormProblem code={state.problem} />
      <Button type="submit" disabled={pending} className="w-fit">
        {t.publish}
      </Button>
    </form>
  );
}
