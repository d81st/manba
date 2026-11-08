"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import type { Messages } from "@/shared/i18n";
import { FINDING_STATUSES, type FindingInput } from "../finding.validation";
import { Field } from "@/shared/ui/field";
import { ChoiceSelect } from "@/shared/ui/choice-select";
import { saveFindingAction, type FindingFormState } from "../server/finding.actions";
import { FormNotes, messageOf } from "@/shared/forms/form-kit";

const EMPTY: FindingInput = {
  status: "new",
  leadUrl: "",
  leadDate: "",
  claimedSource: "",
  claimedText: "",
  found: "",
  searched: "",
  note: "",
  public: false,
  reason: "",
};

export function FindingForm({ id, initial, saved, messages }: { id: number | null; initial: FindingInput | null; saved: boolean; messages: Messages }) {
  const t = messages.admin.findings;
  const [form, setForm] = useState<FindingInput>(initial ?? EMPTY);
  const [state, action, pending] = useActionState<FindingFormState, FormData>(saveFindingAction.bind(null, id), { problems: [], saved });
  const set = <K extends keyof FindingInput>(key: K, value: FindingInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));

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
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field id="claimedSource" label={t.claimedSource} hint={t.claimedSourceHint} error={problem("claimedSource")}>
            <Input id="claimedSource" value={form.claimedSource} onChange={(e) => set("claimedSource", e.target.value)} />
          </Field>
          <Field id="status" label={t.status}>
            <ChoiceSelect
              id="status"
              value={form.status}
              choices={FINDING_STATUSES.map((s) => ({ value: s, label: t.statuses[s] }))}
              onChange={(v) => set("status", v ?? "new")}
            />
          </Field>
          <Field id="leadUrl" label={t.leadUrl} error={problem("leadUrl")}>
            <Input id="leadUrl" value={form.leadUrl} onChange={(e) => set("leadUrl", e.target.value)} />
          </Field>
          <Field id="leadDate" label={t.leadDate} error={problem("leadDate")}>
            <Input id="leadDate" type="date" value={form.leadDate} onChange={(e) => set("leadDate", e.target.value)} />
          </Field>
          <Field id="claimedText" label={t.claimedText} hint={t.claimedTextHint} error={problem("claimedText")} wide>
            <Textarea id="claimedText" rows={4} dir="auto" value={form.claimedText} onChange={(e) => set("claimedText", e.target.value)} />
          </Field>
          <Field id="found" label={t.found} hint={t.foundHint} error={problem("found")}>
            <Input id="found" value={form.found} onChange={(e) => set("found", e.target.value)} />
          </Field>
          <Field id="reason" label={t.reason} hint={t.reasonHint} error={problem("reason")}>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
          <Field id="searched" label={t.searched} hint={t.searchedHint} error={problem("searched")} wide>
            <Textarea id="searched" rows={3} value={form.searched} onChange={(e) => set("searched", e.target.value)} />
          </Field>
          <Field id="note" label={t.note} wide>
            <Textarea id="note" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
          <div className="flex items-start gap-2 sm:col-span-2">
            <Checkbox id="public" checked={form.public} onCheckedChange={(v) => set("public", v === true)} />
            <div>
              <Label htmlFor="public">{t.public}</Label>
              <p className="text-xs text-muted-foreground">{t.publicHint}</p>
              {problem("public") && <p className="text-sm text-destructive">{problem("public")}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
