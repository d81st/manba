"use client";

import { CircleAlert, CircleCheck, Plus, Trash2, X } from "lucide-react";
import { startTransition, useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/i18n";
import {
  RECOGNITIONS,
  RELATION_KINDS,
  slugify,
  TERM_STATUSES,
  type InputProblem,
  type TermInput,
} from "@/lib/glossary-input";
import { Field } from "../field";
import { deleteTermAction, saveTermAction, type TermFormState } from "./actions";

type Definition = TermInput["definitions"][number] & { key: number };
type Relation = TermInput["related"][number];

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

let nextKey = 1;

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
  t: Messages["admin"];
}) {
  const f = t.form;
  const [form, setForm] = useState<TermInput>(initial ?? EMPTY);
  const [definitions, setDefinitions] = useState<Definition[]>(
    (initial?.definitions ?? []).map((d) => ({ ...d, key: nextKey++ })),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [pickRelated, setPickRelated] = useState("");
  const [deleteDenied, setDeleteDenied] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, action, pending] = useActionState<TermFormState, FormData>(saveTermAction.bind(null, id), {
    problems: [],
    saved,
  });

  const set = <K extends keyof TermInput>(key: K, value: TermInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setDefinition = (key: number, patch: Partial<Definition>) =>
    setDefinitions((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const problemFor = (field: string) => state.problems.find((p) => p.field === field);
  const message = (problem?: InputProblem) =>
    problem &&
    `${t.errors[problem.code as keyof typeof t.errors] ?? t.errors.invalid}${problem.detail ? `: ${problem.detail}` : ""}`;
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
          <Field id="arabic" label={f.arabic} error={message(problemFor("arabic"))}>
            <Input
              id="arabic"
              dir="rtl"
              lang="ar"
              className="ar text-xl"
              value={form.arabic}
              onChange={(e) => set("arabic", e.target.value)}
            />
          </Field>
          <Field id="transliteration" label={f.transliteration} error={message(problemFor("transliteration"))}>
            <Input
              id="transliteration"
              value={form.transliteration}
              onChange={(e) => {
                set("transliteration", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field id="translation" label={f.translation} error={message(problemFor("translation"))}>
            <Input id="translation" value={form.translation} onChange={(e) => set("translation", e.target.value)} />
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
          <Field id="short" label={f.short} error={message(problemFor("short"))} wide>
            <Textarea id="short" rows={2} value={form.short} onChange={(e) => set("short", e.target.value)} />
          </Field>
          <Field id="detail" label={f.detail} hint={f.detailHint} wide>
            <Textarea id="detail" rows={8} value={form.detail} onChange={(e) => set("detail", e.target.value)} />
          </Field>
          <Field id="refs" label={f.refs} hint={f.refsHint} error={message(problemFor("refs"))} wide>
            <Input id="refs" value={form.refs} onChange={(e) => set("refs", e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="isBasic"
                checked={form.isBasic}
                onCheckedChange={(checked) => set("isBasic", checked === true)}
              />
              <Label htmlFor="isBasic" className="font-normal">
                {f.basic}
              </Label>
            </div>
            {form.isBasic && (
              <Field id="basicOrder" label={f.basicOrder} error={message(problemFor("basicOrder"))}>
                <Input
                  id="basicOrder"
                  type="number"
                  min={1}
                  className="w-28"
                  value={form.basicOrder ?? ""}
                  onChange={(e) => set("basicOrder", e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{f.definitions}</CardTitle>
          <p className="text-sm text-muted-foreground">{f.definitionsHint}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {definitions.map((definition, i) => (
            <fieldset key={definition.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <Field id={`holder-${definition.key}`} label={f.holder} error={message(problemFor(`definitions.${i}.holder`))}>
                <Input
                  id={`holder-${definition.key}`}
                  value={definition.holder}
                  onChange={(e) => setDefinition(definition.key, { holder: e.target.value })}
                />
              </Field>
              <Field id={`recognition-${definition.key}`} label={f.recognition}>
                <Select
                  value={definition.recognition}
                  onValueChange={(value) =>
                    setDefinition(definition.key, { recognition: value as Definition["recognition"] })
                  }
                >
                  <SelectTrigger id={`recognition-${definition.key}`}>
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
                id={`text-${definition.key}`}
                label={f.definitionText}
                error={message(problemFor(`definitions.${i}.text`))}
                wide
              >
                <Textarea
                  id={`text-${definition.key}`}
                  rows={3}
                  value={definition.text}
                  onChange={(e) => setDefinition(definition.key, { text: e.target.value })}
                />
              </Field>
              <Field
                id={`refs-${definition.key}`}
                label={f.refs}
                hint={f.refsHint}
                error={message(problemFor(`definitions.${i}.refs`))}
              >
                <Input
                  id={`refs-${definition.key}`}
                  value={definition.refs}
                  onChange={(e) => setDefinition(definition.key, { refs: e.target.value })}
                />
              </Field>
              <Field id={`source-${definition.key}`} label={f.sourceNote}>
                <Input
                  id={`source-${definition.key}`}
                  value={definition.sourceNote}
                  onChange={(e) => setDefinition(definition.key, { sourceNote: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDefinitions((current) => current.filter((d) => d.key !== definition.key))}
                >
                  <X />
                  {f.removeDefinition}
                </Button>
              </div>
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDefinitions((current) => [
                ...current,
                { key: nextKey++, holder: "", recognition: "tradition", text: "", sourceNote: "", refs: "" },
              ])
            }
          >
            <Plus />
            {f.addDefinition}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{f.related}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {message(problemFor("related")) && <p className="text-sm text-destructive">{message(problemFor("related"))}</p>}
          {form.related.length > 0 && (
            <ul className="space-y-2">
              {form.related.map((relation) => (
                <li key={relation.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-40 flex-1">{names[relation.id] ?? relation.id}</span>
                  <Select
                    value={relation.kind}
                    onValueChange={(kind) =>
                      set(
                        "related",
                        form.related.map((r) => (r.id === relation.id ? { ...r, kind: kind as Relation["kind"] } : r)),
                      )
                    }
                  >
                    <SelectTrigger className="w-48" aria-label={f.related}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATION_KINDS.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {t.relationKinds[kind]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={f.removeDefinition}
                    onClick={() => set("related", form.related.filter((r) => r.id !== relation.id))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Select value={pickRelated} onValueChange={setPickRelated}>
              <SelectTrigger className="w-72" aria-label={f.chooseTerm}>
                <SelectValue placeholder={f.chooseTerm} />
              </SelectTrigger>
              <SelectContent>
                {choices
                  .filter((c) => c.id !== id && !form.related.some((r) => r.id === c.id))
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
              disabled={!pickRelated}
              onClick={() => {
                set("related", [...form.related, { id: Number(pickRelated), kind: "related" }]);
                setPickRelated("");
              }}
            >
              <Plus />
              {f.addRelated}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field id="status" label={f.status}>
            <Select value={form.status} onValueChange={(value) => set("status", value as TermInput["status"])}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERM_STATUSES.map((key) => (
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
