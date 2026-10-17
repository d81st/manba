import { describe, expect, it } from "vitest";
import { blockShape, cellPosition, hitTest, LABEL_HEIGHT, layoutMap } from "./quran-map-layout";

// Made-up sura sizes; the real ones come from the database.
const suras = [
  { sura: 1, ayahs: 7 },
  { sura: 2, ayahs: 20 },
  { sura: 3, ayahs: 3 },
];

describe("blockShape", () => {
  it("makes near-square blocks", () => {
    expect(blockShape(1)).toEqual({ cols: 1, rows: 1 });
    expect(blockShape(7)).toEqual({ cols: 3, rows: 3 });
    expect(blockShape(286)).toEqual({ cols: 17, rows: 17 });
  });
});

describe("layoutMap", () => {
  it("flows blocks in rows and wraps when the width runs out", () => {
    const layout = layoutMap(suras, 60, 4);
    // cell 4 + gap 1 = step 5: sura 1 is 3 cols (14px), sura 2 is 5 cols (24px)
    expect(layout.blocks[0]).toMatchObject({ x: 0, y: LABEL_HEIGHT, width: 14 });
    expect(layout.blocks[1]).toMatchObject({ x: 24, y: LABEL_HEIGHT, width: 24 });
    // 58 + 10 + 9 > 60: sura 3 wraps to the next row, below the tallest block
    expect(layout.blocks[2].x).toBe(0);
    expect(layout.blocks[2].y).toBeGreaterThan(layout.blocks[1].y + layout.blocks[1].height);
  });
});

describe("hitTest", () => {
  const layout = layoutMap(suras, 200, 4);

  it("finds the ayah under a point", () => {
    const block = layout.blocks[1];
    for (const ayah of [1, 6, 20]) {
      const { x, y } = cellPosition(layout, block, ayah);
      expect(hitTest(layout, x + 1, y + 1)).toMatchObject({ sura: 2, ayah });
    }
  });

  it("returns nothing for empty cells and gaps between blocks", () => {
    const block = layout.blocks[0]; // 7 ayahs in a 3x3 block: cells 8 and 9 are empty
    const empty = cellPosition(layout, block, 9);
    expect(hitTest(layout, empty.x + 1, empty.y + 1)).toBeNull();
    expect(hitTest(layout, block.x + block.width + 5, block.y + 1)).toBeNull();
  });
});
