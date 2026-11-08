"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/shared/auth/auth";
import { TOPICS_TAG } from "../topic.constants";
import { checkSideInput } from "../topic.validation";
import { saveSide } from "./side.commands";
import type { InputProblem } from "@/shared/forms/input";

export type SideFormState = { problems: InputProblem[]; saved?: boolean };

export async function saveSideAction(id: number | null, _prev: SideFormState, formData: FormData): Promise<SideFormState> {
  const session = await requireAdmin();
  const { input, problems } = checkSideInput({
    slug: formData.get("slug"),
    title: formData.get("title"),
    position: formData.get("position"),
  });
  if (!input) return { problems };
  const saveProblems = await saveSide(id, input, session.login);
  if (saveProblems.length) return { problems: saveProblems };
  // Side names appear on published topic pages.
  updateTag(TOPICS_TAG);
  return { problems: [], saved: true };
}
