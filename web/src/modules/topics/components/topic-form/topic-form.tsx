"use client";

import { CircleAlert, CircleCheck, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { deleteTopicAction, saveTopicAction, type TopicFormState } from "../../server/topic.actions";
import type { TopicInput } from "../../topic.validation";
import { CircumstancesCard } from "./circumstances-card";
import type { AdminStrings, Choice, Position, SetField } from "./form-types";
import { LinksCard } from "./links-card";
import { MainCard } from "./main-card";
import { PositionsCard, withKeys } from "./positions-card";
import { PublishCard } from "./publish-card";
import type { InputProblem } from "@/shared/forms/input";

const EMPTY: TopicInput = {
  slug: "",
  category: "general",
  status: "draft",
  place: "",
  title: "",
  question: "",
  mainRefs: "",
  circumstances: "",
  circumstancesNote: "",
  circumstancesRefs: "",
  relatedRefs: "",
  positions: [],
  terms: [],
  related: [],
  reason: "",
};

// The admin form of a topic (id = null for a new one). The cards edit parts of
// one state; the whole topic is sent as one JSON value and checked again on the server.
export function TopicForm({
  id,
  initial,
  sides,
  places,
  termChoices,
  topicChoices,
  saved,
  t,
}: {
  id: number | null;
  initial: TopicInput | null;
  sides: { id: number; title: string }[];
  places: { slug: string; name: string }[];
  termChoices: Choice[];
  topicChoices: Choice[];
  saved: boolean;
  t: AdminStrings;
}) {
  const f = t.topicForm;
  const [form, setForm] = useState<TopicInput>(initial ?? EMPTY);
  const [positions, setPositions] = useState<Position[]>(() => withKeys(initial?.positions ?? []));
  const [deleteDenied, setDeleteDenied] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, action, pending] = useActionState<TopicFormState, FormData>(saveTopicAction.bind(null, id), {
    problems: [],
    saved,
  });

  const set: SetField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const message = (problem?: InputProblem) =>
    problem &&
    `${t.topicErrors[problem.code as keyof typeof t.topicErrors] ?? t.topicErrors.invalid}${problem.detail ? `: ${problem.detail}` : ""}`;
  const errorOf = (field: string) => message(state.problems.find((p) => p.field === field));
  const payload = JSON.stringify({
    ...form,
    positions: positions.map(({ sideId, holder, recognition, text, sourceNote, refs }) => ({
      sideId,
      holder,
      recognition,
      text,
      sourceNote,
      refs,
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

      <MainCard
        form={form}
        set={set}
        errorOf={errorOf}
        places={places}
        isNew={!initial}
        publishedBefore={initial?.status === "published"}
        t={t}
      />
      <CircumstancesCard form={form} set={set} errorOf={errorOf} f={f} />
      <PositionsCard positions={positions} setPositions={setPositions} sides={sides} errorOf={errorOf} t={t} />
      <LinksCard form={form} set={set} errorOf={errorOf} termChoices={termChoices} topicChoices={topicChoices} f={f} />
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
                const result = await deleteTopicAction(id);
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
