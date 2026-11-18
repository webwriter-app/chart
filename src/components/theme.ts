let probe: CanvasRenderingContext2D | null | undefined;

/** Resolves any CSS color to `#rrggbb` (or `rgba(...)` with alpha), the formats the chart code appends alpha to. Returns undefined for a value the browser does not take as a color. */
function resolveColor(value: string): string | undefined {
  if (!value) return undefined;
  probe ??= document.createElement("canvas").getContext("2d");
  if (!probe) return undefined;
  // An invalid value leaves the previous fillStyle, so a sentinel shows that the value was rejected.
  probe.fillStyle = "#010203";
  probe.fillStyle = value;
  const resolved = String(probe.fillStyle);
  return resolved === "#010203" ? undefined : resolved;
}

/** The series colors of a chart: the document's accent colors replace the first palette entries, the rest of the palette stays. */
export function themedPalette(host: Element, base: readonly string[]): string[] {
  const style = getComputedStyle(host);
  return base.map((color, index) => index < 7 ? resolveColor(style.getPropertyValue(`--ww-theme-accent-${index + 1}`).trim()) ?? color : color);
}

/** The text color and font family a document theme sets, to hand to Chart.js, which cannot read inherited CSS. */
export function themedText(host: Element): { color?: string; family?: string } {
  const style = getComputedStyle(host);
  return {
    color: resolveColor(style.getPropertyValue("--ww-text-color").trim()),
    family: style.getPropertyValue("--ww-font-family").trim() || undefined,
  };
}
