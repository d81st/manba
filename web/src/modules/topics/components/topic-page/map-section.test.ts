import { describe, expect, it } from "vitest";
import { placeLabels, viewOf } from "./map-section";

// Fictional points, not real places.
describe("viewOf", () => {
  it("frames the places with a margin and keeps the drawing 640 wide", () => {
    const view = viewOf([
      { lat: 40, lon: 44 },
      { lat: 43, lon: 48 },
    ]);
    expect([view.west, view.east, view.south, view.north]).toEqual([40, 52, 36.5, 46]);
    const stretch = Math.cos((((36.5 + 46) / 2) * Math.PI) / 180);
    expect((view.east - view.west) * stretch * view.scale).toBeCloseTo(640);
  });

  it("widens a single place to its surroundings and stays inside the land outline", () => {
    const view = viewOf([{ lat: 45.5, lon: 40 }]);
    expect(view.north).toBe(46);
    expect(view.east - view.west).toBe(12);
  });
});

describe("placeLabels", () => {
  it("puts a name beside its point and moves the next one off it", () => {
    const labels = placeLabels(
      [
        { x: 100, y: 100, name: "Первое" },
        { x: 220, y: 101, name: "Второе место" },
      ],
      640,
      400,
    );
    expect(labels[0]).toEqual([10, 4, "start"]);
    expect(labels[1]).not.toEqual([-10, 4, "end"]);
  });

  it("keeps a name near the right edge inside the drawing", () => {
    expect(placeLabels([{ x: 630, y: 100, name: "У края" }], 640, 400)[0]).toEqual([-10, 4, "end"]);
  });
});
