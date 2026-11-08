"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";
import type { TopicInput } from "../../topic.validation";
import type { Choice, ErrorOf, FormStrings, SetField } from "./form-types";
import { Picker } from "./picker";

// Related places in the library, glossary terms and related topics.
export function LinksCard({
  form,
  set,
  errorOf,
  termChoices,
  topicChoices,
  f,
}: {
  form: TopicInput;
  set: SetField;
  errorOf: ErrorOf;
  termChoices: Choice[];
  topicChoices: Choice[];
  f: FormStrings;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{f.relatedRefs}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field id="relatedRefs" label={f.relatedRefs} hint={f.relatedRefsHint} error={errorOf("relatedRefs")} wide>
          <Textarea id="relatedRefs" rows={4} value={form.relatedRefs} onChange={(e) => set("relatedRefs", e.target.value)} />
        </Field>
        <Picker
          label={f.terms}
          placeholder={f.chooseTerm}
          choices={termChoices}
          chosen={form.terms}
          onChange={(ids) => set("terms", ids)}
          error={errorOf("terms")}
          f={f}
        />
        <Picker
          label={f.related}
          placeholder={f.chooseTopic}
          choices={topicChoices}
          chosen={form.related}
          onChange={(ids) => set("related", ids)}
          error={errorOf("related")}
          f={f}
        />
      </CardContent>
    </Card>
  );
}
