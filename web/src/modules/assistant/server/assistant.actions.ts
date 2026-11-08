"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteSynonym, saveSynonym } from "./synonym.commands";
import { checkSynonymInput } from "../assistant.analysis";

// Plain forms without scripts: the result is shown by the address (?error=…).
export async function saveSynonymAction(formData: FormData) {
  const session = await requireAdmin();
  const raw = Number(formData.get("id") ?? 0);
  const id = Number.isInteger(raw) && raw > 0 ? raw : null;
  const { input, problems } = checkSynonymInput({
    phrase: String(formData.get("phrase") ?? ""),
    forms: String(formData.get("forms") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (problems.length) redirect(`/admin/assistant?error=${problems[0].code}`);
  const saved = await saveSynonym(id, input, session.login);
  if (saved.problems.length) redirect(`/admin/assistant?error=${saved.problems[0].code}`);
  revalidatePath("/admin/assistant");
  redirect("/admin/assistant?saved=1");
}

export async function deleteSynonymAction(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id") ?? 0);
  if (Number.isInteger(id) && id > 0) await deleteSynonym(id, session.login);
  revalidatePath("/admin/assistant");
  redirect("/admin/assistant?saved=1");
}
