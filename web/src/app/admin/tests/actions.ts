"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import type { InputProblem } from "@/lib/glossary-input";
import { QUIZ_TAG, saveQuestion } from "@/lib/quiz";
import { checkQuestionInput } from "@/lib/quiz-input";

export type QuestionFormState = { problems: InputProblem[]; saved?: boolean };

// The form sends its fields as one JSON value; everything is checked here again.
export async function saveQuestionAction(id: number | null, _prev: QuestionFormState, formData: FormData): Promise<QuestionFormState> {
  const session = await requireSession();
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {}
  const { input, problems } = checkQuestionInput(raw);
  if (!input) return { problems };
  const saved = await saveQuestion(id, input, session.login);
  if (saved.problems.length) return { problems: saved.problems };
  updateTag(QUIZ_TAG);
  if (!id) redirect(`/admin/tests/${saved.id}?saved=1`);
  return { problems: [], saved: true };
}
