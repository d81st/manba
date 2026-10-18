"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import type { InputProblem } from "@/lib/glossary-input";
import { deleteDraftTopic, saveTopic, TOPICS_TAG } from "@/lib/topics";
import { checkTopicInput } from "@/lib/topics-input";

export type TopicFormState = { problems: InputProblem[]; saved?: boolean };

// The form sends its fields as one JSON value; everything is checked here again.
export async function saveTopicAction(
  id: number | null,
  _prev: TopicFormState,
  formData: FormData,
): Promise<TopicFormState> {
  const session = await requireSession();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { problems: [{ field: "", code: "invalid" }] };
  }
  const { input, problems } = checkTopicInput(raw);
  if (!input || problems.length) return { problems };

  const result = await saveTopic(id, input, session.login);
  if (result.problems.length) return { problems: result.problems };
  updateTag(TOPICS_TAG);
  if (!id) redirect(`/admin/topics/${result.id}?saved=1`);
  return { problems: [], saved: true };
}

export async function deleteTopicAction(id: number): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const ok = await deleteDraftTopic(id, session.login);
  if (!ok) return { ok: false };
  updateTag(TOPICS_TAG);
  redirect("/admin/topics");
}
