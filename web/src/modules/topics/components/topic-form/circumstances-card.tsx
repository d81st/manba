"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TopicInput } from "../../topic.validation";
import type { ErrorOf, FormStrings, SetField } from "./form-types";

// Circumstances of the texts: the account itself, its references and the source note.
export function CircumstancesCard({
  form,
  set,
  errorOf,
  f,
}: {
  form: TopicInput;
  set: SetField;
  errorOf: ErrorOf;
  f: FormStrings;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{f.circumstances}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field id="circumstances" label={f.circumstances} hint={f.circumstancesHint} error={errorOf("circumstances")} wide>
          <Textarea
            id="circumstances"
            rows={6}
            value={form.circumstances}
            onChange={(e) => set("circumstances", e.target.value)}
          />
        </Field>
        <Field id="circumstancesRefs" label={f.circumstancesRefs} hint={f.refsHint} error={errorOf("circumstancesRefs")}>
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
  );
}
