import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import land from "@/lib/geo/arabia-land.json";
import { getSiraData, type SiraEvent, type SiraPlace } from "@/lib/sira-events";
import { isPreview, PreviewNote, SiraNav } from "../shared";

const messages = getMessages();
const t = messages.sira;

export const metadata: Metadata = { title: t.mapPage.title };

export default function MapPage({ searchParams }: PageProps<"/sira/map">) {
  return (
    <Page>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <SiraMap searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

// Equirectangular view of the region, stretched by the cosine of its middle latitude.
const VIEW = { west: 32.5, east: 46, south: 13.5, north: 32.5 };
const SCALE = 46;
const STRETCH = Math.cos((22.5 * Math.PI) / 180);
const WIDTH = (VIEW.east - VIEW.west) * STRETCH * SCALE;
const HEIGHT = (VIEW.north - VIEW.south) * SCALE;
const project = (lon: number, lat: number) => [(lon - VIEW.west) * STRETCH * SCALE, (VIEW.north - lat) * SCALE] as const;

const LAND = land.rings
  .map((ring) => `M${ring.map(([lon, lat]) => project(lon, lat).map((v) => v.toFixed(1)).join(",")).join("L")}Z`)
  .join("");

// Places close to each other get their names on another side: [dx, dy, anchor].
const LABELS: Record<string, [number, number, "start" | "end" | "middle"]> = {
  makka: [-10, 4, "end"],
  mina: [0, 20, "middle"],
  usfan: [-10, 4, "end"],
  abwa: [-10, 4, "end"],
  badr: [-10, 4, "end"],
  uhud: [-8, -8, "end"],
  madina: [10, 10, "start"],
};

async function SiraMap({ searchParams }: Pick<PageProps<"/sira/map">, "searchParams">) {
  await connection();
  const preview = isPreview(await searchParams);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const { places, events } = await getSiraData(preview);
  const suffix = preview ? "?drafts=1" : "";
  const eventsAt = new Map<string, SiraEvent[]>();
  for (const event of events) if (event.place) eventsAt.set(event.place, [...(eventsAt.get(event.place) ?? []), event]);
  const used = places.filter((p) => eventsAt.has(p.slug));
  const drawn = used.filter((p) => p.lat !== null && p.lon !== null);
  const undrawn = used.filter((p) => p.lat === null || p.lon === null);

  return (
    <>
      <SiraNav path="/sira/map" preview={preview} />
      <PreviewNote preview={preview} />
      <h1 className="mt-4 text-2xl font-semibold">{t.mapPage.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.mapPage.intro}</p>
      {events.length === 0 && <p className="mt-6 text-muted-foreground">{t.empty}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="self-start overflow-hidden rounded-xl border bg-sira-sea lg:sticky lg:top-4">
          <svg viewBox={`0 0 ${WIDTH.toFixed(0)} ${HEIGHT}`} className="block h-auto w-full" role="img" aria-label={t.mapPage.title}>
            <path d={LAND} className="fill-sira-land stroke-border" strokeWidth={1} />
            {drawn.map((place) => {
              const [x, y] = project(place.lon!, place.lat!);
              const count = eventsAt.get(place.slug)?.length ?? 0;
              const [dx, dy, anchor] = LABELS[place.slug] ?? [10, 4, "start"];
              return (
                <a key={place.slug} href={`#${place.slug}`}>
                  <circle cx={x} cy={y} r={4 + Math.min(count, 12) * 0.7} className="fill-primary stroke-card" strokeWidth={1.5}>
                    <title>{`${place.name} — ${plural(count, t.mapPage.events)}`}</title>
                  </circle>
                  <text
                    x={x + dx}
                    y={y + dy}
                    textAnchor={anchor}
                    className="fill-foreground stroke-sira-land text-[13px] font-medium"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {place.name}
                  </text>
                </a>
              );
            })}
          </svg>
        </div>
        <div className="space-y-3">
          {drawn.map((place) => (
            <PlaceCard key={place.slug} place={place} events={eventsAt.get(place.slug) ?? []} suffix={suffix} />
          ))}
          {undrawn.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.mapPage.noCoords}</h2>
              {undrawn.map((place) => (
                <PlaceCard key={place.slug} place={place} events={eventsAt.get(place.slug) ?? []} suffix={suffix} />
              ))}
            </>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">{t.mapPage.credit}</p>
    </>
  );
}

function PlaceCard({ place, events, suffix }: { place: SiraPlace; events: SiraEvent[]; suffix: string }) {
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
