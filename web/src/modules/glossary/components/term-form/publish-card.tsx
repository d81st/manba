"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { TERM_STATUSES } from "@/shared/forms/input";
import type { TermInput } from "../../term.validation";
import type { AdminStrings, ErrorOf, SetField } from "./form-types";

// Status of the term and the reason for a change (required once it is published).
export function PublishCard({ form, set, errorOf, t }: { form: TermInput; set: SetField; errorOf: ErrorOf; t: AdminStrings }) {
  const f = t.form;
  return (
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
      <Field id="reason" label={f.reason} hint={f.reasonHint} error={errorOf("reason")}>
        <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
      </Field>
    </CardContent>
  </Card>
  );
}
