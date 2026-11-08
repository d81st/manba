"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

// Radix Select takes no empty value: "none" stands for it.
const NONE = "__none";

// A select over a list of choices, with an optional "nothing chosen" item.
export function ChoiceSelect<T extends string | number>({
  id,
  value,
  choices,
  none,
  onChange,
  className = "",
}: {
  id?: string;
  value: T | null;
  choices: { value: T; label: string }[];
  none?: string;
  onChange: (value: T | null) => void;
  className?: string;
}) {
  return (
    <Select
      value={value === null || value === "" ? NONE : String(value)}
      onValueChange={(v) => onChange(v === NONE ? null : (choices.find((c) => String(c.value) === v)?.value ?? null))}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {none !== undefined && <SelectItem value={NONE}>{none}</SelectItem>}
        {choices.map((c) => (
          <SelectItem key={String(c.value)} value={String(c.value)}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
