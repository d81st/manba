"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/shared/auth/auth";
import type { InputProblem } from "@/shared/forms/input";
import { TOPICS_TAG } from "../topic.constants";
import { checkVersionPointInput } from "../topic.versions";
import { deleteVersionPoint, saveVersionPoint } from "./version.commands";

export type VersionPointFormState = { problems: InputProblem[]; saved?: boolean; deleted?: boolean };

// The form sends one row per position: holder[], quote[] and ref[] in the same order.
export async function saveVersionPointAction(
  topicId: number,
  pointId: number | null,
  _prev: VersionPointFormState,
  formData: FormData,
): Promise<VersionPointFormState> {
  const session = await requireAdmin();
  const holders = formData.getAll("holder").map(String);
  const quotes = formData.getAll("quote").map(String);
  const refs = formData.getAll("ref").map(String);
  const { input, problems } = checkVersionPointInput({
    label: formData.get("label"),
    position: formData.get("position"),
    cells: holders.map((holder, i) => ({ holder, quote: quotes[i] ?? "", ref: refs[i] ?? "" })),
  });
  if (!input) return { problems };
  const saveProblems = await saveVersionPoint(topicId, pointId, input, session.login);
  if (saveProblems.length) return { problems: saveProblems };
  updateTag(TOPICS_TAG);
  return { problems: [], saved: true };
}

export async function deleteVersionPointAction(topicId: number, pointId: number): Promise<VersionPointFormState> {
  const session = await requireAdmin();
  const deleted = await deleteVersionPoint(topicId, pointId, session.login);
  if (!deleted) return { problems: [{ field: "", code: "notFound" }] };
  updateTag(TOPICS_TAG);
  return { problems: [], deleted: true };
}
