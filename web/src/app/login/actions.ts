"use server";

import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const t = getMessages();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const invalid = error.code === "invalid_credentials";
    return { error: invalid ? t.login.invalid : t.login.failed, email };
  }

  redirect(safeNext(formData.get("next")));
}
