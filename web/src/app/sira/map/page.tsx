import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/shared/layout/page";
import { type MapView, RegionMap } from "@/shared/content/region-map";
import { getMessages, plural } from "@/shared/i18n";
import { isDatabaseConfigured } from "@/shared/db";
import { isPreview } from "@/shared/auth/preview";
import { PreviewNote } from "@/shared/layout/preview";
import { PlaceCard, type SiraEvent, SiraNav } from "@/modules/sira";
import { getSiraData } from "@/modules/sira/server";

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

const VIEW: MapView = { west: 32.5, east: 46, south: 13.5, north: 32.5, scale: 46 };

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
  const preview = await isPreview(await searchParams);
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
          <RegionMap
            view={VIEW}
            label={t.mapPage.title}
            points={drawn.map((place) => {
              const count = eventsAt.get(place.slug)?.length ?? 0;
              return {
                slug: place.slug,
                name: place.name,
                lat: place.lat!,
                lon: place.lon!,
                size: 4 + Math.min(count, 12) * 0.7,
                title: `${place.name} — ${plural(count, t.mapPage.events)}`,
                label: LABELS[place.slug],
              };
            })}
          />
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
