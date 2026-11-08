"use client";

import { Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/i18n";
import { MAX_OPTIONS, QUIZ_STATUSES, type QuestionInput } from "../quiz.validation";
import { Field } from "@/components/ui/field";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { saveQuestionAction, type QuestionFormState } from "../server/quiz.actions";
import { FormNotes, messageOf } from "@/components/form-kit";

type OptionRow = QuestionInput["options"][number] & { key: number };
let nextKey = 1;

const EMPTY: QuestionInput = {
  status: "draft",
  prompt: "",
  note: "",
  options: [
    { text: "", correct: true },
    { text: "", correct: false },
  ],
  refs: "",
  topic: null,
  term: null,
  reason: "",
};

export function QuestionForm({
  id,
  initial,
  topics,
  terms,
  saved,
  messages,
}: {
  id: number | null;
  initial: QuestionInput | null;
  topics: { id: number; name: string }[];
  terms: { id: number; name: string }[];
  saved: boolean;
  messages: Messages;
}) {
  const t = messages.admin.tests;
  const start = initial ?? EMPTY;
  const [form, setForm] = useState<QuestionInput>(start);
  const [options, setOptions] = useState<OptionRow[]>(start.options.map((o) => ({ ...o, key: nextKey++ })));
  const [state, action, pending] = useActionState<QuestionFormState, FormData>(saveQuestionAction.bind(null, id), {
    problems: [],
    saved,
  });
  const set = <K extends keyof QuestionInput>(key: K, value: QuestionInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setOption = (key: number, patch: Partial<OptionRow>) => setOptions((all) => all.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));
  const payload = JSON.stringify({ ...form, options }, (name, value) => (name === "key" ? undefined : value));

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="payload" value={payload} />
      <FormNotes problems={state.problems} saved={state.saved} pending={pending} t={t} />

      <Card>
        <CardHeader>
          <CardTitle>{t.main}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="prompt" label={t.prompt} error={problem("prompt")} wide>
            <Textarea id="prompt" rows={3} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} />
          </Field>
          <Field id="status" label={t.status}>
            <ChoiceSelect
              id="status"
              value={form.status}
              choices={QUIZ_STATUSES.map((s) => ({ value: s, label: messages.admin.statuses[s] }))}
              onChange={(v) => set("status", v ?? "draft")}
            />
          </Field>
          <Field id="reason" label={t.reason} hint={t.reasonHint} error={problem("reason")}>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
          <Field id="topic" label={t.topic}>
            <ChoiceSelect
              id="topic"
              value={form.topic}
              none={t.none}
              choices={topics.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(v) => set("topic", v)}
            />
          </Field>
          <Field id="term" label={t.term}>
            <ChoiceSelect
              id="term"
              value={form.term}
              none={t.none}
              choices={terms.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(v) => set("term", v)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.options}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.optionsHint}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {problem("options") && <p className="text-sm text-destructive">{problem("options")}</p>}
          {options.map((o, i) => (
            <div key={o.key} className="flex flex-wrap items-center gap-3">
              <Label htmlFor={`option-${o.key}`} className="w-20 shrink-0">
                {t.option} {i + 1}
              </Label>
              <Input
                id={`option-${o.key}`}
                className="min-w-48 flex-1"
                value={o.text}
                onChange={(e) => setOption(o.key, { text: e.target.value })}
              />
              <span className="flex items-center gap-2">
                <Checkbox id={`correct-${o.key}`} checked={o.correct} onCheckedChange={(v) => setOption(o.key, { correct: v === true })} />
                <Label htmlFor={`correct-${o.key}`} className="font-normal">
                  {t.correct}
                </Label>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => setOptions((all) => all.filter((x) => x.key !== o.key))}>
                <Trash2 />
                {t.remove}
              </Button>
              {problem(`options.${i}.text`) && <p className="w-full text-sm text-destructive">{problem(`options.${i}.text`)}</p>}
            </div>
          ))}
          {options.length < MAX_OPTIONS && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOptions((all) => [...all, { text: "", correct: false, key: nextKey++ }])}
            >
              <Plus />
              {t.addOption}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.refs}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.refsHint}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="refs" label={t.refs} error={problem("refs")} wide>
            <Textarea id="refs" rows={2} value={form.refs} onChange={(e) => set("refs", e.target.value)} />
          </Field>
          <Field id="note" label={t.note} hint={t.noteHint} wide>
            <Textarea id="note" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
