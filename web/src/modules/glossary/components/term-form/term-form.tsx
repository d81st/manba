"use client";

import { CircleAlert, CircleCheck, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import type { InputProblem } from "@/shared/forms/input";
import { deleteTermAction, saveTermAction, type TermFormState } from "../../server/term.actions";
import type { TermInput } from "../../term.validation";
import { DefinitionsCard, withKeys } from "./definitions-card";
import type { AdminStrings, Definition, SetField } from "./form-types";
import { MainCard } from "./main-card";
import { PublishCard } from "./publish-card";
import { RelatedCard } from "./related-card";

const EMPTY: TermInput = {
  slug: "",
  arabic: "",
  transliteration: "",
  translation: "",
  short: "",
  detail: "",
  isBasic: false,
  basicOrder: null,
  status: "draft",
  refs: "",
  related: [],
  definitions: [],
  reason: "",
};

// The admin form of a glossary term (id = null for a new one). The cards edit
// parts of one state; the whole term is sent as one JSON value and checked again on the server.
export function TermForm({
  id,
  initial,
  choices,
  relatedNames,
  saved,
  t,
}: {
  id: number | null;
  initial: TermInput | null;
  choices: { id: number; name: string }[];
  relatedNames: Record<number, string>;
  saved: boolean;
  t: AdminStrings;
}) {
  const f = t.form;
  const [form, setForm] = useState<TermInput>(initial ?? EMPTY);
  const [definitions, setDefinitions] = useState<Definition[]>(() => withKeys(initial?.definitions ?? []));
  const [deleteDenied, setDeleteDenied] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, action, pending] = useActionState<TermFormState, FormData>(saveTermAction.bind(null, id), {
    problems: [],
    saved,
  });

  const set: SetField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const message = (problem?: InputProblem) =>
    problem &&
    `${t.errors[problem.code as keyof typeof t.errors] ?? t.errors.invalid}${problem.detail ? `: ${problem.detail}` : ""}`;
  const errorOf = (field: string) => message(state.problems.find((p) => p.field === field));
  const names: Record<number, string> = {
    ...relatedNames,
    ...Object.fromEntries(choices.map((c) => [c.id, c.name])),
  };
  const payload = JSON.stringify({
    ...form,
    definitions: definitions.map((d) => ({
      holder: d.holder,
      recognition: d.recognition,
      text: d.text,
      sourceNote: d.sourceNote,
      refs: d.refs,
    })),
  });

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        // Submitted by hand: a form `action` makes React reset the form afterwards,
        // and the reset would also reset the selects back to their first values.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="payload" value={payload} />

      {state.problems.length > 0 && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>
            <ul className="list-disc ps-4">
              {state.problems.map((problem, i) => (
                <li key={i}>{message(problem)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {state.saved && state.problems.length === 0 && !pending && (
        <Alert>
          <CircleCheck className="size-4" />
          <AlertDescription>{f.saved}</AlertDescription>
        </Alert>
      )}

      <MainCard form={form} set={set} errorOf={errorOf} isNew={!initial} publishedBefore={initial?.status === "published"} t={t} />
      <DefinitionsCard definitions={definitions} setDefinitions={setDefinitions} errorOf={errorOf} t={t} />
      <RelatedCard id={id} form={form} set={set} errorOf={errorOf} choices={choices} names={names} t={t} />
      <PublishCard form={form} set={set} errorOf={errorOf} t={t} />

      {deleteDenied && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>{f.deleteDenied}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? f.saving : f.save}
        </Button>
        {id && initial?.status === "draft" && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={deleting}
            onClick={() => {
              if (!window.confirm(f.deleteConfirm)) return;
              startDelete(async () => {
                const result = await deleteTermAction(id);
                if (!result.ok) setDeleteDenied(true);
              });
            }}
          >
            <Trash2 />
            {f.delete}
          </Button>
        )}
      </div>
    </form>
  );
}
