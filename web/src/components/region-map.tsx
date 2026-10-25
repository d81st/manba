import land from "@/lib/geo/arabia-land.json";

// A map of a part of the region of web/src/lib/geo/arabia-land.json (Natural
// Earth land, public domain): an equirectangular view stretched by the cosine
// of its middle latitude, with points that link to the parts of the page
// below it. No interaction beyond the links, so it renders on the server.

export type MapView = { west: number; east: number; south: number; north: number; scale: number };
export type MapPoint = {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  size: number; // radius of the point
  title: string; // hover text
  label?: [number, number, "start" | "end" | "middle"]; // name offset, for points close to others
};

export function RegionMap({ view, points, label }: { view: MapView; points: MapPoint[]; label: string }) {
  const stretch = Math.cos((((view.north + view.south) / 2) * Math.PI) / 180);
  const width = (view.east - view.west) * stretch * view.scale;
  const height = (view.north - view.south) * view.scale;
  const project = (lon: number, lat: number) => [(lon - view.west) * stretch * view.scale, (view.north - lat) * view.scale] as const;
  const shape = land.rings
    .map((ring) => `M${ring.map(([lon, lat]) => project(lon, lat).map((v) => v.toFixed(1)).join(",")).join("L")}Z`)
    .join("");
  return (
    <svg viewBox={`0 0 ${width.toFixed(0)} ${height.toFixed(0)}`} className="block h-auto w-full" role="img" aria-label={label}>
      <path d={shape} className="fill-sira-land stroke-border" strokeWidth={1} />
      {points.map((point) => {
        const [x, y] = project(point.lon, point.lat);
        const [dx, dy, anchor] = point.label ?? [10, 4, "start"];
        return (
          <a key={point.slug} href={`#${point.slug}`}>
            <circle cx={x} cy={y} r={point.size} className="fill-primary stroke-card" strokeWidth={1.5}>
              <title>{point.title}</title>
            </circle>
            <text
              x={x + dx}
              y={y + dy}
              textAnchor={anchor}
              className="fill-foreground stroke-sira-land text-[13px] font-medium"
              strokeWidth={3}
              paintOrder="stroke"
            >
              {point.name}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
