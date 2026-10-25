// "Mentioned together" for the graph of people (docs/PLAN.md, «Жизнеописание
// пророка»): in how many chapters of the Sira two people are both named. A
// measure of co-occurrence found by the forms of their names, not a claim
// about the two. No database here.
import { searchKey } from "./arabic.ts";

const LETTER = "\\u0621-\\u064a";

// A form of a name as a whole word, with "و"/"ف" allowed in front; not after
// "بن"/"بنت", where it names someone's father ("علي بن أبي طالب" is not Abu Talib).
export function nameMatcher(forms: string[]) {
  const keys = [...new Set(forms.map((f) => searchKey(f)).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (keys.length === 0) return null;
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?<![${LETTER}])(?<!(?:بن|بنت) )[وف]?(?:${escaped.join("|")})(?![${LETTER}])`, "u");
}

export type CoMention = { a: string; b: string; count: number };

// texts: the search form of each text and the chapter it belongs to.
export function coMentions(
  texts: { unit: string; plain: string }[],
  people: { slug: string; forms: string[] }[],
  min = 2,
): { units: Record<string, number>; pairs: CoMention[] } {
  const found = new Map<string, Set<string>>();
  for (const person of people) {
    const matcher = nameMatcher(person.forms);
    if (!matcher) continue;
    const units = new Set<string>();
    for (const text of texts) if (matcher.test(text.plain)) units.add(text.unit);
    found.set(person.slug, units);
  }
  const slugs = [...found.keys()];
  const pairs: CoMention[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const [x, y] = [found.get(slugs[i])!, found.get(slugs[j])!];
      let count = 0;
      for (const unit of x) if (y.has(unit)) count++;
      if (count >= min) pairs.push({ a: slugs[i], b: slugs[j], count });
    }
  }
  pairs.sort((p, q) => q.count - p.count);
  return { units: Object.fromEntries(slugs.map((s) => [s, found.get(s)!.size])), pairs };
}

// A force layout of the graph (Fruchterman and Reingold), the same on every
// run: nodes start on a circle, push each other apart, links pull their ends
// together, a weak pull keeps everything near the middle, and the steps get
// shorter as the layout cools. Positions stay within the margins.
export function forceLayout(
  nodes: string[],
  links: { a: string; b: string; strength: number }[],
  width: number,
  height: number,
  margin: { x: number; y: number } = { x: 40, y: 40 },
): Record<string, [number, number]> {
  const n = nodes.length;
  const index = new Map(nodes.map((node, i) => [node, i]));
  const pos = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1);
    return [width / 2 + (width / 4) * Math.cos(angle), height / 2 + (height / 4) * Math.sin(angle)];
  });
  const edges = links
    .map((l) => [index.get(l.a), index.get(l.b), l.strength] as const)
    .filter((e): e is readonly [number, number, number] => e[0] !== undefined && e[1] !== undefined);
  const k = Math.sqrt(((width - 2 * margin.x) * (height - 2 * margin.y)) / Math.max(n, 1)) * 0.8;
  const steps = 500;
  for (let step = 0; step < steps; step++) {
    const temperature = (Math.min(width, height) / 8) * (1 - step / steps) + 0.5;
    const move = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const d = Math.max(Math.hypot(dx, dy), 0.01);
        const f = (k * k) / d / d;
        move[i][0] += dx * f;
        move[i][1] += dy * f;
        move[j][0] -= dx * f;
        move[j][1] -= dy * f;
      }
    }
    for (const [i, j, strength] of edges) {
      const dx = pos[i][0] - pos[j][0];
      const dy = pos[i][1] - pos[j][1];
      const d = Math.max(Math.hypot(dx, dy), 0.01);
      const f = (d / k) * strength;
      move[i][0] -= dx * f;
      move[i][1] -= dy * f;
      move[j][0] += dx * f;
      move[j][1] += dy * f;
    }
    for (let i = 0; i < n; i++) {
      move[i][0] += (width / 2 - pos[i][0]) * 0.05;
      move[i][1] += (height / 2 - pos[i][1]) * 0.05;
      const len = Math.max(Math.hypot(move[i][0], move[i][1]), 0.01);
      const shift = Math.min(len, temperature);
      pos[i][0] = Math.min(width - margin.x, Math.max(margin.x, pos[i][0] + (move[i][0] / len) * shift));
      pos[i][1] = Math.min(height - margin.y, Math.max(margin.y, pos[i][1] + (move[i][1] / len) * shift));
    }
  }
  return Object.fromEntries(nodes.map((node, i) => [node, [Math.round(pos[i][0]), Math.round(pos[i][1])]]));
}
