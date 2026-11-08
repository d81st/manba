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
import { HISTORY_LAYERS, HISTORY_STATUSES, type HistoryDateInput, type HistoryEventInput } from "@/lib/history-input";
import { HIJRI_MONTHS } from "@/lib/sira-dates";
import { Field } from "@/components/ui/field";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { FormNotes, messageOf, NumberInput } from "../sira/form-kit";
import { saveHistoryAction, type HistoryFormState } from "./actions";
import { slugify } from "@/lib/input";

type DateRow = HistoryDateInput & { key: number };
let nextKey = 1;

const EMPTY: HistoryEventInput = { slug: "", layer: "rulers", status: "draft", title: "", topic: null, dates: [], reason: "" };
const EMPTY_DATE: HistoryDateInput = {
  ref: "",
  quote: "",
  holder: "",
  yearAh: null,
  yearCe: null,
  month: null,
  day: null,
  variant: false,
  note: "",
};

export function HistoryEventForm({
  id,
  initial,
  topics,
  saved,
  messages,
}: {
  id: number | null;
  initial: HistoryEventInput | null;
  topics: { id: number; name: string }[];
  saved: boolean;
  messages: Messages;
}) {
  const s = messages.admin.sira;
  const h = messages.admin.history;
  // The sira form strings, with the errors of this form added.
  const t = { ...s, errors: { ...s.errors, ...h.errors } };
  const [form, setForm] = useState<HistoryEventInput>(initial ?? EMPTY);
  const [dates, setDates] = useState<DateRow[]>((initial?.dates ?? []).map((d) => ({ ...d, key: nextKey++ })));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [state, action, pending] = useActionState<HistoryFormState, FormData>(saveHistoryAction.bind(null, id), {
    problems: [],
    saved,
  });
  const set = <K extends keyof HistoryEventInput>(key: K, value: HistoryEventInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setDate = (key: number, patch: Partial<DateRow>) => setDates((all) => all.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));
  const payload = JSON.stringify({ ...form, dates }, (name, value) => (name === "key" ? undefined : value));

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
          <CardTitle>{s.main}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label={s.nameField} error={problem("title")}>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field id="slug" label={s.slug} hint={s.slugHint} error={problem("slug")}>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field id="layer" label={h.layer}>
            <ChoiceSelect
              id="layer"
              value={form.layer}
              choices={HISTORY_LAYERS.map((l) => ({ value: l, label: messages.history.layers[l] }))}
              onChange={(v) => set("layer", v ?? "rulers")}
            />
          </Field>
          <Field id="status" label={s.status}>
            <ChoiceSelect
              id="status"
              value={form.status}
              choices={HISTORY_STATUSES.map((st) => ({ value: st, label: messages.admin.statuses[st] }))}
              onChange={(v) => set("status", v ?? "draft")}
            />
          </Field>
          <Field id="topic" label={h.card}>
            <ChoiceSelect
              id="topic"
              value={form.topic}
              none={s.noCard}
              choices={topics.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(v) => set("topic", v)}
            />
          </Field>
          <Field id="reason" label={s.reason} hint={s.reasonHint} error={problem("reason")}>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.datesTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{h.datesHint}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {problem("dates") && <p className="text-sm text-destructive">{problem("dates")}</p>}
          {dates.map((d, i) => (
            <fieldset key={d.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6">
              <Field id={`ref-${d.key}`} label={s.ref} error={problem(`dates.${i}.ref`)} wide>
                <Input id={`ref-${d.key}`} value={d.ref} onChange={(e) => setDate(d.key, { ref: e.target.value })} />
              </Field>
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor={`holder-${d.key}`}>{s.holder}</Label>
                <Input id={`holder-${d.key}`} value={d.holder} onChange={(e) => setDate(d.key, { holder: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-6">
                <Label htmlFor={`quote-${d.key}`}>{s.quote}</Label>
                <Textarea
                  id={`quote-${d.key}`}
                  dir="rtl"
                  lang="ar"
                  rows={2}
                  className="ar text-lg"
                  value={d.quote}
                  onChange={(e) => setDate(d.key, { quote: e.target.value })}
                />
                {problem(`dates.${i}.quote`) && <p className="text-sm text-destructive">{problem(`dates.${i}.quote`)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`ah-${d.key}`}>{h.yearAh}</Label>
                <NumberInput id={`ah-${d.key}`} value={d.yearAh} onChange={(v) => setDate(d.key, { yearAh: v })} />
                {problem(`dates.${i}.yearAh`) && <p className="text-sm text-destructive">{problem(`dates.${i}.yearAh`)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`ce-${d.key}`}>{h.yearCe}</Label>
                <NumberInput id={`ce-${d.key}`} value={d.yearCe} onChange={(v) => setDate(d.key, { yearCe: v })} />
                {problem(`dates.${i}.yearCe`) && <p className="text-sm text-destructive">{problem(`dates.${i}.yearCe`)}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`month-${d.key}`}>{s.month}</Label>
                <ChoiceSelect
                  id={`month-${d.key}`}
                  value={d.month}
                  none={s.noMonth}
                  choices={HIJRI_MONTHS.map((m, k) => ({ value: k + 1, label: `${k + 1}. ${m}` }))}
                  onChange={(v) => setDate(d.key, { month: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`day-${d.key}`}>{s.day}</Label>
                <NumberInput id={`day-${d.key}`} value={d.day} onChange={(v) => setDate(d.key, { day: v })} />
                {problem(`dates.${i}.day`) && <p className="text-sm text-destructive">{problem(`dates.${i}.day`)}</p>}
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox id={`variant-${d.key}`} checked={d.variant} onCheckedChange={(v) => setDate(d.key, { variant: v === true })} />
                <Label htmlFor={`variant-${d.key}`} className="font-normal">
                  {s.variant}
                </Label>
              </div>
              <div className="space-y-2 sm:col-span-5">
                <Label htmlFor={`note-${d.key}`}>{s.note}</Label>
                <Input id={`note-${d.key}`} value={d.note} onChange={(e) => setDate(d.key, { note: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setDates((all) => all.filter((x) => x.key !== d.key))}>
                  <Trash2 />
                  {s.remove}
                </Button>
              </div>
            </fieldset>
          ))}
          <Button type="button" variant="outline" onClick={() => setDates((all) => [...all, { ...EMPTY_DATE, key: nextKey++ }])}>
            <Plus />
            {s.addDate}
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {s.save}
      </Button>
    </form>
  );
}
