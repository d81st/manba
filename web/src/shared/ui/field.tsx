import { cloneElement, isValidElement } from "react";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/ui/utils";

// A form field as plain people read it: the label, then a hint in simple
// words, then the error (if any) right above the box it is about, then the
// box. The hint and the error are tied to the box for screen readers.
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: string; // "(необязательно)": said in words, not by a missing star
  wide?: boolean;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const box = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, { "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })
    : children;
  return (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2", error && "border-s-4 border-destructive ps-3")}>
      <Label htmlFor={id} className="text-base font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> {optional}</span>}
      </Label>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {box}
    </div>
  );
}

// A list to choose from, the browser's own (it works with every phone and
// screen reader), as tall as the other boxes.
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full max-w-full rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

// What went wrong with the whole form, at its top, in a box that is seen.
export function FormAlert({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/40 border-s-4 border-s-destructive bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
      {children}
    </p>
  );
}
