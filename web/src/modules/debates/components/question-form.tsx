"use client";

import { useActionState, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { MAX_QUESTION, MIN_QUESTION } from "../debate.validation";
import { type DebateFormState, editQuestionAction, proposeQuestionAction } from "../server/debate.actions";
import { FormProblem } from "./form-problem";

const t = getMessages().debates;

// While the other person has not accepted, the proposer can still edit the
// question. After the debate is open, a new wording waits for both.
export function QuestionForm({ id, mode, current }: { id: number; mode: "edit" | "propose"; current?: string }) {
  const action = mode === "edit" ? editQuestionAction : proposeQuestionAction;
  const [state, formAction, pending] = useActionState<DebateFormState, FormData>(action, {});
  const [question, setQuestion] = useState(current ?? "");
  const fieldId = mode === "edit" ? "question" : "next-question";
  return (
    <form action={formAction} className="mt-4 flex max-w-xl flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor={fieldId}>{mode === "edit" ? t.question : t.change}</Label>
      <Textarea
        id={fieldId}
        name="question"
        required
        minLength={MIN_QUESTION}
        maxLength={MAX_QUESTION}
        rows={3}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <FormProblem code={state.problem} />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
        {mode === "edit" ? t.saveQuestion : t.changeSend}
      </Button>
    </form>
  );
}
