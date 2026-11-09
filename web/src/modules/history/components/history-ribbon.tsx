"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ceTicks, hijriTicks, placeTitles, RIBBON_LANES, type RibbonEvent } from "../history.ribbon";
import { LANE_COLOR, RibbonCard } from "./ribbon-card";

const messages = getMessages();
const t = messages.history.ribbon;

const AXIS = 26; // height of each axis
const LANE = 52; // height of a lane
const PAD = 14; // free space at the ends
const TITLE = 44; // room for the axis names ("г. х.", "н. э.") at the start
const OVERVIEW = 30;
const CHAR = 6.8; // average width of a character of a title, px

type View = { from: number; to: number };

// The ribbon of time: every event on one scale of years, a lane per layer;
// hijri years above, common-era years below. Drag to move, zoom with the
// buttons, ctrl/⌘ + wheel or two fingers; the strip below shows the whole era.
export function HistoryRibbon({ events }: { events: RibbonEvent[] }) {
  const lanes = RIBBON_LANES.filter((lane) => events.some((e) => e.lane === lane));
  const full = useMemo<View>(() => {
    const all = events.flatMap((e) => e.span);
    const [a, b] = [Math.min(...all), Math.max(...all)];
    const margin = Math.max(2, (b - a) * 0.04);
    return { from: a - margin, to: b + margin };
  }, [events]);
  const [view, setView] = useState<View>(full);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [width, setWidth] = useState(800);
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, number>());
  const gesture = useRef<{ view: View; xs: number[]; moved: boolean } | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const inner = Math.max(1, width - 2 * PAD);
  const x = (time: number) => PAD + ((time - view.from) / (view.to - view.from)) * inner;
  const timeAt = (px: number, v: View = view) => v.from + ((px - PAD) / inner) * (v.to - v.from);

  // Keep the view within the era and between a year and the whole era twice over.
  function clamp(next: View): View {
    const total = full.to - full.from;
    const span = Math.min(Math.max(next.to - next.from, 1), total * 2);
    const middle = Math.min(Math.max((next.from + next.to) / 2, full.from), full.to);
    return { from: middle - span / 2, to: middle + span / 2 };
  }
  const zoom = (factor: number, around = (view.from + view.to) / 2) =>
    setView((v) => clamp({ from: around - (around - v.from) * factor, to: around + (v.to - around) * factor }));

  // ctrl/⌘ + wheel zooms at the pointer; a plain wheel keeps scrolling the page.
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const px = e.clientX - element.getBoundingClientRect().left;
      setView((v) => {
        const around = v.from + ((px - PAD) / inner) * (v.to - v.from);
        const factor = Math.exp(e.deltaY * 0.002);
        return clamp({ from: around - (around - v.from) * factor, to: around + (v.to - around) * factor });
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  });

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, e.clientX);
    gesture.current = { view, xs: [...pointers.current.values()], moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, e.clientX);
    const start = gesture.current;
    const now = [...pointers.current.values()];
    const left = svg.current?.getBoundingClientRect().left ?? 0;
    if (now.length === 1 && start.xs.length === 1) {
      const dx = now[0] - start.xs[0];
      if (!start.moved && Math.abs(dx) > 4) {
        start.moved = true;
        // From now on the drag is the ribbon's, even outside it.
        svg.current?.setPointerCapture(e.pointerId);
      }
      if (start.moved) {
        const shift = (dx / inner) * (start.view.to - start.view.from);
        setView(clamp({ from: start.view.from - shift, to: start.view.to - shift }));
      }
    } else if (now.length === 2 && start.xs.length === 2) {
      start.moved = true;
      const before = Math.abs(start.xs[1] - start.xs[0]) || 1;
      const after = Math.abs(now[1] - now[0]) || 1;
      const around = timeAt((start.xs[0] + start.xs[1]) / 2 - left, start.view);
      const factor = before / after;
      setView(clamp({ from: around - (around - start.view.from) * factor, to: around + (start.view.to - around) * factor }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setTimeout(() => (gesture.current = null), 0);
    else gesture.current = { view, xs: [...pointers.current.values()], moved: true };
  }
  const choose = (id: string) => {
    if (gesture.current?.moved) return;
    setSelected((s) => (s === id ? null : id));
  };

  const laneY = (lane: string) => AXIS + lanes.indexOf(lane as (typeof lanes)[number]) * LANE;
  const height = AXIS * 2 + lanes.length * LANE;
  const onScreen = events.filter((e) => e.span[1] >= view.from && e.span[0] <= view.to);
  const titles = placeTitles(
    onScreen.map((e) => ({ id: e.id, lane: e.lane, x: x(e.at), width: e.title.length * CHAR })),
    width - 4,
    new Set([selected, hovered].filter((id): id is string => id !== null)),
  );
  const count = Math.max(3, Math.floor(inner / 90));
  // Ticks clear of the axis names at the start.
  const top = hijriTicks(view.from, view.to, count).filter((tick) => x(tick.at) > TITLE);
  const bottom = ceTicks(view.from, view.to, count).filter((tick) => x(tick.at) > TITLE);
  const event = events.find((e) => e.id === selected) ?? null;

  return (
    <section className="mt-6" aria-label={t.label}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t.hint}</p>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label={messages.graph.zoomIn} title={messages.graph.zoomIn} onClick={() => zoom(0.6)}>
            <Plus />
          </Button>
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label={messages.graph.zoomOut} title={messages.graph.zoomOut} onClick={() => zoom(1 / 0.6)}>
            <Minus />
          </Button>
          <Button type="button" size="icon" variant="outline" className="size-8" aria-label={messages.graph.reset} title={messages.graph.reset} onClick={() => setView(full)}>
            <RotateCcw />
          </Button>
        </div>
      </div>
      <div ref={box} className="overflow-hidden rounded-xl border bg-card" dir="ltr">
        <svg
          ref={svg}
          width={width}
          height={height}
          className="block cursor-grab touch-pan-y select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="group"
          aria-label={t.label}
        >
          {lanes.map((lane, i) => (
            <g key={lane}>
              {i % 2 === 1 && <rect x={0} y={laneY(lane)} width={width} height={LANE} fill="var(--muted)" opacity={0.35} />}
              <text x={6} y={laneY(lane) + 12} fontSize={11} fill="var(--muted-foreground)">
                {t.lanes[lane]}
              </text>
            </g>
          ))}
          {top.map((tick) => (
            <g key={`h${tick.label}`}>
              <line x1={x(tick.at)} x2={x(tick.at)} y1={AXIS - 4} y2={height - AXIS} stroke="var(--border)" />
              <text x={x(tick.at)} y={AXIS - 9} fontSize={11} textAnchor="middle" fill="var(--foreground)" className="tabular-nums">
                {tick.label}
              </text>
            </g>
          ))}
          {bottom.map((tick) => (
            <text key={`c${tick.label}`} x={x(tick.at)} y={height - 9} fontSize={11} textAnchor="middle" fill="var(--muted-foreground)" className="tabular-nums">
              {tick.label}
            </text>
          ))}
          <text x={6} y={AXIS - 9} fontSize={11} fill="var(--muted-foreground)">{t.ah}</text>
          <text x={6} y={height - 9} fontSize={11} fill="var(--muted-foreground)">{t.ce}</text>

          {onScreen.map((e) => {
            const y = laneY(e.lane) + 34;
            const color = LANE_COLOR[e.lane];
            const active = e.id === selected || e.id === hovered;
            return (
              <g
                key={e.id}
                role="button"
                tabIndex={0}
                aria-label={`${e.title}: ${e.readings[0]?.date ?? ""}`}
                aria-pressed={e.id === selected}
                className="cursor-pointer outline-none [&:focus-visible>circle.dot]:stroke-ring"
                opacity={e.draft ? 0.5 : 1}
                onClick={() => choose(e.id)}
                onKeyDown={(k) => (k.key === "Enter" || k.key === " ") && (k.preventDefault(), setSelected(e.id))}
                onPointerEnter={() => setHovered(e.id)}
                onPointerLeave={() => setHovered(null)}
              >
                {e.span[1] > e.span[0] && (
                  <line x1={x(e.span[0])} x2={x(e.span[1])} y1={y} y2={y} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
                )}
                {e.readings.map((r, i) => r.at !== e.at && <circle key={i} cx={x(r.at)} cy={y} r={3} fill={color} />)}
                <circle className="dot" cx={x(e.at)} cy={y} r={active ? 7 : 5} fill={color} stroke="var(--card)" strokeWidth={2} />
                <circle cx={x(e.at)} cy={y} r={12} fill="transparent" />
                {titles.has(e.id) && (
                  <text
                    x={titles.get(e.id) === "left" ? x(e.at) - 9 : x(e.at) + 9}
                    textAnchor={titles.get(e.id) === "left" ? "end" : "start"}
                    y={y - 9}
                    fontSize={12}
                    fill="var(--foreground)"
                    stroke="var(--card)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    fontWeight={active ? 600 : 400}
                  >
                    {e.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <Overview events={events} full={full} view={view} width={width} onMove={(middle) => setView((v) => clamp({ from: middle - (v.to - v.from) / 2, to: middle + (v.to - v.from) / 2 }))} />
      </div>
      <RibbonCard event={event} />
    </section>
  );
}

// The whole era in a thin strip, with a frame around what the ribbon shows;
// a press or a drag moves the ribbon there.
function Overview({ events, full, view, width, onMove }: { events: RibbonEvent[]; full: View; view: View; width: number; onMove: (middle: number) => void }) {
  const inner = Math.max(1, width - 2 * PAD);
  const x = (time: number) => PAD + ((time - full.from) / (full.to - full.from)) * inner;
  const time = (e: React.PointerEvent<SVGSVGElement>) => full.from + ((e.clientX - e.currentTarget.getBoundingClientRect().left - PAD) / inner) * (full.to - full.from);
  const [a, b] = [Math.max(PAD, x(view.from)), Math.min(width - PAD, x(view.to))];
  return (
    <svg
      width={width}
      height={OVERVIEW}
      className="block cursor-pointer touch-pan-y border-t"
      aria-label={t.overview}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onMove(time(e));
      }}
      onPointerMove={(e) => e.buttons === 1 && onMove(time(e))}
    >
      {events.map((e) => (
        <circle key={e.id} cx={x(e.at)} cy={OVERVIEW / 2} r={2.5} fill={LANE_COLOR[e.lane]} opacity={0.8} />
      ))}
      <rect x={a} y={3} width={Math.max(4, b - a)} height={OVERVIEW - 6} rx={4} fill="var(--primary)" fillOpacity={0.12} stroke="var(--primary)" />
    </svg>
  );
}
