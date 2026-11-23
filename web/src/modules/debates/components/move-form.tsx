"use client";

import { useActionState, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Field, NativeSelect } from "@/shared/ui/field";
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
    <form action={action} className="mt-4 flex max-w-xl flex-col gap-5 rounded-xl border bg-card p-4">
      <h2 className="text-lg font-semibold">{t.move}</h2>
      <input type="hidden" name="id" value={debateId} />
      {state.sent && <p role="status">{t.sent}</p>}
      <FormProblem code={state.problem} />
      {/* The kind of move as a choice of three, each with what it means. */}
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-base font-medium">{t.kind}</legend>
        {MOVE_KINDS.map((item) => (
          <label
            key={item}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-accent"
          >
            <input
              type="radio"
              name="kind"
              value={item}
              checked={kind === item}
              onChange={() => setKind(item)}
              className="mt-1 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium">{t.kinds[item]}</span>
              <span className="block text-sm text-muted-foreground">{t.kindHints[item]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Field id="parent" label={t.parent}>
        <NativeSelect id="parent" name="parent" value={parent} onChange={(event) => setParent(event.target.value)}>
          <option value="">{t.parentNone}</option>
          {parents.map((item) => (
            <option key={item.id} value={item.id}>
              {"· ".repeat(item.depth)}
              {item.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="body" label={t.body} hint={t.bodyHint}>
        <Textarea id="body" name="body" required maxLength={MAX_BODY} rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
      </Field>
      <Field id="address" label={t.address} hint={t.addressHint}>
        <Input id="address" name="address" maxLength={200} autoComplete="off" value={address} onChange={(event) => setAddress(event.target.value)} />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-fit">
        {t.send}
      </Button>
    </form>
  );
}
