// Geometry of the Quran map: one block per sura, one cell per ayah. Blocks
// are near-square (size grows with the number of ayahs) and flow in rows
// like words in a line. Pure functions, so they are unit-tested.

export const LABEL_HEIGHT = 14; // sura number above each block
export const BLOCK_GAP = 10;

export type Block = {
  sura: number;
  ayahs: number;
  x: number;
  y: number; // top of the cells (the label sits above)
  cols: number;
  rows: number;
  width: number;
  height: number;
};

export type Layout = { blocks: Block[]; width: number; height: number; cell: number; gap: number };

export function blockShape(ayahs: number) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(ayahs)));
  return { cols, rows: Math.ceil(ayahs / cols) };
}

export function layoutMap(
  suras: { sura: number; ayahs: number }[],
  width: number,
  cell: number,
  gap = 1,
): Layout {
  const step = cell + gap;
  const blocks: Block[] = [];
  let x = 0;
  let y = LABEL_HEIGHT;
  let rowHeight = 0;
  let maxRight = 0;

  for (const { sura, ayahs } of suras) {
    const { cols, rows } = blockShape(ayahs);
    const blockWidth = cols * step - gap;
    const blockHeight = rows * step - gap;
    if (x > 0 && x + blockWidth > width) {
      x = 0;
      y += rowHeight + BLOCK_GAP + LABEL_HEIGHT;
      rowHeight = 0;
    }
    blocks.push({ sura, ayahs, x, y, cols, rows, width: blockWidth, height: blockHeight });
    x += blockWidth + BLOCK_GAP;
    rowHeight = Math.max(rowHeight, blockHeight);
    maxRight = Math.max(maxRight, x - BLOCK_GAP);
  }
  return { blocks, width: Math.max(width, maxRight), height: y + rowHeight, cell, gap };
}

// Which ayah (1-based) is under a point, if any.
export function hitTest(layout: Layout, px: number, py: number) {
  const step = layout.cell + layout.gap;
  for (const block of layout.blocks) {
    if (px < block.x || py < block.y || px >= block.x + block.width + layout.gap || py >= block.y + block.height + layout.gap) {
      continue;
    }
    const col = Math.floor((px - block.x) / step);
    const row = Math.floor((py - block.y) / step);
    const index = row * block.cols + col;
    if (index < block.ayahs) return { sura: block.sura, ayah: index + 1, block };
    return null;
  }
  return null;
}

// Top-left corner of an ayah's cell.
export function cellPosition(layout: Layout, block: Block, ayah: number) {
  const step = layout.cell + layout.gap;
  const index = ayah - 1;
  return { x: block.x + (index % block.cols) * step, y: block.y + Math.floor(index / block.cols) * step };
}

// Largest cell size (within limits) for the initial zoom: on wide screens the
// whole map fits about one screen; on phones it may be taller (scrolling),
// so that cells stay big enough to tap.
export function fittingCell(suras: { sura: number; ayahs: number }[], width: number, min = 3, max = 12) {
  const maxHeight = width < 600 ? width * 2.2 : Math.max(600, width * 0.75);
  for (let cell = max; cell > min; cell--) {
    const layout = layoutMap(suras, width, cell);
    if (layout.width <= width && layout.height <= maxHeight) return cell;
  }
  return min;
}
