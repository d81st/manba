import { describe, expect, it } from "vitest";
import { reviewItems, reviewProgress, reviewState, type ReviewCheck } from "./topic.review";

// Invented test data, not religious content.
const topic = {
  category: "hard" as const,
  title: "Test topic",
  question: "What do the sources say?",
  mainRefs: "2:255",
  circumstances: "Context.",
  circumstancesNote: "Missing: book X.",
  circumstancesRefs: "",
  relatedRefs: "",
  positions: [
    { sideId: 1, holder: "Holder A", recognition: "tradition" as const, text: "Text A", sourceNote: "", refs: "2:256" },
    { sideId: 2, holder: "Holder B", recognition: "minority" as const, text: "Text B", sourceNote: "", refs: "" },
  ],
};

const check = (item: string, fingerprint: string, checked = true, note = ""): ReviewCheck => ({
  item,
  fingerprint,
  checked,
  note,
  actor: "admin",
  updatedAt: "2026-11-28T00:00:00Z",
});

describe("reviewItems", () => {
  it("lists the question, the texts, the circumstances and each position by its holder", () => {
    expect(reviewItems(topic).map((i) => i.key)).toEqual([
      "question",
      "texts",
      "circumstances",
      "position:Holder A",
      "position:Holder B",
    ]);
  });

  it("keeps a key and a fingerprint while the content stays, and changes the fingerprint with it", () => {
    const [a, b] = [reviewItems(topic), reviewItems(structuredClone(topic))];
    expect(b).toEqual(a);
    const edited = structuredClone(topic);
    edited.positions[0].recognition = "minority";
    const c = reviewItems(edited);
    expect(c[3].key).toBe(a[3].key);
    expect(c[3].fingerprint).not.toBe(a[3].fingerprint);
    expect(c[4].fingerprint).toBe(a[4].fingerprint);
  });

  it("gives two positions of one holder one item", () => {
    const twice = structuredClone(topic);
    twice.positions[1].holder = "Holder A";
    expect(reviewItems(twice).filter((i) => i.kind === "position")).toHaveLength(1);
  });
});

describe("reviewState and reviewProgress", () => {
  const items = reviewItems(topic);

  it("is open without a check or with a remark only, checked while the content stays, changed after an edit", () => {
    expect(reviewState(items[0], undefined)).toBe("open");
    expect(reviewState(items[0], check("question", items[0].fingerprint, false, "remark"))).toBe("open");
    expect(reviewState(items[0], check("question", items[0].fingerprint))).toBe("checked");
    expect(reviewState(items[0], check("question", "old"))).toBe("changed");
  });

  it("counts checked, changed and remarks; checks of items no longer there are left out", () => {
    const progress = reviewProgress(items, [
      check("question", items[0].fingerprint),
      check("texts", "old"),
      check("circumstances", items[2].fingerprint, false, "Ask about book X"),
      check("position:Renamed", "x"),
    ]);
    expect(progress).toEqual({ total: 5, checked: 1, changed: 1, notes: 1 });
  });
});
