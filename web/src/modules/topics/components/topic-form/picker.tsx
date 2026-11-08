"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Choice, FormStrings } from "./form-types";

// A list of chosen items with a select to add more.
export function Picker({
  label,
  placeholder,
  choices,
  chosen,
  onChange,
  error,
  f,
}: {
  label: string;
  placeholder: string;
  choices: Choice[];
  chosen: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  f: FormStrings;
}) {
  const [pick, setPick] = useState("");
  const names = Object.fromEntries(choices.map((c) => [c.id, c.name]));
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chosen.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 rounded-full border bg-card ps-3 text-sm">
              {names[id] ?? id}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={f.remove}
                onClick={() => onChange(chosen.filter((c) => c !== id))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Select value={pick} onValueChange={setPick}>
          <SelectTrigger className="w-72" aria-label={placeholder}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {choices
              .filter((c) => !chosen.includes(c.id))
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
          disabled={!pick}
          onClick={() => {
            onChange([...chosen, Number(pick)]);
            setPick("");
          }}
        >
          <Plus />
          {f.add}
        </Button>
      </div>
    </div>
  );
}
