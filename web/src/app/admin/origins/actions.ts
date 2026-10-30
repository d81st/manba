"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import type { InputProblem } from "@/lib/glossary-input";
import { PARALLELS_TAG, saveParallel } from "@/lib/parallels";
import { checkParallelInput } from "@/lib/parallels-input";

export type ParallelFormState = { problems: InputProblem[]; saved?: boolean };

// The form sends its fields as one JSON value; everything is checked here again.
export async function saveParallelAction(id: number | null, _prev: ParallelFormState, formData: FormData): Promise<ParallelFormState> {
  const session = await requireSession();
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {}
  const { input, problems } = checkParallelInput(raw);
  if (!input) return { problems };
  const saved = await saveParallel(id, input, session.login);
  if (saved.problems.length) return { problems: saved.problems };
  updateTag(PARALLELS_TAG);
  if (!id) redirect(`/admin/origins/${saved.id}?saved=1`);
  return { problems: [], saved: true };
}
