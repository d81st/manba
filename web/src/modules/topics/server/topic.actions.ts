"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/shared/auth/auth";
import { TOPICS_TAG } from "../topic.constants";
import { checkTopicInput } from "../topic.validation";
import { deleteDraftTopic, saveTopic, saveTopicEvents } from "./topic.commands";
import { SIRA_TAG } from "@/modules/sira";
import type { InputProblem } from "@/shared/forms/input";

export type TopicFormState = { problems: InputProblem[]; saved?: boolean };

// The form sends its fields as one JSON value; everything is checked here again.
export async function saveTopicAction(
  id: number | null,
  _prev: TopicFormState,
  formData: FormData,
): Promise<TopicFormState> {
  const session = await requireAdmin();
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
  // The timeline of the sira counts the published topics of each event.
  updateTag(SIRA_TAG);
  if (!id) redirect(`/admin/topics/${result.id}?saved=1`);
  return { problems: [], saved: true };
}

export async function deleteTopicAction(id: number): Promise<{ ok: boolean }> {
  const session = await requireAdmin();
  const ok = await deleteDraftTopic(id, session.login);
  if (!ok) return { ok: false };
  updateTag(TOPICS_TAG);
  redirect("/admin/topics");
}

export type TopicEventsState = { saved?: boolean; failed?: boolean };

// The events of the Prophet's life a topic is about: the ticked boxes "event".
export async function saveTopicEventsAction(topicId: number, _prev: TopicEventsState, formData: FormData): Promise<TopicEventsState> {
  const session = await requireAdmin();
  const ids = formData
    .getAll("event")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  const ok = await saveTopicEvents(topicId, [...new Set(ids)], session.login);
  if (!ok) return { failed: true };
  updateTag(TOPICS_TAG);
  updateTag(SIRA_TAG);
  return { saved: true };
}
