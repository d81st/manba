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
