"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/input";
import type { TermInput } from "../../term.validation";
import type { AdminStrings, ErrorOf, SetField } from "./form-types";

// The term itself: Arabic, transliteration, translation, permanent id, short and
// detailed explanation, references, and its place among the first 50 terms.
export function MainCard({
  form,
  set,
  errorOf,
  isNew,
  publishedBefore,
  t,
}: {
  form: TermInput;
  set: SetField;
  errorOf: ErrorOf;
  isNew: boolean;
  publishedBefore: boolean;
  t: AdminStrings;
}) {
  const f = t.form;
  // A new term gets its id from the transliteration until the id is edited by hand.
  const [slugTouched, setSlugTouched] = useState(!isNew);
  return (
  <Card>
    <CardHeader>
      <CardTitle>{f.main}</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2">
      <Field id="arabic" label={f.arabic} error={errorOf("arabic")}>
        <Input
          id="arabic"
          dir="rtl"
          lang="ar"
          className="ar text-xl"
          value={form.arabic}
          onChange={(e) => set("arabic", e.target.value)}
        />
      </Field>
      <Field id="transliteration" label={f.transliteration} error={errorOf("transliteration")}>
        <Input
          id="transliteration"
          value={form.transliteration}
          onChange={(e) => {
            set("transliteration", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field id="translation" label={f.translation} error={errorOf("translation")}>
        <Input id="translation" value={form.translation} onChange={(e) => set("translation", e.target.value)} />
      </Field>
      <Field id="slug" label={f.slug} hint={f.slugHint} error={errorOf("slug")}>
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
      <Field id="short" label={f.short} error={errorOf("short")} wide>
        <Textarea id="short" rows={2} value={form.short} onChange={(e) => set("short", e.target.value)} />
      </Field>
      <Field id="detail" label={f.detail} hint={f.detailHint} wide>
        <Textarea id="detail" rows={8} value={form.detail} onChange={(e) => set("detail", e.target.value)} />
      </Field>
      <Field id="refs" label={f.refs} hint={f.refsHint} error={errorOf("refs")} wide>
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
          <Field id="basicOrder" label={f.basicOrder} error={errorOf("basicOrder")}>
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
  );
}
