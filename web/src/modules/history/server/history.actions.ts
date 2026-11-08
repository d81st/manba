"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/shared/auth/auth";
import { HISTORY_TAG } from "../history.constants";
import { saveHistoryEvent } from "./history.commands";
import { checkHistoryEventInput } from "../history.validation";
import type { InputProblem } from "@/shared/forms/input";

export type HistoryFormState = { problems: InputProblem[]; saved?: boolean };

// The form sends its fields as one JSON value; everything is checked here again.
export async function saveHistoryAction(id: number | null, _prev: HistoryFormState, formData: FormData): Promise<HistoryFormState> {
  const session = await requireAdmin();
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {}
  const { input, problems } = checkHistoryEventInput(raw);
  if (!input) return { problems };
  const saved = await saveHistoryEvent(id, input, session.login);
  if (saved.problems.length) return { problems: saved.problems };
  updateTag(HISTORY_TAG);
  if (!id) redirect(`/admin/history/${saved.id}?saved=1`);
  return { problems: [], saved: true };
}
