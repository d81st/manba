import { type MapView, RegionMap } from "@/shared/content/region-map";
import { getMessages, plural } from "@/shared/i18n";
import { Reveal } from "@/shared/ui/reveal";
import type { SiraPlace } from "@/modules/sira";

const t = getMessages().topics;

const WIDTH = 640; // points of the drawing's width
const MARGIN = 3.5; // degrees beyond the outer places
const MIN_LON = 12; // degrees: a few places still show the seas and lands around them
const MIN_LAT = 8;
const LAND = { west: 26, south: 8, east: 64, north: 46 }; // the land outline's frame

// The view around the places, a margin beyond them on each side and wide
// enough to show the region, kept inside the frame of the land outline.
export function viewOf(places: { lat: number; lon: number }[]): MapView {
  const lats = places.map((p) => p.lat);
  const lons = places.map((p) => p.lon);
  let [south, north] = [Math.min(...lats) - MARGIN, Math.max(...lats) + MARGIN];
  let [west, east] = [Math.min(...lons) - MARGIN, Math.max(...lons) + MARGIN];
  if (north - south < MIN_LAT) [south, north] = [(south + north) / 2 - MIN_LAT / 2, (south + north) / 2 + MIN_LAT / 2];
  if (east - west < MIN_LON) [west, east] = [(west + east) / 2 - MIN_LON / 2, (west + east) / 2 + MIN_LON / 2];
  south = Math.max(LAND.south, south);
  north = Math.min(LAND.north, north);
  west = Math.max(LAND.west, west);
  east = Math.min(LAND.east, east);
  const stretch = Math.cos((((north + south) / 2) * Math.PI) / 180);
  return { west, east, south, north, scale: WIDTH / ((east - west) * stretch) };
}

type Anchor = "start" | "end" | "middle";
const CHAR = 7.2; // average width of a letter of the 13px labels, in drawing units
const OPTIONS: [number, number, Anchor][] = [
  [10, 4, "start"],
  [-10, 4, "end"],
  [0, 20, "middle"],
  [0, -10, "middle"],
];

// A side for each name, so that names neither cover one another nor run off
// the drawing: the first of right, left, below and above that is free.
export function placeLabels(points: { x: number; y: number; name: string }[], width: number, height: number): [number, number, Anchor][] {
  const boxes: [number, number, number, number][] = [];
  return points.map(({ x, y, name }) => {
    const w = name.length * CHAR;
    const boxOf = ([dx, dy, anchor]: [number, number, Anchor]): [number, number, number, number] => {
      const left = anchor === "start" ? x + dx : anchor === "end" ? x + dx - w : x + dx - w / 2;
      return [left, y + dy - 12, left + w, y + dy + 3];
    };
    const free = OPTIONS.find((option) => {
      const [l, t, r, b] = boxOf(option);
      if (l < 2 || r > width - 2 || t < 2 || b > height - 2) return false;
      return boxes.every(([bl, bt, br, bb]) => r < bl || l > br || b < bt || t > bb);
    });
    const chosen = free ?? OPTIONS[0];
    boxes.push(boxOf(chosen));
    return chosen;
  });
}

// The places a topic names, on the land around them, each with its name in
// Arabic; the points come from the gazetteer, with its credit.
export function MapSection({ places }: { places: SiraPlace[] }) {
  const drawn = places.filter((p): p is SiraPlace & { lat: number; lon: number } => p.lat !== null && p.lon !== null);
  const view = drawn.length > 0 ? viewOf(drawn) : null;
  const labels = view ? labelsFor(drawn, view) : [];
  return (
    <Reveal id="map" title={t.map} count={plural(places.length, t.counts.places)}>
      {view && (
        <div className="max-w-2xl overflow-hidden rounded-xl border bg-sira-sea">
          <RegionMap
            view={view}
            label={t.map}
            points={drawn.map((place, i) => ({
              slug: `place-${place.slug}`,
              name: place.name,
              lat: place.lat,
              lon: place.lon,
              size: 5,
              title: `${place.name} — ${place.nameAr}`,
              label: labels[i],
            }))}
          />
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {places.map((place) => (
          <li key={place.slug} id={`place-${place.slug}`} className="scroll-mt-4">
            {place.name}{" "}
            <span className="ar text-base" lang="ar" dir="rtl">
              {place.nameAr}
            </span>
            {place.lat === null && <span className="text-muted-foreground"> ({t.noCoords})</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t.mapCredit}</p>
    </Reveal>
  );
}

// The drawing's coordinates of the places, as RegionMap projects them.
function labelsFor(places: { lat: number; lon: number; name: string }[], view: MapView) {
  const stretch = Math.cos((((view.north + view.south) / 2) * Math.PI) / 180);
  const width = (view.east - view.west) * stretch * view.scale;
  const height = (view.north - view.south) * view.scale;
  return placeLabels(
    places.map((p) => ({ x: (p.lon - view.west) * stretch * view.scale, y: (view.north - p.lat) * view.scale, name: p.name })),
    width,
    height,
  );
}
