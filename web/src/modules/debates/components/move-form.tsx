"use client";

import { useActionState, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { MOVE_KINDS, type MoveKind } from "../debate.types";
import { MAX_BODY } from "../debate.validation";
import { type DebateFormState, postMoveAction } from "../server/debate.actions";
import { FormProblem } from "./form-problem";

const t = getMessages().debates;

// The fields stay under React state. A rejected move must not wipe what was typed:
// the browser resets uncontrolled fields when the action returns.
export function MoveForm({
  debateId,
  parents,
}: {
  debateId: number;
  parents: { id: number; depth: number; label: string }[];
}) {
  const [state, action, pending] = useActionState<DebateFormState, FormData>(postMoveAction, {});
  const [kind, setKind] = useState<MoveKind>("question");
  const [parent, setParent] = useState("");
  const [body, setBody] = useState("");
  const [address, setAddress] = useState("");
  return (
    <form action={action} className="mt-4 flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-4">
      <h2 className="text-lg font-semibold">{t.move}</h2>
      <input type="hidden" name="id" value={debateId} />
      {state.sent && <p role="status">{t.sent}</p>}
      <FormProblem code={state.problem} />
      <Field id="kind" label={t.kind}>
        <select
          id="kind"
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as MoveKind)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {MOVE_KINDS.map((item) => (
            <option key={item} value={item}>
              {t.kinds[item]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="parent" label={t.parent}>
        <select
          id="parent"
          name="parent"
          value={parent}
          onChange={(event) => setParent(event.target.value)}
          className="h-9 max-w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">{t.parentNone}</option>
          {parents.map((item) => (
            <option key={item.id} value={item.id}>
              {"· ".repeat(item.depth)}
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="body" label={t.body} hint={t.bodyHint}>
        <Textarea id="body" name="body" required maxLength={MAX_BODY} rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
      </Field>
      <Field id="address" label={t.address} hint={t.addressHint}>
        <Input id="address" name="address" maxLength={200} autoComplete="off" value={address} onChange={(event) => setAddress(event.target.value)} />
      </Field>
      <Button type="submit" disabled={pending} className="w-fit">
        {t.send}
      </Button>
    </form>
  );
}
