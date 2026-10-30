"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/i18n";
import { slugify } from "@/lib/glossary-input";
import { BASES, DEGREES, PARALLEL_KINDS, PARALLEL_STATUSES, type ParallelInput, TRADITIONS } from "@/lib/parallels-input";
import { Field } from "../field";
import { ChoiceSelect, FormNotes, messageOf } from "../sira/form-kit";
import { saveParallelAction, type ParallelFormState } from "./actions";

const EMPTY: ParallelInput = {
  slug: "",
  status: "draft",
  title: "",
  tradition: "judaism",
  kind: "retelling",
  degree: "parallel",
  basis: "text",
  islamRefs: "",
  externalRefs: "",
  basisRefs: "",
  basisNote: "",
  traditionReading: "",
  traditionRefs: "",
  traditionNote: "",
  researchReading: "",
  researchRefs: "",
  researchNote: "",
  reason: "",
};

export function ParallelForm({ id, initial, saved, messages }: { id: number | null; initial: ParallelInput | null; saved: boolean; messages: Messages }) {
  const t = messages.admin.origins;
  const o = messages.origins;
  const [form, setForm] = useState<ParallelInput>(initial ?? EMPTY);
  const [state, action, pending] = useActionState<ParallelFormState, FormData>(saveParallelAction.bind(null, id), { problems: [], saved });
  const set = <K extends keyof ParallelInput>(key: K, value: ParallelInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));
  const text = (key: keyof ParallelInput, label: string, hint?: string, rows = 3, dir?: "rtl") => (
    <Field id={key} label={label} hint={hint} error={problem(key)} wide>
      <Textarea id={key} rows={rows} dir={dir} value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} />
    </Field>
  );
  const choice = <K extends "status" | "tradition" | "kind" | "degree" | "basis">(key: K, label: string, values: readonly string[], names: Record<string, string>) => (
    <Field id={key} label={label} error={problem(key)}>
      <ChoiceSelect
        id={key}
        value={form[key] as string}
        choices={values.map((v) => ({ value: v, label: names[v] }))}
        onChange={(v) => v && set(key, v as ParallelInput[K])}
      />
    </Field>
  );

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="payload" value={JSON.stringify(form)} />
      <FormNotes problems={state.problems} saved={state.saved} pending={pending} t={t} />
      <Card>
        <CardHeader>
          <CardTitle>{t.main}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label={t.titleField} hint={t.titleHint} error={problem("title")}>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!id) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field id="slug" label={t.slug} hint={t.slugHint} error={problem("slug")}>
            <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
          </Field>
          {choice("tradition", t.tradition, TRADITIONS, o.traditions)}
          {choice("status", t.status, PARALLEL_STATUSES, messages.admin.statuses)}
          {choice("kind", t.kind, PARALLEL_KINDS, o.kinds)}
          {choice("degree", t.degree, DEGREES, o.degrees)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.sides}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {text("islamRefs", t.islamRefs, t.islamRefsHint, 2)}
          {text("externalRefs", t.externalRefs, t.externalRefsHint, 2)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.basisTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {choice("basis", t.basis, BASES, o.bases)}
          {text("basisRefs", t.basisRefs, t.basisRefsHint, 2)}
          {text("basisNote", t.basisNote, t.basisNoteHint, 4)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.readings}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.readingsHint}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {text("traditionReading", t.traditionReading, undefined, 5)}
          {text("traditionRefs", t.traditionRefs, t.islamRefsHint, 2)}
          {text("traditionNote", t.traditionNote, undefined, 2)}
          {text("researchReading", t.researchReading, undefined, 5)}
          {text("researchRefs", t.researchRefs, t.externalRefsHint, 2)}
          {text("researchNote", t.researchNote, undefined, 2)}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {text("reason", t.reason, t.reasonHint, 2)}
        </CardContent>
      </Card>
      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
