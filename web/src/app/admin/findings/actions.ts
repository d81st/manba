"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { FINDINGS_TAG, saveFinding } from "@/lib/findings";
import { checkFindingInput } from "@/lib/findings-input";
import type { InputProblem } from "@/lib/input";

export type FindingFormState = { problems: InputProblem[]; saved?: boolean };

export async function saveFindingAction(id: number | null, _prev: FindingFormState, formData: FormData): Promise<FindingFormState> {
  const session = await requireAdmin();
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {}
  const { input, problems } = checkFindingInput(raw);
  if (!input) return { problems };
  const saved = await saveFinding(id, input, session.login);
  if (saved.problems.length) return { problems: saved.problems };
  updateTag(FINDINGS_TAG);
  if (!id) redirect(`/admin/findings/${saved.id}?saved=1`);
  return { problems: [], saved: true };
}
