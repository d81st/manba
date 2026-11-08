"use client";

import { Plus, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { RECOGNITIONS } from "@/shared/forms/input";
import type { AdminStrings, Definition, ErrorOf } from "./form-types";

let nextKey = 1;

// Gives each definition a stable key for React while it is edited.
export function withKeys(definitions: Omit<Definition, "key">[]): Definition[] {
  return definitions.map((d) => ({ ...d, key: nextKey++ }));
}

// How schools and scholars understand the term, each with its recognition and sources.
export function DefinitionsCard({
  definitions,
  setDefinitions,
  errorOf,
  t,
}: {
  definitions: Definition[];
  setDefinitions: Dispatch<SetStateAction<Definition[]>>;
  errorOf: ErrorOf;
  t: AdminStrings;
}) {
  const f = t.form;
  const setDefinition = (key: number, patch: Partial<Definition>) =>
    setDefinitions((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  return (
  <Card>
    <CardHeader>
      <CardTitle>{f.definitions}</CardTitle>
      <p className="text-sm text-muted-foreground">{f.definitionsHint}</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {definitions.map((definition, i) => (
        <fieldset key={definition.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <Field id={`holder-${definition.key}`} label={f.holder} error={errorOf(`definitions.${i}.holder`)}>
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
            error={errorOf(`definitions.${i}.text`)}
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
            error={errorOf(`definitions.${i}.refs`)}
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
            ...withKeys([{ holder: "", recognition: "tradition", text: "", sourceNote: "", refs: "" }]),
          ])
        }
      >
        <Plus />
        {f.addDefinition}
      </Button>
    </CardContent>
  </Card>
  );
}
