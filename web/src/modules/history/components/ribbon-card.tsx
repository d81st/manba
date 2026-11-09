import Link from "next/link";
import { getMessages } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import type { RibbonEvent, RibbonLane } from "../history.ribbon";

const messages = getMessages();
const t = messages.history;

// One color per lane: what kind of event it is, nothing more.
export const LANE_COLOR: Record<RibbonLane, string> = {
  sira: "var(--primary)",
  rulers: "var(--graph-1)",
  texts: "var(--graph-2)",
  doctrine: "var(--graph-3)",
  science: "var(--graph-4)",
};

// The event chosen on the ribbon: every dated reading with whose words they
// are and where; when the sources differ, the spread is said in words.
export function RibbonCard({ event }: { event: RibbonEvent | null }) {
  return (
    <div className="mt-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm" aria-live="polite">
      {!event ? (
        <p className="text-sm text-muted-foreground">{t.ribbon.pick}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block size-2.5 rounded-full" style={{ background: LANE_COLOR[event.lane] }} />
            <h2 className="font-semibold">{event.title}</h2>
            <Badge variant="outline">{t.ribbon.lanes[event.lane]}</Badge>
            {event.draft && <Badge variant="secondary">{messages.admin.statuses.draft}</Badge>}
            <Link href={event.href} className="ms-auto text-sm">
              {event.lane === "sira" ? t.ribbon.page : t.ribbon.inList}
            </Link>
          </div>
          {new Set(event.readings.map((r) => r.date)).size > 1 && <p className="mt-1 text-sm text-muted-foreground">{t.ribbon.spread}</p>}
          <ul className="mt-2 space-y-1 text-sm">
            {event.readings.map((r, i) => (
              <li key={i}>
                <span className="font-medium tabular-nums">{r.date}</span>
                {r.variant && <span className="text-muted-foreground"> · {t.variant}</span>}
                {r.holder && <span className="text-muted-foreground"> · {r.holder}</span>}
                {" · "}
                <Link href={r.href}>{r.ref}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
