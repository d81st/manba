import Link from "next/link";
import { getMessages } from "@/shared/i18n";
import type { TopicPlace } from "../../topic.types";
import { SectionHeading } from "./section-heading";

const t = getMessages().topics;

// The place of a topic (a city): where it is on the map and the published
// events of the Prophet's life there.
export function PlaceSection({ place: { place, events } }: { place: TopicPlace }) {
  return (
    <section>
      <SectionHeading>{t.place}</SectionHeading>
      <p>
        {place.name}{" "}
        <span className="ar text-lg" lang="ar" dir="rtl">
          {place.nameAr}
        </span>
        {place.lat !== null && (
          <>
            {" · "}
            <Link href={`/cities#${place.slug}`}>{t.onMap}</Link>
          </>
        )}
      </p>
      {events.length > 0 && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">{t.placeEvents}</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-sm">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/sira/events/${event.slug}`}>{event.title}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
