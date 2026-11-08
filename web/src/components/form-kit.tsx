"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import type { Messages } from "@/i18n";
import type { InputProblem } from "@/lib/input";

export type SiraStrings = Messages["admin"]["sira"];
// What FormNotes and messageOf need: the forms of the sira and of «Истоки и связи» share them.
export type FormStrings = { saved: string; errors: { invalid: string } };

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
