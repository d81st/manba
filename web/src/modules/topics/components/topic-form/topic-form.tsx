"use client";

import { CircleAlert, Trash2 } from "lucide-react";
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
  // The box a problem is about: "mainRefs" -> #mainRefs, "positions.2.text" -> #text-<key of the third position>.
  const fieldId = (field: string) => {
    const m = field.match(/^positions\.(\d+)\.(holder|text|refs)$/);
    if (m) return positions[Number(m[1])] ? `${m[2]}-${positions[Number(m[1])].key}` : null;
    return /^[a-zA-Z]+$/.test(field) && field !== "positions" ? field : null;
  };
  const step = (n: number) => f.step.replace("{n}", String(n)).replace("{total}", "5");
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
            <p className="font-medium">{f.problemsTitle}</p>
            <ul className="mt-1 list-disc ps-4">
              {state.problems.map((problem, i) => {
                const target = fieldId(problem.field);
                return <li key={i}>{target ? <a href={`#${target}`}>{message(problem)}</a> : message(problem)}</li>;
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <MainCard
        step={step(1)}
        form={form}
        set={set}
        errorOf={errorOf}
        places={places}
        isNew={!initial}
        publishedBefore={initial?.status === "published"}
        t={t}
      />
      <CircumstancesCard step={step(2)} form={form} set={set} errorOf={errorOf} f={f} />
      <PositionsCard step={step(3)} positions={positions} setPositions={setPositions} sides={sides} errorOf={errorOf} t={t} />
      <LinksCard step={step(4)} form={form} set={set} errorOf={errorOf} termChoices={termChoices} topicChoices={topicChoices} f={f} />
      <PublishCard step={step(5)} form={form} set={set} errorOf={errorOf} t={t} />

      {deleteDenied && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>{f.deleteDenied}</AlertDescription>
        </Alert>
      )}
      {/* The save button stays at the foot of the screen while the form scrolls. */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? f.saving : f.save}
          </Button>
          {state.saved && state.problems.length === 0 && !pending && (
            <span role="status" className="text-sm text-muted-foreground">
              {f.saved}
            </span>
          )}
        </div>
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
