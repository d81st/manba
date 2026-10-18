"use client";

import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, Plus, Trash2, X } from "lucide-react";
import { startTransition, useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/i18n";
import { RECOGNITIONS, slugify, type InputProblem } from "@/lib/glossary-input";
import { TOPIC_CATEGORIES, TOPIC_STATUSES, type TopicInput } from "@/lib/topics-input";
import { Field } from "../field";
import { deleteTopicAction, saveTopicAction, type TopicFormState } from "./actions";

type Position = TopicInput["positions"][number] & { key: number };
type Choice = { id: number; name: string };

const EMPTY: TopicInput = {
  slug: "",
  category: "general",
  status: "draft",
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

let nextKey = 1;

export function TopicForm({
  id,
  initial,
  sides,
  termChoices,
  topicChoices,
  saved,
  t,
}: {
  id: number | null;
  initial: TopicInput | null;
  sides: { id: number; title: string }[];
  termChoices: Choice[];
  topicChoices: Choice[];
  saved: boolean;
  t: Messages["admin"];
}) {
  const f = t.topicForm;
  const [form, setForm] = useState<TopicInput>(initial ?? EMPTY);
  const [positions, setPositions] = useState<Position[]>(
    (initial?.positions ?? []).map((p) => ({ ...p, key: nextKey++ })),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [deleteDenied, setDeleteDenied] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, action, pending] = useActionState<TopicFormState, FormData>(saveTopicAction.bind(null, id), {
    problems: [],
    saved,
  });

  const set = <K extends keyof TopicInput>(key: K, value: TopicInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setPosition = (key: number, patch: Partial<Position>) =>
    setPositions((current) => current.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const movePosition = (index: number, by: number) =>
    setPositions((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + by, 0, moved);
      return next;
    });

  const problemFor = (field: string) => state.problems.find((p) => p.field === field);
  const message = (problem?: InputProblem) =>
    problem &&
    `${t.topicErrors[problem.code as keyof typeof t.topicErrors] ?? t.topicErrors.invalid}${problem.detail ? `: ${problem.detail}` : ""}`;
  const payload = JSON.stringify({
    ...form,
    positions: positions.map((p) => ({
      sideId: p.sideId,
      holder: p.holder,
      recognition: p.recognition,
      text: p.text,
      sourceNote: p.sourceNote,
      refs: p.refs,
    })),
  });
  const publishedBefore = initial?.status === "published";

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

      <Card>
        <CardHeader>
          <CardTitle>{f.main}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label={f.title} error={message(problemFor("title"))}>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field id="slug" label={f.slug} hint={f.slugHint} error={message(problemFor("slug"))}>
            <Input
              id="slug"
              value={form.slug}
              disabled={publishedBefore}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field id="question" label={f.question} error={message(problemFor("question"))} wide>
            <Textarea id="question" rows={2} value={form.question} onChange={(e) => set("question", e.target.value)} />
          </Field>
          <Field id="category" label={f.category} hint={f.categoryHint} wide>
            <Select value={form.category} onValueChange={(value) => set("category", value as TopicInput["category"])}>
              <SelectTrigger id="category" className="sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPIC_CATEGORIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t.categories[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="mainRefs" label={f.mainRefs} hint={f.mainRefsHint} error={message(problemFor("mainRefs"))} wide>
            <Input id="mainRefs" value={form.mainRefs} onChange={(e) => set("mainRefs", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{f.circumstances}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="circumstances"
            label={f.circumstances}
            hint={f.circumstancesHint}
            error={message(problemFor("circumstances"))}
            wide
          >
            <Textarea
              id="circumstances"
              rows={6}
              value={form.circumstances}
              onChange={(e) => set("circumstances", e.target.value)}
            />
          </Field>
          <Field
            id="circumstancesRefs"
            label={f.circumstancesRefs}
            hint={f.refsHint}
            error={message(problemFor("circumstancesRefs"))}
          >
            <Input
              id="circumstancesRefs"
              value={form.circumstancesRefs}
              onChange={(e) => set("circumstancesRefs", e.target.value)}
            />
          </Field>
          <Field id="circumstancesNote" label={f.circumstancesNote}>
            <Input
              id="circumstancesNote"
              value={form.circumstancesNote}
              onChange={(e) => set("circumstancesNote", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{f.positions}</CardTitle>
          <p className="text-sm text-muted-foreground">{f.positionsHint}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {message(problemFor("positions")) && (
            <p className="text-sm text-destructive">{message(problemFor("positions"))}</p>
          )}
          {positions.map((position, i) => (
            <fieldset key={position.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <Field id={`side-${position.key}`} label={f.side}>
                <Select
                  value={String(position.sideId)}
                  onValueChange={(value) => setPosition(position.key, { sideId: Number(value) })}
                >
                  <SelectTrigger id={`side-${position.key}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sides.map((side) => (
                      <SelectItem key={side.id} value={String(side.id)}>
                        {side.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id={`recognition-${position.key}`} label={f.recognition}>
                <Select
                  value={position.recognition}
                  onValueChange={(value) =>
                    setPosition(position.key, { recognition: value as Position["recognition"] })
                  }
                >
                  <SelectTrigger id={`recognition-${position.key}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOGNITIONS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t.recognitions[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                id={`holder-${position.key}`}
                label={f.holder}
                error={message(problemFor(`positions.${i}.holder`))}
                wide
              >
                <Input
                  id={`holder-${position.key}`}
                  value={position.holder}
                  onChange={(e) => setPosition(position.key, { holder: e.target.value })}
                />
              </Field>
              <Field
                id={`text-${position.key}`}
                label={f.positionText}
                error={message(problemFor(`positions.${i}.text`))}
                wide
              >
                <Textarea
                  id={`text-${position.key}`}
                  rows={4}
                  value={position.text}
                  onChange={(e) => setPosition(position.key, { text: e.target.value })}
                />
              </Field>
              <Field
                id={`refs-${position.key}`}
                label={f.positionRefs}
                hint={f.refsHint}
                error={message(problemFor(`positions.${i}.refs`))}
              >
                <Input
                  id={`refs-${position.key}`}
                  value={position.refs}
                  onChange={(e) => setPosition(position.key, { refs: e.target.value })}
                />
              </Field>
              <Field id={`source-${position.key}`} label={f.sourceNote}>
                <Input
                  id={`source-${position.key}`}
                  value={position.sourceNote}
                  onChange={(e) => setPosition(position.key, { sourceNote: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap gap-1 sm:col-span-2">
                <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => movePosition(i, -1)}>
                  <ArrowUp />
                  {f.moveUp}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={i === positions.length - 1}
                  onClick={() => movePosition(i, 1)}
                >
                  <ArrowDown />
                  {f.moveDown}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPositions((current) => current.filter((p) => p.key !== position.key))}
                >
                  <X />
                  {f.removePosition}
                </Button>
              </div>
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={sides.length === 0}
            onClick={() =>
              setPositions((current) => [
                ...current,
                {
                  key: nextKey++,
                  sideId: sides[0].id,
                  holder: "",
                  recognition: "tradition",
                  text: "",
                  sourceNote: "",
                  refs: "",
                },
              ])
            }
          >
            <Plus />
            {f.addPosition}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{f.relatedRefs}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field id="relatedRefs" label={f.relatedRefs} hint={f.relatedRefsHint} error={message(problemFor("relatedRefs"))}>
            <Input id="relatedRefs" value={form.relatedRefs} onChange={(e) => set("relatedRefs", e.target.value)} />
          </Field>
          <Picker
            label={f.terms}
            placeholder={f.chooseTerm}
            choices={termChoices}
            chosen={form.terms}
            onChange={(ids) => set("terms", ids)}
            error={message(problemFor("terms"))}
            f={f}
          />
          <Picker
            label={f.related}
            placeholder={f.chooseTopic}
            choices={topicChoices}
            chosen={form.related}
            onChange={(ids) => set("related", ids)}
            error={message(problemFor("related"))}
            f={f}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field id="status" label={f.status}>
            <Select value={form.status} onValueChange={(value) => set("status", value as TopicInput["status"])}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPIC_STATUSES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t.statuses[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="reason" label={f.reason} hint={f.reasonHint} error={message(problemFor("reason"))}>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

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

// A list of chosen items with a select to add more.
function Picker({
  label,
  placeholder,
  choices,
  chosen,
  onChange,
  error,
  f,
}: {
  label: string;
  placeholder: string;
  choices: Choice[];
  chosen: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  f: Messages["admin"]["topicForm"];
}) {
  const [pick, setPick] = useState("");
  const names = Object.fromEntries(choices.map((c) => [c.id, c.name]));
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chosen.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 rounded-full border bg-card ps-3 text-sm">
              {names[id] ?? id}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={f.remove}
                onClick={() => onChange(chosen.filter((c) => c !== id))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Select value={pick} onValueChange={setPick}>
          <SelectTrigger className="w-72" aria-label={placeholder}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {choices
              .filter((c) => !chosen.includes(c.id))
              .map((choice) => (
                <SelectItem key={choice.id} value={String(choice.id)}>
                  {choice.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          disabled={!pick}
          onClick={() => {
            onChange([...chosen, Number(pick)]);
            setPick("");
          }}
        >
          <Plus />
          {f.add}
        </Button>
      </div>
    </div>
  );
}
