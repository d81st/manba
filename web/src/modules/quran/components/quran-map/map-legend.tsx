import { plural, type Messages } from "@/shared/i18n";
import type { Lens } from "./map-types";

// What the colors of the chosen lens mean.
export function Legend({
  lens,
  m,
  bins,
  matches,
  ayahs,
}: {
  lens: Lens;
  m: Messages["quran"]["map"];
  bins: { min: number; max: number };
  matches: Set<string> | null;
  ayahs: Messages["quran"]["ayahs"];
}) {
  if (lens === "place") {
    return (
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span className="ms-1.5 inline-block size-3 rounded-[3px]" style={{ background: "var(--map-meccan)" }} /> {m.legendMeccan}
        <span className="ms-1.5 inline-block size-3 rounded-[3px]" style={{ background: "var(--map-medinan)" }} /> {m.legendMedinan}
      </p>
    );
  }
  if (lens === "juz") {
    return (
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span className="ms-1.5 inline-block size-3 rounded-[3px]" style={{ background: "var(--map-juz-a)" }} />
        <span className="ms-1.5 inline-block size-3 rounded-[3px]" style={{ background: "var(--map-juz-b)" }} /> {m.legendJuz}
      </p>
    );
  }
  if (lens === "length") {
    return (
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {bins.min} <span className="inline-block h-2.5 w-24 rounded-[3px] bg-[linear-gradient(to_right,var(--map-ramp))]" /> {bins.max} {m.legendLength}
      </p>
    );
  }
  if (lens === "search" && matches) {
    return (
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span className="ms-1.5 inline-block size-3 rounded-[3px]" style={{ background: "var(--map-match)" }} />
        {matches.size ? `${m.searchFound}: ${plural(matches.size, ayahs)}` : m.searchNone}
      </p>
    );
  }
  return null;
}
