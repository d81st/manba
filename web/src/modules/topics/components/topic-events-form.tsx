"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import type { Messages } from "@/shared/i18n";
import { saveTopicEventsAction, type TopicEventsState } from "../server/topic.actions";

// The events of the Prophet's life a topic is about, as ticked boxes, saved
// apart from the topic form.
export function TopicEventsForm({
  topicId,
  linked,
  events,
  t,
}: {
  topicId: number;
  linked: number[];
  events: { id: number; title: string; status: string }[];
  t: Messages["admin"]["topicEvents"];
}) {
  const [state, action, pending] = useActionState<TopicEventsState, FormData>(saveTopicEventsAction.bind(null, topicId), {});
  return (
    <section id="events" className="mt-10 space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <form action={action} className="space-y-3 rounded-xl border bg-card p-4">
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id}>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="event" value={event.id} defaultChecked={linked.includes(event.id)} className="mt-1" />
                  <span>
                    {event.title}
                    {event.status !== "published" && <span className="text-muted-foreground"> ({t.draft})</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="outline" disabled={pending}>
              {t.save}
            </Button>
            {state.saved && <span className="text-sm text-muted-foreground">{t.saved}</span>}
            {state.failed && <span className="text-sm text-destructive">{t.failed}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
