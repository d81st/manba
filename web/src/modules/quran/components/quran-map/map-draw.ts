import { BLOCK_GAP, cellPosition, type Layout } from "../../quran.map-layout";
import type { MapSura } from "../../quran.types";
import type { Palette } from "./map-palette";
import type { Lens, Point, Thread } from "./map-types";

// Draws the map on the canvas: sura numbers, one cell per ayah colored by the
// lens, the line of a story thread and the frame of the focused ayah.
export function drawMap(
  canvas: HTMLCanvasElement,
  {
    layout,
    palette,
    bySura,
    colorOf,
    focus,
    lens,
    thread,
  }: {
    layout: Layout;
    palette: Palette;
    bySura: Map<number, MapSura>;
    colorOf: (sura: MapSura, ayah: number) => string;
    focus: Point | null;
    lens: Lens;
    thread: Thread | null;
  },
) {
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
      ctx.fillStyle = colorOf(sura, i + 1);
      const x = block.x + (i % block.cols) * step;
      const y = block.y + Math.floor(i / block.cols) * step;
      ctx.fillRect(x, y, layout.cell, layout.cell);
    }
  }

  // A story thread: one line through its ayahs in the order of the text.
  if (lens === "thread" && thread && thread.addresses.length > 1) {
    ctx.save();
    ctx.strokeStyle = palette.focus;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    ctx.beginPath();
    thread.addresses.forEach((address, i) => {
      const [s, a] = address.split(":").map(Number);
      const block = layout.blocks.find((b) => b.sura === s);
      if (!block) return;
      const { x, y } = cellPosition(layout, block, a);
      const cx = x + layout.cell / 2;
      const cy = y + layout.cell / 2;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();
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
}
