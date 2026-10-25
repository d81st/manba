"use client";

import { Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/i18n";
import { slugify } from "@/lib/glossary-input";
import { PERSON_RELATION_KINDS, SIRA_STATUSES, type PersonInput, type PersonRelationInput } from "@/lib/sira-input";
import { Field } from "../field";
import { savePersonAction, type SiraFormState } from "./actions";
import { ChoiceSelect, FormNotes, messageOf } from "./form-kit";

type RelationRow = PersonRelationInput & { key: number };
let nextKey = 1;

const EMPTY: PersonInput = { slug: "", status: "draft", name: "", nameAr: "", forms: "", topic: null, relations: [], reason: "" };
const EMPTY_RELATION: PersonRelationInput = { other: "", kind: "parent", direction: "out", ref: "", quote: "", note: "", status: "draft" };

export function PersonForm({
  id,
  initial,
  people,
  topics,
  saved,
  messages,
}: {
  id: number | null;
  initial: PersonInput | null;
  people: { slug: string; name: string }[];
  topics: { id: number; name: string }[];
  saved: boolean;
  messages: Messages;
}) {
  const t = messages.admin.sira;
  const [form, setForm] = useState<PersonInput>(initial ?? EMPTY);
  const [relations, setRelations] = useState<RelationRow[]>((initial?.relations ?? []).map((r) => ({ ...r, key: nextKey++ })));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [state, action, pending] = useActionState<SiraFormState, FormData>(savePersonAction.bind(null, id), { problems: [], saved });
  const set = <K extends keyof PersonInput>(key: K, value: PersonInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setRelation = (key: number, patch: Partial<RelationRow>) =>
    setRelations((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));
  // The row keys stay in the form.
  const payload = JSON.stringify({ ...form, relations }, (name, value) => (name === "key" ? undefined : value));
  const others = people.filter((p) => p.slug !== form.slug);

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
          <Field id="name" label={t.name} error={problem("name")}>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value.split(",")[0]));
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
          <Field id="nameAr" label={t.nameAr} error={problem("nameAr")}>
            <Input id="nameAr" dir="rtl" lang="ar" className="ar text-lg" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          </Field>
          <Field id="status" label={t.status}>
            <ChoiceSelect
              id="status"
              value={form.status}
              choices={SIRA_STATUSES.map((s) => ({ value: s, label: messages.admin.statuses[s] }))}
              onChange={(v) => set("status", v ?? "draft")}
            />
          </Field>
          <Field id="forms" label={t.forms} hint={t.formsHint}>
            <Textarea id="forms" dir="rtl" lang="ar" rows={3} className="ar text-lg" value={form.forms} onChange={(e) => set("forms", e.target.value)} />
          </Field>
          <Field id="topic" label={t.card}>
            <ChoiceSelect id="topic" value={form.topic} none={t.noCard} choices={topics.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => set("topic", v)} />
          </Field>
          <Field id="reason" label={t.reason} hint={t.reasonHint} error={problem("reason")} wide>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.relationsTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.relationsHint}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {relations.map((r, i) => (
            <fieldset key={r.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <Field id={`other-${r.key}`} label={t.other} error={problem(`relations.${i}.other`)}>
                <ChoiceSelect
                  id={`other-${r.key}`}
                  value={r.other}
                  none="—"
                  choices={others.map((p) => ({ value: p.slug, label: p.name }))}
                  onChange={(v) => setRelation(r.key, { other: v ?? "" })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`kind-${r.key}`}>{t.kind}</Label>
                  <ChoiceSelect
                    id={`kind-${r.key}`}
                    value={r.kind}
                    choices={PERSON_RELATION_KINDS.map((k) => ({ value: k, label: t.relationKinds[k] }))}
                    onChange={(v) => setRelation(r.key, { kind: v ?? "parent" })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`status-${r.key}`}>{t.status}</Label>
                  <ChoiceSelect
                    id={`status-${r.key}`}
                    value={r.status}
                    choices={SIRA_STATUSES.map((s) => ({ value: s, label: messages.admin.statuses[s] }))}
                    onChange={(v) => setRelation(r.key, { status: v ?? "draft" })}
                  />
                </div>
              </div>
              <Field id={`direction-${r.key}`} label={t.direction} wide>
                <ChoiceSelect
                  id={`direction-${r.key}`}
                  value={r.direction}
                  choices={(["out", "in"] as const).map((d) => ({
                    value: d,
                    label: (d === "out" ? t.directionOut : t.directionIn).replace("{kind}", t.relationKinds[r.kind]),
                  }))}
                  onChange={(v) => setRelation(r.key, { direction: v ?? "out" })}
                />
              </Field>
              <Field id={`ref-${r.key}`} label={t.ref} error={problem(`relations.${i}.ref`)}>
                <Input id={`ref-${r.key}`} value={r.ref} onChange={(e) => setRelation(r.key, { ref: e.target.value })} />
              </Field>
              <Field id={`note-${r.key}`} label={t.note}>
                <Input id={`note-${r.key}`} value={r.note} onChange={(e) => setRelation(r.key, { note: e.target.value })} />
              </Field>
              <Field id={`quote-${r.key}`} label={t.quote} error={problem(`relations.${i}.quote`)} wide>
                <Textarea
                  id={`quote-${r.key}`}
                  dir="rtl"
                  lang="ar"
                  rows={2}
                  className="ar text-lg"
                  value={r.quote}
                  onChange={(e) => setRelation(r.key, { quote: e.target.value })}
                />
              </Field>
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setRelations((all) => all.filter((x) => x.key !== r.key))}>
                  <Trash2 />
                  {t.remove}
                </Button>
              </div>
            </fieldset>
          ))}
          <Button type="button" variant="outline" onClick={() => setRelations((all) => [...all, { ...EMPTY_RELATION, key: nextKey++ }])}>
            <Plus />
            {t.addRelation}
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
