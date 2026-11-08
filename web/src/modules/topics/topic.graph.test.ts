import { describe, expect, it } from "vitest";
import { topicGraph } from "./topic.graph";
import type { PublicTopic } from "./topic.types";

// Fictional topic: test values only, not content of the site.
const ayah = (sura: number, n: number) => ({ address: `quran.${sura}.${n}`, sura, ayah: n, suraName: "Test", text: "…" });
const topic: PublicTopic = {
  id: 1,
  slug: "test-topic",
  category: "general",
  status: "published",
  title: "Тестовая тема",
  question: "Тестовый вопрос?",
  updatedAt: "",
  updatedBy: "",
  place: null,
  circumstances: "",
  circumstancesNote: "",
  main: [{ sura: 2, from: 1, to: 2, ayahs: [ayah(2, 1), ayah(2, 2)], before: [], after: [] }],
  mainHadiths: [{ address: "bukhari.1", title: "Бухари 1", href: "/hadith/bukhari/1", items: [], more: 0 }],
  circumstancesRefs: [],
  circumstancesHadiths: [],
  relatedRefs: [],
  relatedHadiths: [],
  sides: [
    {
      title: "Сторона А",
      positions: [{ side: "Сторона А", holder: "Вымышленная школа", recognition: "minority", text: "…", sourceNote: "", refs: [ayah(2, 2), ayah(3, 7)], hadiths: [] }],
    },
  ],
  terms: [{ slug: "test-term", translation: "тестовый термин" }],
  related: [],
};

describe("topicGraph", () => {
  it("joins the topic, its passage, hadith, side, position and term", () => {
    const g = topicGraph(topic);
    const ids = g.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["bukhari.1", "passage:2:1–2", "position:0:0", "quran.3.7", "side:0", "term:test-term", "topic"].sort());
    // An ayah of a main passage points to the passage, not to a node of its own.
    expect(g.edges).toContainEqual(expect.objectContaining({ source: "position:0:0", target: "passage:2:1–2" }));
    for (const n of g.nodes) expect(Number.isFinite(n.x) && Number.isFinite(n.y)).toBe(true);
  });

  it("shows many hadiths of one collection as one node", () => {
    const hadith = (n: number) => ({ address: `abu_dawud.${n}`, title: `Абу Дауд ${n}`, href: `/hadith/abu_dawud/${n}`, items: [], more: 0 });
    const g = topicGraph({ ...topic, mainHadiths: [hadith(1), hadith(2), hadith(3)] });
    expect(g.nodes.find((n) => n.id === "group:abu_dawud")?.label).toBe("Абу Дауд · 3");
    expect(g.nodes.some((n) => n.id === "abu_dawud.1")).toBe(false);
  });
});
