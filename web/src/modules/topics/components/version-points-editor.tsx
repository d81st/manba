"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import type { Messages } from "@/shared/i18n";
import { deleteVersionPointAction, saveVersionPointAction, type VersionPointFormState } from "../server/version.actions";

type T = Messages["admin"]["versions"];
type Point = { id: number; label: string; position: number; cells: { holder: string; quote: string; ref: string }[] };

// «Версии рядом» of one topic: a form per question, a row per position, and
// a form that adds a question. Saved on its own, apart from the topic form.
export function VersionPointsEditor({ topicId, points, holders, t }: { topicId: number; points: Point[]; holders: string[]; t: T }) {
  return (
    <section id="versions" className="mt-10 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      </div>
      {holders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noPositions}</p>
      ) : (
        <>
          {points.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
          {points.map((point) => (
            <PointForm key={`${point.id}-${point.label}-${point.cells.length}`} topicId={topicId} point={point} holders={holders} t={t} />
          ))}
          <PointForm
            key={`new-${points.length}`}
            topicId={topicId}
            point={null}
            holders={holders}
            nextPosition={points.reduce((max, p) => Math.max(max, p.position + 1), 0)}
            t={t}
          />
        </>
      )}
    </section>
  );
}

function PointForm({
  topicId,
  point,
  holders,
  nextPosition = 0,
  t,
}: {
  topicId: number;
  point: Point | null;
  holders: string[];
  nextPosition?: number;
  t: T;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<VersionPointFormState, FormData>(
    saveVersionPointAction.bind(null, topicId, point?.id ?? null),
    { problems: [] },
  );
  const [deleting, startDelete] = useTransition();
  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state, router]);

  // The topic's positions in order, then cells naming a position the topic no longer has.
  const orphans = (point?.cells ?? []).filter((c) => !holders.includes(c.holder)).map((c) => c.holder);
  const rows = [...holders, ...orphans];
  const cellOf = (holder: string) => point?.cells.find((c) => c.holder === holder);
  const errors = state.problems.map((p) => {
    const text = t.errors[p.code as keyof typeof t.errors] ?? `${t.errors.invalid}: ${p.field}`;
    const row = p.field.match(/^cells\.(\d+)\./);
    return row ? `${rows[Number(row[1])]}: ${text}` : text;
  });

  return (
    <form
      // Submitted by hand, not through the form's action prop: a form action
      // clears the fields afterwards, and a refused quotation should stay to be corrected.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-3 rounded-xl border bg-card p-4"
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">{t.label}</span>
          <Input name="label" defaultValue={point?.label ?? ""} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">{t.order}</span>
          <Input name="position" type="number" min={0} defaultValue={point?.position ?? nextPosition} />
        </label>
      </div>
      <ul className="space-y-3">
        {rows.map((holder) => {
          const cell = cellOf(holder);
          const orphan = orphans.includes(holder);
          return (
            <li key={holder} className="grid gap-2 border-t pt-3 sm:grid-cols-[12rem_1fr_14rem]">
              <input type="hidden" name="holder" value={holder} />
              <div className="text-sm font-medium">
                {holder}
                {orphan && <p className="mt-1 text-xs font-normal text-destructive">{t.orphan}</p>}
              </div>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">{t.quote}</span>
                <Textarea name="quote" dir="rtl" lang="ar" className="ar text-base" defaultValue={cell?.quote ?? ""} rows={2} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">{t.ref}</span>
                <Input name="ref" defaultValue={cell?.ref ?? ""} placeholder={t.refExample} />
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={point ? "outline" : "default"} disabled={pending}>
          {!point && <Plus />}
          {point ? t.save : t.add}
        </Button>
        {point && (
          <Button
            type="button"
            variant="ghost"
            disabled={deleting}
            onClick={() =>
              startDelete(async () => {
                const result = await deleteVersionPointAction(topicId, point.id);
                if (result.deleted) router.refresh();
              })
            }
          >
            <Trash2 />
            {t.remove}
          </Button>
        )}
        {state.saved && errors.length === 0 && <span className="text-sm text-muted-foreground">{t.saved}</span>}
      </div>
      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
