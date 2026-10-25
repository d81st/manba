import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { type MapView, RegionMap } from "@/components/region-map";
import { Badge } from "@/components/ui/badge";
import { getMessages, plural } from "@/i18n";
import { isDatabaseConfigured } from "@/lib/db";
import { getSiraData } from "@/lib/sira-events";
import { listPublishedTopics, listTopicsForAdmin } from "@/lib/topics";
import { isPreview, PreviewNote } from "../sira/shared";

const messages = getMessages();
const t = messages.cities;

export const metadata: Metadata = { title: t.title };

// «Священные города» (docs/PLAN.md): the cities are topics of the category
// cities, each tied to its place on the map (migration 016).
export default function CitiesPage({ searchParams }: PageProps<"/cities">) {
  return (
    <Page>
      <h1 className="mt-8 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">{messages.hadith.loading}</p>}>
        <Cities searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const VIEW: MapView = { west: 32, east: 62, south: 18.5, north: 38, scale: 24 };
// Najaf and Karbala lie close to each other.
const LABELS: Record<string, [number, number, "start" | "end" | "middle"]> = {
  najaf: [0, 18, "middle"],
  karbala: [-8, -6, "end"],
  makka: [-10, 4, "end"],
  mashhad: [-10, 4, "end"],
};

async function Cities({ searchParams }: Pick<PageProps<"/cities">, "searchParams">) {
  await connection();
  const preview = isPreview(await searchParams);
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const [topics, { places, events }] = await Promise.all([
    preview ? listTopicsForAdmin(undefined, "cities") : listPublishedTopics(),
    getSiraData(preview),
  ]);
  const cities = topics
    .filter((topic) => topic.category === "cities" && topic.status !== "retired")
    .sort((a, b) => a.id - b.id);
  const placeOf = new Map(places.map((p) => [p.slug, p]));
  const eventsAt = (slug: string | null) => (slug ? events.filter((e) => e.place === slug).length : 0);
  const drawn = cities.flatMap((city) => {
    const place = city.place ? placeOf.get(city.place) : undefined;
    return place && place.lat !== null && place.lon !== null ? [{ city, place }] : [];
  });

  return (
    <>
      <div className="mt-2 flex justify-end text-sm">
        <Link href={preview ? "/cities" : "/cities?drafts=1"} className="text-muted-foreground">
          {preview ? messages.sira.publishedLink : messages.sira.previewLink}
        </Link>
      </div>
      <PreviewNote preview={preview} />
      {cities.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t.empty} <Link href="/admin/topics?category=cities">{t.drafts}</Link>
        </p>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="self-start overflow-hidden rounded-xl border bg-sira-sea lg:sticky lg:top-4">
            <RegionMap
              view={VIEW}
              label={t.map}
              points={drawn.map(({ city, place }) => ({
                slug: place.slug,
                name: place.name.split(" (")[0],
                lat: place.lat!,
                lon: place.lon!,
                size: 6,
                title: city.title,
                label: LABELS[place.slug],
              }))}
            />
          </div>
          <ul className="space-y-3">
            {cities.map((city) => {
              const place = city.place ? placeOf.get(city.place) : undefined;
              const count = eventsAt(city.place);
              return (
                <li key={city.id} id={city.place ?? undefined} className="scroll-mt-4">
                  <Link
                    href={`/topics/${city.slug}`}
                    className="flex flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground no-underline shadow-sm transition-colors hover:border-primary hover:bg-accent"
                  >
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{city.title}</span>
                      {place && (
                        <span className="ar text-lg" lang="ar" dir="rtl">
                          {place.nameAr}
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">{city.question}</span>
                    <span className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {!place && <span>{t.noPlace}</span>}
                      {count > 0 && <span>{plural(count, t.events)}</span>}
                      {city.status !== "published" && <Badge variant="outline">{messages.admin.statuses[city.status as keyof typeof messages.admin.statuses] ?? city.status}</Badge>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{t.credit}</p>
    </>
  );
}
