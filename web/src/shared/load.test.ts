import { afterEach, describe, expect, it } from "vitest";
import { acquireHeavy, HEAVY_AT_ONCE, resetHeavy } from "./load";

afterEach(resetHeavy);

describe("acquireHeavy", () => {
  it("gives one person one search at a time", () => {
    const first = acquireHeavy("reader");
    expect(first).not.toBeNull();
    expect(acquireHeavy("reader")).toBeNull();
    first!();
    expect(acquireHeavy("reader")).not.toBeNull();
  });

  it("lets two people search and turns the third away", () => {
    const a = acquireHeavy("a");
    const b = acquireHeavy("b");
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(acquireHeavy("c")).toBeNull();
    expect(HEAVY_AT_ONCE).toBe(2);
    a!();
    expect(acquireHeavy("c")).not.toBeNull();
  });

  it("frees a slot only once", () => {
    const release = acquireHeavy("a")!;
    release();
    release();
    expect(acquireHeavy("b")).not.toBeNull();
    expect(acquireHeavy("c")).not.toBeNull();
    expect(acquireHeavy("d")).toBeNull();
  });
});
