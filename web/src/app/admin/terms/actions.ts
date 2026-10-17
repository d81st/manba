"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { deleteDraftTerm, GLOSSARY_TAG, saveTerm } from "@/lib/glossary";
import { checkTermInput, type InputProblem } from "@/lib/glossary-input";

export type TermFormState = { problems: InputProblem[]; saved?: boolean };

// The form sends its fields as one JSON value; everything is checked here again.
export async function saveTermAction(
  id: number | null,
  _prev: TermFormState,
  formData: FormData,
): Promise<TermFormState> {
  const session = await requireSession();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { problems: [{ field: "", code: "invalid" }] };
  }
  const { input, problems } = checkTermInput(raw);
  if (!input || problems.length) return { problems };

  const result = await saveTerm(id, input, session.login);
  if (result.problems.length) return { problems: result.problems };
  updateTag(GLOSSARY_TAG);
  if (!id) redirect(`/admin/terms/${result.id}?saved=1`);
  return { problems: [], saved: true };
}

export async function deleteTermAction(id: number): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const ok = await deleteDraftTerm(id, session.login);
  if (!ok) return { ok: false };
  updateTag(GLOSSARY_TAG);
  redirect("/admin/terms");
}
