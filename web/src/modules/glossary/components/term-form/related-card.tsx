"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { RELATION_KINDS } from "../../term.constants";
import type { TermInput } from "../../term.validation";
import type { AdminStrings, ErrorOf, Relation, SetField } from "./form-types";

// Related terms and how each relates to this one (broader, narrower, opposite…).
export function RelatedCard({
  id,
  form,
  set,
  errorOf,
  choices,
  names,
  t,
}: {
  id: number | null;
  form: TermInput;
  set: SetField;
  errorOf: ErrorOf;
  choices: { id: number; name: string }[];
  names: Record<number, string>;
  t: AdminStrings;
}) {
  const f = t.form;
  const [pickRelated, setPickRelated] = useState("");
  return (
  <Card>
    <CardHeader>
      <CardTitle>{f.related}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {errorOf("related") && <p className="text-sm text-destructive">{errorOf("related")}</p>}
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
  );
}
