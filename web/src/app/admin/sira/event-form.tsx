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
import { slugify } from "@/lib/glossary-input";
import { HIJRI_MONTHS } from "@/lib/sira-dates";
import { EVENT_KINDS, SIRA_STATUSES, type EventDateInput, type EventInput } from "@/lib/sira-input";
import { Field } from "../field";
import { saveEventAction, type SiraFormState } from "./actions";
import { ChoiceSelect, FormNotes, messageOf, NumberInput } from "./form-kit";

type DateRow = EventDateInput & { key: number };
let nextKey = 1;

const EMPTY: EventInput = {
  slug: "",
  kind: "expedition",
  status: "draft",
  title: "",
  place: "",
  topic: null,
  position: 0,
  dates: [],
  reason: "",
};
const EMPTY_DATE: EventDateInput = {
  ref: "",
  quote: "",
  holder: "",
  year: null,
  month: null,
  day: null,
  age: null,
  variant: false,
  note: "",
};

export function EventForm({
  id,
  initial,
  places,
  topics,
  saved,
  messages,
}: {
  id: number | null;
  initial: EventInput | null;
  places: { slug: string; name: string }[];
  topics: { id: number; name: string }[];
  saved: boolean;
  messages: Messages;
}) {
  const t = messages.admin.sira;
  const [form, setForm] = useState<EventInput>(initial ?? EMPTY);
  const [dates, setDates] = useState<DateRow[]>((initial?.dates ?? []).map((d) => ({ ...d, key: nextKey++ })));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [state, action, pending] = useActionState<SiraFormState, FormData>(saveEventAction.bind(null, id), { problems: [], saved });
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setDate = (key: number, patch: Partial<DateRow>) => setDates((all) => all.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));
  // The row keys stay in the form.
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
          <CardTitle>{t.main}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label={t.nameField} error={problem("title")}>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field id="slug" label={t.slug} hint={t.slugHint} error={problem("slug")}>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field id="kind" label={t.kind}>
            <ChoiceSelect
              id="kind"
              value={form.kind}
              choices={EVENT_KINDS.map((k) => ({ value: k, label: messages.sira.kinds[k] }))}
              onChange={(v) => set("kind", v ?? "life")}
            />
          </Field>
          <Field id="status" label={t.status}>
            <ChoiceSelect
              id="status"
              value={form.status}
              choices={SIRA_STATUSES.map((s) => ({ value: s, label: messages.admin.statuses[s] }))}
              onChange={(v) => set("status", v ?? "draft")}
            />
          </Field>
          <Field id="place" label={t.place} error={problem("place")}>
            <ChoiceSelect
              id="place"
              value={form.place}
              none={t.noPlace}
              choices={places.map((p) => ({ value: p.slug, label: p.name }))}
              onChange={(v) => set("place", v ?? "")}
            />
          </Field>
          <Field id="topic" label={t.card}>
            <ChoiceSelect
              id="topic"
              value={form.topic}
              none={t.noCard}
              choices={topics.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(v) => set("topic", v)}
            />
          </Field>
          <Field id="position" label={t.position} hint={t.positionHint}>
            <NumberInput id="position" value={form.position} onChange={(v) => set("position", v ?? 0)} className="sm:w-32" />
          </Field>
          <Field id="reason" label={t.reason} hint={t.reasonHint} error={problem("reason")}>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.datesTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.datesHint}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {problem("dates") && <p className="text-sm text-destructive">{problem("dates")}</p>}
          {dates.map((d, i) => (
            <fieldset key={d.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6">
              <Field id={`ref-${d.key}`} label={t.ref} error={problem(`dates.${i}.ref`)} wide>
                <Input id={`ref-${d.key}`} value={d.ref} onChange={(e) => setDate(d.key, { ref: e.target.value })} />
              </Field>
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor={`holder-${d.key}`}>{t.holder}</Label>
                <Input id={`holder-${d.key}`} value={d.holder} onChange={(e) => setDate(d.key, { holder: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-6">
                <Label htmlFor={`quote-${d.key}`}>{t.quote}</Label>
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
                <Label htmlFor={`year-${d.key}`}>{t.year}</Label>
                <NumberInput id={`year-${d.key}`} value={d.year} onChange={(v) => setDate(d.key, { year: v })} />
                {problem(`dates.${i}.year`) && <p className="text-sm text-destructive">{problem(`dates.${i}.year`)}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`month-${d.key}`}>{t.month}</Label>
                <ChoiceSelect
                  id={`month-${d.key}`}
                  value={d.month}
                  none={t.noMonth}
                  choices={HIJRI_MONTHS.map((m, k) => ({ value: k + 1, label: `${k + 1}. ${m}` }))}
                  onChange={(v) => setDate(d.key, { month: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`day-${d.key}`}>{t.day}</Label>
                <NumberInput id={`day-${d.key}`} value={d.day} onChange={(v) => setDate(d.key, { day: v })} />
                {problem(`dates.${i}.day`) && <p className="text-sm text-destructive">{problem(`dates.${i}.day`)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`age-${d.key}`}>{t.age}</Label>
                <NumberInput id={`age-${d.key}`} value={d.age} onChange={(v) => setDate(d.key, { age: v })} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox id={`variant-${d.key}`} checked={d.variant} onCheckedChange={(v) => setDate(d.key, { variant: v === true })} />
                <Label htmlFor={`variant-${d.key}`} className="font-normal">
                  {t.variant}
                </Label>
              </div>
              <div className="space-y-2 sm:col-span-5">
                <Label htmlFor={`note-${d.key}`}>{t.note}</Label>
                <Input id={`note-${d.key}`} value={d.note} onChange={(e) => setDate(d.key, { note: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setDates((all) => all.filter((x) => x.key !== d.key))}>
                  <Trash2 />
                  {t.remove}
                </Button>
              </div>
            </fieldset>
          ))}
          <Button type="button" variant="outline" onClick={() => setDates((all) => [...all, { ...EMPTY_DATE, key: nextKey++ }])}>
            <Plus />
            {t.addDate}
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
