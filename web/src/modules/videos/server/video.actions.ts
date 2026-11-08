"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/shared/auth/auth";
import { VIDEOS_TAG } from "../video.constants";
import { checkVideoInput } from "../video.validation";
import { checkLinks } from "./video-links";
import { saveVideo } from "./video.commands";
import type { InputProblem } from "@/shared/forms/input";

export type VideoFormState = { problems: InputProblem[]; saved?: boolean };

export async function saveVideoAction(id: number | null, _prev: VideoFormState, formData: FormData): Promise<VideoFormState> {
  const session = await requireAdmin();
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {}
  const { input, problems } = checkVideoInput(raw);
  if (!input) return { problems };
  const saved = await saveVideo(id, input, session.login);
  if (saved.problems.length) return { problems: saved.problems };
  updateTag(VIDEOS_TAG);
  if (!id) redirect(`/admin/videos/${saved.id}?saved=1`);
  return { problems: [], saved: true };
}

export type CheckState = { checked?: number; unavailable?: number };

export async function checkLinksAction(): Promise<CheckState> {
  const session = await requireAdmin();
  const result = await checkLinks(session.login);
  updateTag(VIDEOS_TAG);
  return result;
}
