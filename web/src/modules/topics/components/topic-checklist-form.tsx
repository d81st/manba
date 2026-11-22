"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import type { TopicChecklistState } from "../server/topic.actions";

type Labels = { title: string; hint: string; save: string; saved: string; failed: string; empty: string; note: Record<string, string> };

// A list of ticked boxes saved apart from the topic form: the events of the
// Prophet's life a topic is about, the places it names. Each box sends "item".
export function TopicChecklistForm({
  id,
  linked,
  items,
  action: save,
  t,
}: {
  id: string;
  linked: number[];
  items: { id: number; title: string; status: string }[];
  action: (prev: TopicChecklistState, formData: FormData) => Promise<TopicChecklistState>;
  t: Labels;
}) {
  const [state, action, pending] = useActionState<TopicChecklistState, FormData>(save, {});
  return (
    <section id={id} className="mt-10 space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <form action={action} className="space-y-3 rounded-xl border bg-card p-4">
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="item" value={item.id} defaultChecked={linked.includes(item.id)} className="mt-1" />
                  <span>
                    {item.title}
                    {t.note[item.status] && <span className="text-muted-foreground"> ({t.note[item.status]})</span>}
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
