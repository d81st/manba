import "server-only";
import { listTermLinks, listPublishedTerms } from "@/modules/glossary/server";
import { listParallels } from "@/modules/origins/server";
import { listPublishedTopics, listTopicLinks } from "@/modules/topics/server";
import { layoutGraph } from "@/shared/graph/graph-layout";
import type { GraphEdge } from "@/shared/graph/graph.types";
import { SECTIONS, sectionOfCategory } from "../knowledge.sections";
import type { KnowledgeItem, KnowledgeMap } from "../knowledge.types";

// The knowledge map: the sections of the site, the published topics, terms and
// links of «Истоки и связи», joined by the links the editors made (a topic and
// its terms, related topics, related terms) and by the section each belongs to.
// Laid out here once, so the picture is the same for everybody.
export async function getKnowledgeMap(): Promise<KnowledgeMap> {
  const [topics, terms, topicLinks, termLinks, parallels] = await Promise.all([
    listPublishedTopics(),
    listPublishedTerms(),
    listTopicLinks(),
    listTermLinks(),
    listParallels(false),
  ]);

  const items: KnowledgeItem[] = [
    ...SECTIONS.map((s) => ({ id: s.id, kind: "section" as const, label: s.label, href: s.href, hint: s.hint })),
    ...topics.map((t) => ({ id: `topic:${t.slug}`, kind: "topic" as const, label: t.title, href: `/topics/${t.slug}`, hint: t.question })),
    ...terms.map((t) => ({
      id: `term:${t.slug}`,
      kind: "term" as const,
      label: t.translation,
      href: `/glossary/${t.slug}`,
      hint: t.short,
    })),
    ...parallels
      .filter((p) => p.status === "published")
      .map((p) => ({ id: `parallel:${p.slug}`, kind: "parallel" as const, label: p.title, href: `/origins/${p.slug}`, hint: "" })),
  ];
  const ids = new Set(items.map((i) => i.id));

  const edges: GraphEdge[] = [
    ...topics.map((t) => ({ source: `topic:${t.slug}`, target: sectionOfCategory(t.category), kind: "section", weight: 0.2 })),
    ...terms.map((t) => ({ source: `term:${t.slug}`, target: "section:glossary", kind: "section", weight: 0.2 })),
    ...parallels.map((p) => ({ source: `parallel:${p.slug}`, target: "section:origins", kind: "section", weight: 0.2 })),
    ...topicLinks.related.map((r) => ({ source: `topic:${r.a}`, target: `topic:${r.b}`, kind: "link", weight: 0.6 })),
    ...topicLinks.terms.map((r) => ({ source: `topic:${r.topic}`, target: `term:${r.term}`, kind: "link", weight: 0.6 })),
    ...termLinks.map((r) => ({ source: `term:${r.a}`, target: `term:${r.b}`, kind: "link", weight: 0.6 })),
  ].filter((e) => ids.has(e.source) && ids.has(e.target));

  const positions = layoutGraph(
    items.map((i) => ({ id: i.id, mass: i.kind === "section" ? 4 : 1 })),
    edges.map((e) => ({ source: e.source, target: e.target, weight: e.kind === "link" ? 2 : 1 })),
  );
  return {
    items,
    graph: {
      nodes: items.map((i) => ({
        id: i.id,
        label: i.label,
        kind: i.kind,
        href: i.href,
        x: positions[i.id][0],
        y: positions[i.id][1],
        size: i.kind === "section" ? 14 : 8,
      })),
      edges,
    },
  };
}
