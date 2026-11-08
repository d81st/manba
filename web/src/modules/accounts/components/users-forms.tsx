"use client";

import { CircleAlert, KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { Messages } from "@/shared/i18n/ru";
import type { UserRow } from "../account.types";
import { createUserAction, userAction, type UsersState } from "../server/user.actions";

type T = Messages["admin"]["users"];

function Secret({ t, text, login, password }: { t: T; text: string; login: string; password: string }) {
  return (
    <Alert>
      <KeyRound className="size-4" />
      <AlertDescription>
        <p>
          {text} <b>{login}</b>: <code className="rounded bg-muted px-1 font-mono">{password}</code>
        </p>
        <p className="text-muted-foreground">{t.showOnce}</p>
      </AlertDescription>
    </Alert>
  );
}

export function CreateUserForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState<UsersState, FormData>(createUserAction, {});
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="login">{t.login}</Label>
          <Input id="login" name="login" autoCapitalize="none" spellCheck={false} required className="w-56" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{t.role}</Label>
          <select id="role" name="role" defaultValue="reader" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="reader">{t.roles.reader}</option>
            <option value="admin">{t.roles.admin}</option>
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {t.create}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t.loginHint}</p>
      {state.problem && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>{t.problems[state.problem]}</AlertDescription>
        </Alert>
      )}
      {state.created && <Secret t={t} text={t.created} login={state.created.login} password={state.created.password} />}
    </form>
  );
}

export function UserRowForm({ t, user }: { t: T; user: UserRow }) {
  const [state, action, pending] = useActionState<UsersState, FormData>(userAction, {});
  const button = (value: string, label: string) => (
    <Button type="submit" name="do" value={value} variant="outline" size="sm" disabled={pending}>
      {label}
    </Button>
  );
  return (
    <li className="space-y-2 rounded-xl border bg-card p-4">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={user.id} />
        <input type="hidden" name="login" value={user.login} />
        <span className="font-medium">{user.login}</span>
        <span className="text-sm text-muted-foreground">
          {t.roles[user.role]}
          {user.disabled && ` · ${t.disabled}`}
          {user.mustChangePassword && ` · ${t.mustChange}`}
          {` · ${t.createdBy} ${user.createdBy}, ${user.createdAt}`}
        </span>
        <span className="ms-auto flex flex-wrap gap-2">
          {button("reset", t.reset)}
          {user.disabled ? button("enable", t.enable) : button("disable", t.disable)}
          {user.role === "admin" ? button("reader", t.makeReader) : button("admin", t.makeAdmin)}
        </span>
      </form>
      {state.reset && <Secret t={t} text={t.resetDone} login={state.reset.login} password={state.reset.password} />}
    </li>
  );
}
