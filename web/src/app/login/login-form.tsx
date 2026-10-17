"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import type { Messages } from "@/i18n/ru";
import { login, type LoginState } from "./actions";

export function LoginForm({ t }: { t: Messages["login"] }) {
  const next = useSearchParams().get("next") ?? "/";
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="login">{t.login}</label>
        <input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.login}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">{t.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="button" type="submit" disabled={pending}>
        {pending ? t.pending : t.submit}
      </button>
    </form>
  );
}
