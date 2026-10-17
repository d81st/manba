"use server";

import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string };

const MIN_LENGTH = 8;

export async function setPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const t = getMessages().password;
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");

  if (password.length < MIN_LENGTH) return { error: t.tooShort };
  if (password !== repeat) return { error: t.mismatch };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: t.failed };

  redirect("/");
}
