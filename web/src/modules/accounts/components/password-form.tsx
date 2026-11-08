"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Messages } from "@/i18n/ru";
import { changePasswordAction, type PasswordState } from "../server/password.actions";

export function PasswordForm({ t }: { t: Messages["account"] }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  const problem = state.problem === "mainAdmin" ? t.mainAdmin : state.problem ? t.problems[state.problem] : null;

  return (
    <form action={action} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">{t.current}</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">{t.next}</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repeat">{t.repeat}</Label>
        <Input id="repeat" name="repeat" type="password" autoComplete="new-password" minLength={10} required />
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>
      {problem && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      )}
      {state.saved && (
        <Alert>
          <CircleCheck className="size-4" />
          <AlertDescription>{t.saved}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t.pending : t.submit}
      </Button>
    </form>
  );
}
