import Link from "next/link";
import type { SiraEvent, SiraPlace } from "../sira.types";

// A place on the map with the events of the Prophet's life there.
export function PlaceCard({ place, events, suffix }: { place: SiraPlace; events: SiraEvent[]; suffix: string }) {
  return (
    <section
      id={place.slug}
      className="scroll-mt-4 rounded-xl border bg-card p-3 text-card-foreground shadow-sm target:border-primary target:ring-2 target:ring-ring/40"
    >
      <h3 className="flex flex-wrap items-baseline justify-between gap-2 font-medium">
        <span>{place.name}</span>
        <span className="ar text-lg font-normal" lang="ar" dir="rtl">
          {place.nameAr}
        </span>
      </h3>
      <ul className="mt-1 space-y-0.5 text-sm">
        {events.map((event) => (
          <li key={event.id}>
            <Link href={`/sira/events/${event.slug}${suffix}`}>{event.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
