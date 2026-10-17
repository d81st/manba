"use client";

import { useActionState } from "react";
import type { Messages } from "@/i18n/ru";
import { setPassword, type PasswordState } from "./actions";

export function PasswordForm({ t }: { t: Messages["password"] }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    setPassword,
    {},
  );

  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="password">{t.newPassword}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="repeat">{t.repeat}</label>
        <input
          id="repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
          minLength={8}
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
