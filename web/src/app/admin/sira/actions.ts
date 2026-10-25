"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import type { InputProblem } from "@/lib/glossary-input";
import { saveEvent, savePerson, savePlace, SIRA_TAG } from "@/lib/sira-events";
import { checkEventInput, checkPersonInput, checkPlaceInput } from "@/lib/sira-input";

export type SiraFormState = { problems: InputProblem[]; saved?: boolean };

// The forms send their fields as one JSON value; everything is checked here again.
function payload(formData: FormData): unknown {
  try {
    return JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return null;
  }
}

async function finish(id: number | null, saved: { id?: number; problems: InputProblem[] }, path: string): Promise<SiraFormState> {
  if (saved.problems.length) return { problems: saved.problems };
  updateTag(SIRA_TAG);
  if (!id) redirect(`/admin/sira/${path}/${saved.id}?saved=1`);
  return { problems: [], saved: true };
}

export async function saveEventAction(id: number | null, _prev: SiraFormState, formData: FormData): Promise<SiraFormState> {
  const session = await requireSession();
  const { input, problems } = checkEventInput(payload(formData));
  if (!input) return { problems };
  return finish(id, await saveEvent(id, input, session.login), "events");
}

export async function savePersonAction(id: number | null, _prev: SiraFormState, formData: FormData): Promise<SiraFormState> {
  const session = await requireSession();
  const { input, problems } = checkPersonInput(payload(formData));
  if (!input) return { problems };
  return finish(id, await savePerson(id, input, session.login), "people");
}

export async function savePlaceAction(id: number | null, _prev: SiraFormState, formData: FormData): Promise<SiraFormState> {
  const session = await requireSession();
  const { input, problems } = checkPlaceInput(payload(formData));
  if (!input) return { problems };
  return finish(id, await savePlace(id, input, session.login), "places");
}
