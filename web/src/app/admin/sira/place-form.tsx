"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Messages } from "@/i18n";
import { slugify } from "@/lib/glossary-input";
import type { PlaceInput } from "@/lib/sira-input";
import { Field } from "../field";
import { savePlaceAction, type SiraFormState } from "./actions";
import { FormNotes, messageOf, NumberInput } from "./form-kit";

const EMPTY: PlaceInput = { slug: "", name: "", nameAr: "", lat: null, lon: null, coordSource: "", reason: "" };

export function PlaceForm({ id, initial, saved, messages }: { id: number | null; initial: PlaceInput | null; saved: boolean; messages: Messages }) {
  const t = messages.admin.sira;
  const [form, setForm] = useState<PlaceInput>(initial ?? EMPTY);
  const [state, action, pending] = useActionState<SiraFormState, FormData>(savePlaceAction.bind(null, id), { problems: [], saved });
  const set = <K extends keyof PlaceInput>(key: K, value: PlaceInput[K]) => setForm((f) => ({ ...f, [key]: value }));
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
          <Field id="name" label={t.name} error={problem("name")}>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!id) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field id="slug" label={t.slug} hint={t.slugHint} error={problem("slug")}>
            <Input id="slug" value={form.slug} disabled={Boolean(id)} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
          </Field>
          <Field id="nameAr" label={t.nameAr} error={problem("nameAr")}>
            <Input id="nameAr" dir="rtl" lang="ar" className="ar text-lg" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="lat" label={t.lat} error={problem("lat")}>
              <NumberInput id="lat" step="0.00001" value={form.lat} onChange={(v) => set("lat", v)} />
            </Field>
            <Field id="lon" label={t.lon}>
              <NumberInput id="lon" step="0.00001" value={form.lon} onChange={(v) => set("lon", v)} />
            </Field>
          </div>
          <Field id="coordSource" label={t.coordSource} hint={t.coordSourceHint} error={problem("coordSource")} wide>
            <Input id="coordSource" value={form.coordSource} onChange={(e) => set("coordSource", e.target.value)} />
          </Field>
          <Field id="reason" label={t.reason} wide>
            <Input id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </CardContent>
      </Card>
      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
