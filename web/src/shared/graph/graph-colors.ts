// Sigma draws with WebGL and needs plain colors; the site's colors are theme
// tokens (CSS custom properties, often in oklch). A token is turned into rgb
// by drawing it once on a 1×1 canvas, so light and dark themes stay exact.

let probe: CanvasRenderingContext2D | null = null;

export function resolveColor(value: string): string {
  if (typeof document === "undefined") return "#888888";
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return "#888888";
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#888888";
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

// The value of a CSS custom property on an element, as rgb.
export function tokenColor(element: Element, token: string): string {
  const value = getComputedStyle(element).getPropertyValue(token).trim();
  return resolveColor(value || "#888888");
}

// Theme tokens for the kinds of nodes and edges of one graph, and their colors.
export type GraphPalette = { nodes: Record<string, string>; edges: Record<string, string> };
export type GraphColors = { nodes: Record<string, string>; edges: Record<string, string>; faded: string; label: string; card: string };

export function readColors(element: Element, palette: GraphPalette): GraphColors {
  const map = (tokens: Record<string, string>) =>
    Object.fromEntries(Object.entries(tokens).map(([kind, token]) => [kind, tokenColor(element, token)]));
  return {
    nodes: map(palette.nodes),
    edges: map(palette.edges),
    faded: tokenColor(element, "--muted-foreground"),
    label: tokenColor(element, "--foreground"),
    card: tokenColor(element, "--card"),
  };
}

// A color moved towards the background: how faded items look.
export function mix(color: string, background: string, amount = 0.75) {
  const parse = (c: string) => (c.match(/\d+/g) ?? ["136", "136", "136"]).slice(0, 3).map(Number);
  const [a, b] = [parse(color), parse(background)];
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}
