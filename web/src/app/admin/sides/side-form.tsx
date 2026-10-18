"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Messages } from "@/i18n";
import { saveSideAction, type SideFormState } from "./actions";

type Side = { id: number; slug: string; title: string; position: number; used: number };

// One row of the sides list, or (side = null) the row that adds a new side.
export function SideForm({ side, nextPosition, t }: { side: Side | null; nextPosition: number; t: Messages["admin"]["sides"] }) {
  const [state, action, pending] = useActionState<SideFormState, FormData>(saveSideAction.bind(null, side?.id ?? null), {
    problems: [],
  });
  const errors = state.problems.map((p) => t.errors[p.code as keyof typeof t.errors] ?? t.errors.invalid);

  return (
    <form action={action} className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_12rem_6rem_auto] sm:items-end">
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">{t.name}</span>
        <Input name="title" defaultValue={side?.title ?? ""} required />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">{t.slug}</span>
        <Input name="slug" defaultValue={side?.slug ?? ""} required />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">{t.order}</span>
        <Input name="position" type="number" min={0} defaultValue={side?.position ?? nextPosition} />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant={side ? "outline" : "default"} disabled={pending}>
          {!side && <Plus />}
          {side ? t.save : t.add}
        </Button>
        {side && (
          <span className="text-xs text-muted-foreground">
            {t.used}: {side.used}
          </span>
        )}
      </div>
      {errors.length > 0 && <p className="text-sm text-destructive sm:col-span-4">{errors.join(" ")}</p>}
      {state.saved && errors.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-4">{t.saved}</p>}
    </form>
  );
}
