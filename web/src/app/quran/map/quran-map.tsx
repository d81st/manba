"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { plural, type Messages } from "@/i18n";
import type { MapSura } from "@/lib/quran";
import { BLOCK_GAP, cellPosition, fittingCell, hitTest, layoutMap, type Layout } from "@/lib/quran-map-layout";
import styles from "./map.module.css";

type Lens = "none" | "place" | "juz" | "length" | "search";
type Order = "mushaf" | "revelation";
type Point = { sura: number; ayah: number };
type Card = Point & { left: number; top: number; pinned: boolean };

const LENSES: Lens[] = ["none", "place", "juz", "length", "search"];
const MIN_CELL = 3;
const MAX_CELL = 16;

// Colors come from CSS custom properties (map.module.css), so light and dark
// themes each use their own validated steps.
type Palette = {
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

function readPalette(element: HTMLElement): Palette {
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
function lengthBins(suras: MapSura[], steps: number) {
  const all = suras.flatMap((s) => s.words).sort((a, b) => a - b);
  const bounds: number[] = [];
  for (let i = 1; i < steps; i++) bounds.push(all[Math.floor((all.length * i) / steps)]);
  return { bounds, min: all[0] ?? 0, max: all.at(-1) ?? 0 };
}

export function QuranMap({ suras, t }: { suras: MapSura[]; t: Messages["quran"] }) {
  const m = t.map;
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [cell, setCell] = useState<number | null>(null);
  const [lens, setLens] = useState<Lens>("place");
  const [order, setOrder] = useState<Order>("mushaf");
  const [focus, setFocus] = useState<Point | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Set<string> | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);

  const bySura = useMemo(() => new Map(suras.map((s) => [s.number, s])), [suras]);
  const ordered = useMemo(() => {
    const list = [...suras];
    if (order === "revelation") list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return list.map((s) => ({ sura: s.number, ayahs: s.words.length }));
  }, [suras, order]);
  const bins = useMemo(() => lengthBins(suras, 7), [suras]);

  // Container width and initial zoom.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);
  // Until the reader zooms, the cell size is the one that fits the width.
  const cellSize = cell ?? (width ? fittingCell(ordered, width, MIN_CELL, 10) : null);

  // Theme colors, re-read when the color scheme changes.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const update = () => setPalette(readPalette(wrap));
    update();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const layout: Layout | null = useMemo(
    () => (width && cellSize ? layoutMap(ordered, width, cellSize) : null),
    [ordered, width, cellSize],
  );

  const colorOf = useCallback(
    (sura: MapSura, ayah: number, p: Palette) => {
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
        default:
          return p.cell;
      }
    },
    [lens, bins, matches],
  );

  // Draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || !palette) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(layout.width * ratio);
    canvas.height = Math.ceil(layout.height * ratio);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, layout.width, layout.height);
    ctx.font = "10px system-ui, sans-serif";
    ctx.textBaseline = "bottom";

    const step = layout.cell + layout.gap;
    for (const block of layout.blocks) {
      const sura = bySura.get(block.sura)!;
      const label = String(block.sura);
      if (ctx.measureText(label).width <= block.width + BLOCK_GAP - 2) {
        ctx.fillStyle = palette.label;
        ctx.fillText(label, block.x, block.y - 2);
      }
      for (let i = 0; i < block.ayahs; i++) {
        ctx.fillStyle = colorOf(sura, i + 1, palette);
        const x = block.x + (i % block.cols) * step;
        const y = block.y + Math.floor(i / block.cols) * step;
        ctx.fillRect(x, y, layout.cell, layout.cell);
      }
    }

    if (focus) {
      const block = layout.blocks.find((b) => b.sura === focus.sura);
      if (block) {
        const { x, y } = cellPosition(layout, block, focus.ayah);
        ctx.strokeStyle = palette.focus;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, layout.cell + 2, layout.cell + 2);
      }
    }
  }, [layout, palette, bySura, colorOf, focus]);

  // Ayah text for the card, fetched once per ayah.
  const loadText = useCallback(
    async (point: Point) => {
      const key = `${point.sura}:${point.ayah}`;
      if (texts[key] !== undefined) return;
      try {
        const response = await fetch(`/api/quran/ayah?a=${key}`);
        if (response.ok) {
          const data = (await response.json()) as { text: string };
          setTexts((current) => ({ ...current, [key]: data.text }));
        }
      } catch {
        // The card still shows the address and data without the text.
      }
    },
    [texts],
  );

  const showCard = useCallback(
    (point: Point, pinned: boolean) => {
      if (!layout) return;
      const block = layout.blocks.find((b) => b.sura === point.sura);
      if (!block) return;
      const { x, y } = cellPosition(layout, block, point.ayah);
      // Keep the floating card inside the map: flip it to the left near the edge.
      const cardWidth = 330;
      const right = x + layout.cell + 8;
      const left = right + cardWidth > layout.width ? Math.max(0, x - cardWidth - 8) : right;
      setCard({ ...point, left, top: y, pinned });
      setFocus(point);
      void loadText(point);
    },
    [layout, loadText],
  );

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!layout) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    return hitTest(layout, event.clientX - rect.left, event.clientY - rect.top);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== "mouse" || card?.pinned) return;
    const hit = pointAt(event);
    if (!hit) {
      setCard(null);
      setFocus(null);
      return;
    }
    if (hit.sura !== card?.sura || hit.ayah !== card?.ayah) showCard(hit, false);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const hit = pointAt(event);
    if (!hit) {
      setCard(null);
      setFocus(null);
      return;
    }
    // Mouse: open the ayah. Touch and pen: show the card, which has the link.
    if (event.pointerType === "mouse") router.push(`/quran/${hit.sura}#${hit.sura}-${hit.ayah}`);
    else showCard(hit, true);
  };

  // Keyboard: arrows move between ayahs (up and down jump between suras).
  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const current = focus ?? { sura: ordered[0].sura, ayah: 1 };
    const index = ordered.findIndex((s) => s.sura === current.sura);
    let next: Point | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const ayah = current.ayah + delta;
      if (ayah >= 1 && ayah <= ordered[index].ayahs) next = { sura: current.sura, ayah };
      else {
        const neighbour = ordered[index + delta];
        if (neighbour) next = { sura: neighbour.sura, ayah: delta > 0 ? 1 : neighbour.ayahs };
      }
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const neighbour = ordered[index + (event.key === "ArrowDown" ? 1 : -1)];
      if (neighbour) next = { sura: neighbour.sura, ayah: 1 };
    } else if (event.key === "Enter" && focus) {
      router.push(`/quran/${focus.sura}#${focus.sura}-${focus.ayah}`);
      return;
    } else if (event.key === "Escape") {
      setCard(null);
      setFocus(null);
      return;
    } else {
      return;
    }
    event.preventDefault();
    if (next) showCard(next, true);
  };

  // Search lens.
  const runSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setMatches(null);
      return;
    }
    try {
      const response = await fetch(`/api/quran/search?q=${encodeURIComponent(q)}`);
      const data = (await response.json()) as { kind: string; sura?: number; addresses: string[] };
      const found = new Set(data.addresses);
      if (data.kind === "sura" && data.sura) {
        const sura = bySura.get(data.sura);
        sura?.words.forEach((_, i) => found.add(`${data.sura}:${i + 1}`));
      }
      setMatches(found);
    } catch {
      setMatches(new Set());
    }
  };

  const cardSura = card ? bySura.get(card.sura) : undefined;
  const cardText = card ? texts[`${card.sura}:${card.ayah}`] : undefined;

  return (
    <section className={styles.map}>
      <div className={styles.controls}>
        <fieldset className={styles.lenses}>
          <legend>{m.lens}</legend>
          {LENSES.map((key) => (
            <label key={key} className={styles.option}>
              <input type="radio" name="lens" checked={lens === key} onChange={() => setLens(key)} />
              {m.lenses[key]}
            </label>
          ))}
          <details className={styles.upcoming}>
            <summary>{m.upcoming}</summary>
            <ul>
              {m.upcomingLenses.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </details>
        </fieldset>

        <div className={styles.row}>
          <label className={styles.option}>
            {m.order}:{" "}
            <select value={order} onChange={(e) => setOrder(e.target.value as Order)}>
              <option value="mushaf">{m.orders.mushaf}</option>
              <option value="revelation">{m.orders.revelation}</option>
            </select>
          </label>
          <div className={styles.zoom}>
            <button
              type="button"
              className="button button-ghost"
              aria-label={m.zoomOut}
              disabled={!cellSize || cellSize <= MIN_CELL}
              onClick={() => setCell(Math.max(MIN_CELL, (cellSize ?? MIN_CELL) - 1))}
            >
              −
            </button>
            <button
              type="button"
              className="button button-ghost"
              aria-label={m.zoomIn}
              disabled={!!cellSize && cellSize >= MAX_CELL}
              onClick={() => setCell(Math.min(MAX_CELL, (cellSize ?? MIN_CELL) + 1))}
            >
              +
            </button>
          </div>
        </div>

        {lens === "search" && (
          <form onSubmit={runSearch} className={styles.search} role="search">
            <input
              type="search"
              dir="auto"
              value={query}
              placeholder={m.searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t.search.label}
            />
            <button type="submit" className="button">
              {t.search.submit}
            </button>
          </form>
        )}

        <Legend lens={lens} m={m} bins={bins} matches={matches} ayahs={t.ayahs} />
      </div>

      <div ref={wrapRef} className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={0}
          role="img"
          aria-label={m.canvasLabel}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => !card?.pinned && (setCard(null), setFocus(null))}
          onKeyDown={onKeyDown}
        />
        {card && cardSura && (
          <div
            className={`${styles.card} ${card.pinned ? styles.cardPinned : ""}`}
            style={card.pinned ? undefined : { left: card.left, top: card.top }}
            role="status"
          >
            <p className={styles.cardTitle}>
              <strong>
                {card.sura}:{card.ayah}
              </strong>{" "}
              · {cardSura.name}
            </p>
            <p className={`quran ${styles.cardText}`} lang="ar" dir="rtl">
              {cardText ?? m.card.loading}
            </p>
            <p className={`muted ${styles.cardMeta}`}>
              {cardSura.place && `${t.revelationPlace[cardSura.place as "meccan" | "medinan"]} (${t.byTradition}) · `}
              {m.card.juz} {cardSura.juz[card.ayah - 1]} · {cardSura.words[card.ayah - 1]} {m.card.words}
            </p>
            {card.pinned && (
              <Link href={`/quran/${card.sura}#${card.sura}-${card.ayah}`}>{m.card.open} →</Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Legend({
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
      <p className={styles.legend}>
        <span className={styles.swatch} style={{ background: "var(--map-meccan)" }} /> {m.legendMeccan}
        <span className={styles.swatch} style={{ background: "var(--map-medinan)" }} /> {m.legendMedinan}
      </p>
    );
  }
  if (lens === "juz") {
    return (
      <p className={styles.legend}>
        <span className={styles.swatch} style={{ background: "var(--map-juz-a)" }} />
        <span className={styles.swatch} style={{ background: "var(--map-juz-b)" }} /> {m.legendJuz}
      </p>
    );
  }
  if (lens === "length") {
    return (
      <p className={styles.legend}>
        {bins.min} <span className={styles.ramp} /> {bins.max} {m.legendLength}
      </p>
    );
  }
  if (lens === "search" && matches) {
    return (
      <p className={styles.legend}>
        <span className={styles.swatch} style={{ background: "var(--map-match)" }} />
        {matches.size ? `${m.searchFound}: ${plural(matches.size, ayahs)}` : m.searchNone}
      </p>
    );
  }
  return null;
}
