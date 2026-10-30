"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Messages } from "@/i18n";
import type { InputProblem } from "@/lib/glossary-input";

export type SiraStrings = Messages["admin"]["sira"];
// What FormNotes and messageOf need: the forms of the sira and of «Истоки и связи» share them.
export type FormStrings = { saved: string; errors: { invalid: string } };

// Radix Select takes no empty value: "none" stands for it.
const NONE = "__none";

export function messageOf(t: FormStrings, problem?: InputProblem) {
  if (!problem) return undefined;
  const text = (t.errors as Record<string, string>)[problem.code] ?? t.errors.invalid;
  return `${text}${problem.detail ? `: ${problem.detail}` : ""}`;
}

export function FormNotes({ problems, saved, pending, t }: { problems: InputProblem[]; saved?: boolean; pending: boolean; t: FormStrings }) {
  return (
    <>
      {problems.length > 0 && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>
            <ul className="list-disc ps-4">
              {problems.map((problem, i) => (
                <li key={i}>
                  {problem.field ? `${problem.field}: ` : ""}
                  {messageOf(t, problem)}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {saved && problems.length === 0 && !pending && (
        <Alert>
          <CircleCheck className="size-4" />
          <AlertDescription>{t.saved}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

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

// A whole number or nothing.
export function NumberInput({
  id,
  value,
  onChange,
  className = "",
  step,
}: {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
  step?: string;
}) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      step={step}
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}
