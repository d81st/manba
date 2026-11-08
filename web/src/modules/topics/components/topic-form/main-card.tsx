"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ChoiceSelect } from "@/shared/ui/choice-select";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { TOPIC_CATEGORIES } from "../../topic.constants";
import type { TopicInput } from "../../topic.validation";
import type { AdminStrings, ErrorOf, SetField } from "./form-types";
import { slugify } from "@/shared/forms/input";

// Title, permanent id, question, category, place on the map and the main texts.
export function MainCard({
  form,
  set,
  errorOf,
  places,
  isNew,
  publishedBefore,
  t,
}: {
  form: TopicInput;
  set: SetField;
  errorOf: ErrorOf;
  places: { slug: string; name: string }[];
  isNew: boolean;
  publishedBefore: boolean;
  t: AdminStrings;
}) {
  const f = t.topicForm;
  // A new topic gets its id from the title until the id is edited by hand.
  const [slugTouched, setSlugTouched] = useState(!isNew);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{f.main}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field id="title" label={f.title} error={errorOf("title")}>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
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
        <Field id="question" label={f.question} error={errorOf("question")} wide>
          <Textarea id="question" rows={2} value={form.question} onChange={(e) => set("question", e.target.value)} />
        </Field>
        <Field id="category" label={f.category} hint={f.categoryHint} wide>
          <Select value={form.category} onValueChange={(value) => set("category", value as TopicInput["category"])}>
            <SelectTrigger id="category" className="sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPIC_CATEGORIES.map((key) => (
                <SelectItem key={key} value={key}>
                  {t.categories[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="place" label={f.place} hint={f.placeHint} error={errorOf("place")} wide>
          <ChoiceSelect
            id="place"
            value={form.place}
            none={f.noPlace}
            choices={places.map((p) => ({ value: p.slug, label: p.name }))}
            onChange={(value) => set("place", value ?? "")}
            className="sm:w-72"
          />
        </Field>
        <Field id="mainRefs" label={f.mainRefs} hint={f.mainRefsHint} error={errorOf("mainRefs")} wide>
          <Input id="mainRefs" value={form.mainRefs} onChange={(e) => set("mainRefs", e.target.value)} />
        </Field>
      </CardContent>
    </Card>
  );
}
