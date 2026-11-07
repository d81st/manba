"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { Role } from "@/lib/session";
import { createUser, resetPassword, setDisabled, setRole } from "@/lib/users";

export type UsersState = {
  problem?: "login" | "taken" | "reserved";
  created?: { login: string; password: string };
  reset?: { login: string; password: string };
};

const role = (value: FormDataEntryValue | null): Role => (value === "admin" ? "admin" : "reader");

export async function createUserAction(_prev: UsersState, formData: FormData): Promise<UsersState> {
  const session = await requireAdmin();
  const result = await createUser(String(formData.get("login") ?? ""), role(formData.get("role")), session.login);
  if (result.problem) return { problem: result.problem };
  revalidatePath("/admin/users");
  return { created: { login: result.login!, password: result.password! } };
}

// One form per row: the button says what to do.
export async function userAction(_prev: UsersState, formData: FormData): Promise<UsersState> {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  const login = String(formData.get("login") ?? "");
  if (!Number.isInteger(id) || id <= 0) return {};
  switch (formData.get("do")) {
    case "reset": {
      const password = await resetPassword(id, session.login);
      revalidatePath("/admin/users");
      return password ? { reset: { login, password } } : {};
    }
    case "disable":
    case "enable":
      await setDisabled(id, formData.get("do") === "disable", session.login);
      break;
    case "admin":
    case "reader":
      await setRole(id, role(formData.get("do")), session.login);
      break;
  }
  revalidatePath("/admin/users");
  return {};
}
