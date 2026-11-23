"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field, FormAlert } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import type { Messages } from "@/shared/i18n/ru";
import { login, type LoginState } from "../server/login.actions";

export function LoginForm({ t }: { t: Messages["login"] }) {
  const next = useSearchParams().get("next") ?? "/";
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormAlert>{state.error}</FormAlert>
      <Field id="login" label={t.login} hint={t.loginHint}>
        <Input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.login}
          required
        />
      </Field>
      <Field id="password" label={t.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t.pending : t.submit}
      </Button>
    </form>
  );
}
