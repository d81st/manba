import type { MapSura } from "../../quran.types";
import type { Lens } from "./map-types";

// Colors come from CSS custom properties (globals.css), so light and dark
// themes each use their own validated steps.
export type Palette = {
  cell: string;
  faint: string;
  meccan: string;
  medinan: string;
  juzA: string;
  juzB: string;
  match: string;
  ramp: string[];
  label: string;
  focus: string;
};

export function readPalette(element: HTMLElement): Palette {
  const style = getComputedStyle(element);
  const get = (name: string) => style.getPropertyValue(name).trim();
  return {
    cell: get("--map-cell"),
    faint: get("--map-faint"),
    meccan: get("--map-meccan"),
    medinan: get("--map-medinan"),
    juzA: get("--map-juz-a"),
    juzB: get("--map-juz-b"),
    match: get("--map-match"),
    ramp: get("--map-ramp").split(",").map((c) => c.trim()),
    label: get("--map-label"),
    focus: get("--map-focus"),
  };
}

// Equal-count bins of words per ayah, so the ramp uses all its steps.
export function lengthBins(suras: MapSura[], steps: number) {
  const all = suras.flatMap((s) => s.words).sort((a, b) => a - b);
  const bounds: number[] = [];
  for (let i = 1; i < steps; i++) bounds.push(all[Math.floor((all.length * i) / steps)]);
  return { bounds, min: all[0] ?? 0, max: all.at(-1) ?? 0 };
}

export type LengthBins = ReturnType<typeof lengthBins>;

// The color of one ayah cell under the chosen lens.
export function cellColor(
  lens: Lens,
  sura: MapSura,
  ayah: number,
  p: Palette,
  bins: LengthBins,
  matches: Set<string> | null,
  threadSet: Set<string> | null,
) {
  switch (lens) {
    case "place":
      return sura.place === "medinan" ? p.medinan : sura.place === "meccan" ? p.meccan : p.cell;
    case "juz":
      return sura.juz[ayah - 1] % 2 ? p.juzA : p.juzB;
    case "length": {
      const words = sura.words[ayah - 1];
      let step = bins.bounds.findIndex((bound) => words < bound);
      if (step === -1) step = bins.bounds.length;
      return p.ramp[Math.min(step, p.ramp.length - 1)];
    }
    case "search":
      if (!matches) return p.cell;
      return matches.has(`${sura.number}:${ayah}`) ? p.match : p.faint;
    case "thread":
      if (!threadSet) return p.cell;
      return threadSet.has(`${sura.number}:${ayah}`) ? p.match : p.faint;
    default:
      return p.cell;
  }
}
