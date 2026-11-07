"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/i18n";
import { VIDEO_STATUSES, type VideoInput } from "@/lib/videos-input";
import { Field } from "../field";
import { ChoiceSelect, FormNotes, messageOf } from "../sira/form-kit";
import { saveVideoAction, type VideoFormState } from "./actions";

const EMPTY: VideoInput = { url: "", title: "", channel: "", language: "", note: "", refs: "", topics: "", status: "draft" };

export function VideoForm({ id, initial, saved, messages }: { id: number | null; initial: VideoInput | null; saved: boolean; messages: Messages }) {
  const t = messages.admin.videos;
  const [form, setForm] = useState<VideoInput>(initial ?? EMPTY);
  const [state, action, pending] = useActionState<VideoFormState, FormData>(saveVideoAction.bind(null, id), { problems: [], saved });
  const set = <K extends keyof VideoInput>(key: K, value: VideoInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const problem = (field: string) => messageOf(t, state.problems.find((p) => p.field === field));

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="payload" value={JSON.stringify(form)} />
      <FormNotes problems={state.problems} saved={state.saved} pending={pending} t={t} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field id="url" label={t.url} hint={t.urlHint} error={problem("url")} wide>
            <Input id="url" value={form.url} onChange={(e) => set("url", e.target.value)} />
          </Field>
          <Field id="title" label={t.videoTitle} hint={t.videoTitleHint} error={problem("title")}>
            <Input id="title" dir="auto" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field id="channel" label={t.channel} error={problem("channel")}>
            <Input id="channel" dir="auto" value={form.channel} onChange={(e) => set("channel", e.target.value)} />
          </Field>
          <Field id="language" label={t.language} hint={t.languageHint} error={problem("language")}>
            <Input id="language" value={form.language} onChange={(e) => set("language", e.target.value)} />
          </Field>
          <Field id="status" label={t.status}>
            <ChoiceSelect
              id="status"
              value={form.status}
              choices={VIDEO_STATUSES.map((s) => ({ value: s, label: messages.admin.statuses[s] }))}
              onChange={(v) => set("status", (v ?? "draft") as VideoInput["status"])}
            />
          </Field>
          <Field id="refs" label={t.refs} hint={t.refsHint} error={problem("refs")} wide>
            <Textarea id="refs" rows={2} value={form.refs} onChange={(e) => set("refs", e.target.value)} />
          </Field>
          <Field id="topics" label={t.topics} hint={t.topicsHint} error={problem("topics")} wide>
            <Input id="topics" value={form.topics} onChange={(e) => set("topics", e.target.value)} />
          </Field>
          <Field id="note" label={t.note} hint={t.noteHint} error={problem("note")} wide>
            <Textarea id="note" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
        </CardContent>
      </Card>
      <Button type="submit" disabled={pending}>
        {t.save}
      </Button>
    </form>
  );
}
