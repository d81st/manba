"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { TOPIC_STATUSES } from "../../topic.constants";
import type { TopicInput } from "../../topic.validation";
import type { AdminStrings, ErrorOf, SetField } from "./form-types";

// Status of the topic and the reason for a change (required once it is published).
export function PublishCard({
  step,
  form,
  set,
  errorOf,
  t,
}: {
  step?: string;
  form: TopicInput;
  set: SetField;
  errorOf: ErrorOf;
  t: AdminStrings;
}) {
  const f = t.topicForm;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step && <span className="mb-1 block text-sm font-normal text-muted-foreground">{step}</span>}
          {f.publishTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
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
        <Field id="reason" label={f.reason} hint={f.reasonHint} error={errorOf("reason")}>
          <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
        </Field>
      </CardContent>
    </Card>
  );
}
