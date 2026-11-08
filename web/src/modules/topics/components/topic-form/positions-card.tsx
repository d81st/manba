"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import type { AdminStrings, ErrorOf, Position } from "./form-types";
import { RECOGNITIONS } from "@/shared/forms/input";

let nextKey = 1;

// Gives each position a stable key for React while it is edited.
export function withKeys(positions: Omit<Position, "key">[]): Position[] {
  return positions.map((p) => ({ ...p, key: nextKey++ }));
}

// Positions of the sides: who holds the view, how widely it is recognised, its text and references.
export function PositionsCard({
  positions,
  setPositions,
  sides,
  errorOf,
  t,
}: {
  positions: Position[];
  setPositions: Dispatch<SetStateAction<Position[]>>;
  sides: { id: number; title: string }[];
  errorOf: ErrorOf;
  t: AdminStrings;
}) {
  const f = t.topicForm;
  const setPosition = (key: number, patch: Partial<Position>) =>
    setPositions((current) => current.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const movePosition = (index: number, by: number) =>
    setPositions((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + by, 0, moved);
      return next;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{f.positions}</CardTitle>
        <p className="text-sm text-muted-foreground">{f.positionsHint}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorOf("positions") && <p className="text-sm text-destructive">{errorOf("positions")}</p>}
        {positions.map((position, i) => (
          <fieldset key={position.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
            <Field id={`side-${position.key}`} label={f.side}>
              <Select
                value={String(position.sideId)}
                onValueChange={(value) => setPosition(position.key, { sideId: Number(value) })}
              >
                <SelectTrigger id={`side-${position.key}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sides.map((side) => (
                    <SelectItem key={side.id} value={String(side.id)}>
                      {side.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={`recognition-${position.key}`} label={f.recognition}>
              <Select
                value={position.recognition}
                onValueChange={(value) => setPosition(position.key, { recognition: value as Position["recognition"] })}
              >
                <SelectTrigger id={`recognition-${position.key}`}>
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
            <Field id={`holder-${position.key}`} label={f.holder} error={errorOf(`positions.${i}.holder`)} wide>
              <Input
                id={`holder-${position.key}`}
                value={position.holder}
                onChange={(e) => setPosition(position.key, { holder: e.target.value })}
              />
            </Field>
            <Field id={`text-${position.key}`} label={f.positionText} error={errorOf(`positions.${i}.text`)} wide>
              <Textarea
                id={`text-${position.key}`}
                rows={4}
                value={position.text}
                onChange={(e) => setPosition(position.key, { text: e.target.value })}
              />
            </Field>
            <Field id={`refs-${position.key}`} label={f.positionRefs} hint={f.refsHint} error={errorOf(`positions.${i}.refs`)}>
              <Input
                id={`refs-${position.key}`}
                value={position.refs}
                onChange={(e) => setPosition(position.key, { refs: e.target.value })}
              />
            </Field>
            <Field id={`source-${position.key}`} label={f.sourceNote}>
              <Input
                id={`source-${position.key}`}
                value={position.sourceNote}
                onChange={(e) => setPosition(position.key, { sourceNote: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap gap-1 sm:col-span-2">
              <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => movePosition(i, -1)}>
                <ArrowUp />
                {f.moveUp}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={i === positions.length - 1}
                onClick={() => movePosition(i, 1)}
              >
                <ArrowDown />
                {f.moveDown}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPositions((current) => current.filter((p) => p.key !== position.key))}
              >
                <X />
                {f.removePosition}
              </Button>
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={sides.length === 0}
          onClick={() =>
            setPositions((current) => [
              ...current,
              ...withKeys([
                { sideId: sides[0].id, holder: "", recognition: "tradition", text: "", sourceNote: "", refs: "" },
              ]),
            ])
          }
        >
          <Plus />
          {f.addPosition}
        </Button>
      </CardContent>
    </Card>
  );
}
