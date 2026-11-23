"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FormAlert } from "@/shared/ui/field";
import { PasswordInput } from "@/shared/ui/password-input";
import type { Messages } from "@/shared/i18n/ru";
import { changePasswordAction, type PasswordState } from "../server/password.actions";

export function PasswordForm({ t }: { t: Messages["account"] }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  const problem = state.problem === "mainAdmin" ? t.mainAdmin : state.problem ? t.problems[state.problem] : null;

  return (
    <form action={action} className="max-w-md space-y-5">
      <FormAlert>{problem}</FormAlert>
      {state.saved && (
        <Alert>
          <CircleCheck className="size-4" />
          <AlertDescription>{t.saved}</AlertDescription>
        </Alert>
      )}
      <Field id="current" label={t.current}>
        <PasswordInput id="current" name="current" autoComplete="current-password" required />
      </Field>
      <Field id="next" label={t.next} hint={t.hint}>
        <PasswordInput id="next" name="next" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field id="repeat" label={t.repeat}>
        <PasswordInput id="repeat" name="repeat" autoComplete="new-password" minLength={10} required />
      </Field>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? t.pending : t.submit}
      </Button>
    </form>
  );
}
