import { layoutGraph } from "@/shared/graph/graph-layout";
import type { GraphData, GraphEdge, GraphNode } from "@/shared/graph/graph.types";
import type { PublicTopic, TopicAyah } from "./topic.types";

// The scheme of one topic as a graph: the topic in the middle; its main texts
// (passages of ayahs, hadiths), the texts of the circumstances and the sides
// around it; each side with its positions, each position with the texts it
// rests on; glossary terms and related topics outside. Only what the topic
// page itself shows: every node leads to it or to the text.
// From this many hadiths of one collection, they are shown as one node.
const GROUP_FROM = 3;

export function topicGraph(topic: PublicTopic): GraphData {
  const nodes = new Map<string, Omit<GraphNode, "x" | "y">>();
  const edges: GraphEdge[] = [];
  const add = (node: Omit<GraphNode, "x" | "y">) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
    return node.id;
  };
  const linked = new Set<string>();
  const link = (source: string, target: string, kind: string) => {
    const key = `${source}|${target}`;
    if (linked.has(key)) return;
    linked.add(key);
    edges.push({ source, target, kind, weight: kind === "main" ? 0.7 : 0.4 });
  };

  const center = add({ id: "topic", label: topic.title, kind: "topic", size: 16, href: "#top" });

  // An ayah inside a main passage is the passage's node; otherwise its own.
  const passageOf = new Map<string, string>();
  for (const passage of topic.main) {
    const range = passage.from === passage.to ? `${passage.sura}:${passage.from}` : `${passage.sura}:${passage.from}–${passage.to}`;
    const id = add({ id: `passage:${range}`, label: range, kind: "quran", href: `/quran/${passage.sura}#${passage.sura}-${passage.from}` });
    for (const ayah of passage.ayahs) passageOf.set(ayah.address, id);
    link(center, id, "main");
  }
  const ayahNode = (ayah: TopicAyah) =>
    passageOf.get(ayah.address) ??
    add({ id: ayah.address, label: `${ayah.sura}:${ayah.ayah}`, kind: "quran", href: `/quran/${ayah.sura}#${ayah.sura}-${ayah.ayah}` });
  // Many hadiths of one collection among the texts become one node, «Абу Дауд · 15».
  const listed = [...topic.mainHadiths, ...topic.circumstancesHadiths];
  const workOf = (address: string) => address.split(".")[0];
  const perWork = new Map<string, { name: string; count: number }>();
  for (const h of listed) {
    const entry = perWork.get(workOf(h.address)) ?? { name: h.title.replace(/\s+\S+$/, ""), count: 0 };
    entry.count++;
    perWork.set(workOf(h.address), entry);
  }
  const grouped = (address: string) => (perWork.get(workOf(address))?.count ?? 0) >= GROUP_FROM;
  const hadithNode = (hadith: { address: string; title: string; href: string }) => {
    const work = workOf(hadith.address);
    if (grouped(hadith.address)) {
      const { name, count } = perWork.get(work)!;
      return add({ id: `group:${work}`, label: `${name} · ${count}`, kind: "hadith", size: 11, href: "#texts" });
    }
    return add({ id: hadith.address, label: hadith.title, kind: "hadith", href: hadith.href });
  };

  for (const hadith of topic.mainHadiths) link(center, hadithNode(hadith), "main");
  for (const ayah of topic.circumstancesRefs) link(center, ayahNode(ayah), "circumstances");
  for (const hadith of topic.circumstancesHadiths) link(center, hadithNode(hadith), "circumstances");

  topic.sides.forEach((side, i) => {
    const sideId = add({ id: `side:${i}`, label: side.title, kind: "side", size: 12, href: `#side-${i}` });
    link(center, sideId, "main");
    side.positions.forEach((position, j) => {
      const label = position.holder.length > 34 ? `${position.holder.slice(0, 33)}…` : position.holder;
      const id = add({ id: `position:${i}:${j}`, label, kind: "position", href: `#position-${i}-${j}` });
      link(sideId, id, "main");
      for (const ayah of position.refs) link(id, ayahNode(ayah), "basis");
      for (const hadith of position.hadiths) link(id, hadithNode(hadith), "basis");
    });
  });

  for (const term of topic.terms) link(center, add({ id: `term:${term.slug}`, label: term.translation, kind: "term", href: `/glossary/${term.slug}` }), "outer");
  for (const related of topic.related) {
    link(center, add({ id: `related:${related.slug}`, label: related.title, kind: "related", href: `/topics/${related.slug}` }), "outer");
  }

  const list = [...nodes.values()];
  const positions = layoutGraph(
    list.map((n) => ({ id: n.id, mass: n.id === center ? 6 : n.kind === "side" ? 3 : 1 })),
    edges.map((e) => ({ source: e.source, target: e.target, weight: e.kind === "main" ? 2 : 1 })),
  );
  return { nodes: list.map((n) => ({ ...n, x: positions[n.id][0], y: positions[n.id][1] })), edges };
}
