"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Messages } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MapSura } from "../../quran.types";
import { cellPosition, fittingCell, hitTest, layoutMap, type Layout } from "../../quran.map-layout";
import { AyahCard } from "./ayah-card";
import { MapControls } from "./map-controls";
import { drawMap } from "./map-draw";
import { Legend } from "./map-legend";
import { cellColor, lengthBins, readPalette, type Palette } from "./map-palette";
import { MIN_CELL, type Card, type Lens, type Order, type Point, type Thread } from "./map-types";
import { ThreadPanel } from "./thread-panel";

// The Quran map: 114 sura blocks of ayah cells on a canvas, colored by a lens,
// with a card for the ayah under the pointer (a tap on a phone).
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
  const [story, setStory] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const threadSet = useMemo(() => (thread ? new Set(thread.addresses) : null), [thread]);

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
    (sura: MapSura, ayah: number, p: Palette) => cellColor(lens, sura, ayah, p, bins, matches, threadSet),
    [lens, bins, matches, threadSet],
  );

  // Draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || !palette) return;
    drawMap(canvas, { layout, palette, bySura, colorOf: (sura, ayah) => colorOf(sura, ayah, palette), focus, lens, thread });
  }, [layout, palette, bySura, colorOf, focus, lens, thread]);

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

  // Story thread lens.
  const chooseStory = async (slug: string) => {
    setStory(slug);
    setThread(null);
    try {
      const response = await fetch(`/api/quran/thread?story=${encodeURIComponent(slug)}`);
      if (response.ok) setThread((await response.json()) as Thread);
    } catch {
      setThread({ addresses: [], parallels: [] });
    }
  };

  const cardSura = card ? bySura.get(card.sura) : undefined;
  const cardText = card ? texts[`${card.sura}:${card.ayah}`] : undefined;

  return (
    <section className="mt-4 mb-12">
      <div className="mb-3 flex flex-col gap-3">
        <MapControls lens={lens} setLens={setLens} order={order} setOrder={setOrder} cellSize={cellSize} setCell={setCell} m={m} />

        {lens === "search" && (
          <form onSubmit={runSearch} className="flex gap-2" role="search">
            <Input
              type="search"
              dir="auto"
              value={query}
              placeholder={m.searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t.search.label}
            />
            <Button type="submit">{t.search.submit}</Button>
          </form>
        )}

        {lens === "thread" && <ThreadPanel story={story} chooseStory={(slug) => void chooseStory(slug)} thread={thread} m={m} />}

        <Legend lens={lens} m={m} bins={bins} matches={matches} ayahs={t.ayahs} />
      </div>

      <div ref={wrapRef} className="relative max-h-[80vh] overflow-auto p-0.5">
        <canvas
          ref={canvasRef}
          className="block cursor-pointer touch-manipulation rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          tabIndex={0}
          role="img"
          aria-label={m.canvasLabel}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => !card?.pinned && (setCard(null), setFocus(null))}
          onKeyDown={onKeyDown}
        />
        {card && cardSura && <AyahCard card={card} cardSura={cardSura} cardText={cardText} t={t} />}
      </div>
    </section>
  );
}
