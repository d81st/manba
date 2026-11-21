"use client";

import { useActionState, useState } from "react";
import { activeLocale, getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { MAX_QUESTION, MIN_QUESTION } from "../debate.validation";
import { type DebateFormState, proposeDebateAction } from "../server/debate.actions";
import { FormProblem } from "./form-problem";

const t = getMessages().debates;

export function ProposeForm() {
  const [state, action, pending] = useActionState<DebateFormState, FormData>(proposeDebateAction, {});
  const [question, setQuestion] = useState("");
  const [partner, setPartner] = useState("");
  const [topic, setTopic] = useState("");
  return (
    <form action={action} className="mt-6 flex max-w-xl flex-col gap-4">
      <FormProblem code={state.problem} />
      <Field id="question" label={t.question} hint={t.questionHint}>
        <Textarea
          id="question"
          name="question"
          required
          minLength={MIN_QUESTION}
          maxLength={MAX_QUESTION}
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
      </Field>
      <Field id="partner" label={t.partner} hint={t.partnerHint}>
        <Input id="partner" name="partner" required maxLength={80} autoComplete="off" value={partner} onChange={(event) => setPartner(event.target.value)} />
      </Field>
      <Field id="language" label={t.language} hint={t.languageHint}>
        <select
          id="language"
          name="language"
          defaultValue={activeLocale()}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="ru">{t.languages.ru}</option>
          <option value="en">{t.languages.en}</option>
        </select>
      </Field>
      <Field id="topic" label={t.topic} hint={t.topicHint}>
        <Input id="topic" name="topic" maxLength={80} autoComplete="off" value={topic} onChange={(event) => setTopic(event.target.value)} />
      </Field>
      <Button type="submit" disabled={pending} className="w-fit">
        {t.propose}
      </Button>
    </form>
  );
}
