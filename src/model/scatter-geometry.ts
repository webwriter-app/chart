import type { ChartDataSet, DrawnLine } from "./models";
import type { RegressionComputation } from "./regression";

export type Pt = { x: number; y: number };
export type ScatterMode = "none" | "add-point" | "draw-line";
export type ScaleBounds = { xMin: number; xMax: number; yMin: number; yMax: number };

export const SNAP_PX = 12;
export const HIT_PX = 8;
/** Max. delay between two clicks/taps on the same point to count as the
 *  confirming double-click that arms the drag mode. Deliberately relaxed so
 *  slower clicks and double-taps on touchscreens register reliably. */
export const DOUBLE_CLICK_MS = 600;
export const COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3",
  "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#ffc107",
];

export function r3(n: number) {
  return Math.round(n * 100) / 100;
}

export function lineFormula(l: DrawnLine, xL: string, yL: string): string {
  const dx = l.x2 - l.x1;
  if (Math.abs(dx) < 1e-10) return `${xL} = ${r3(l.x1)}`;
  const m = (l.y2 - l.y1) / dx;
  const b = l.y1 - m * l.x1;
  const mStr = Math.abs(m) > 9999 ? m.toExponential(2) : `${r3(m)}`;
  const bAbs = Math.abs(r3(b));
  const bStr = bAbs > 9999 ? bAbs.toExponential(2) : `${bAbs}`;
  const sign = b < 0 ? "−" : "+";
  return `${yL} = ${mStr}·${xL} ${sign} ${bStr}`;
}

/** Distance from point p to the segment a-b. */
export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  if (ab2 <= 1e-9) return Math.hypot(apx, apy);
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}

/** Rounds a position to the grid whose steps are the distances between the first two tick values. */
export function snapToTicks(data: Pt, xTicks: number[], yTicks: number[]): Pt {
  const xStep = xTicks.length >= 2 ? Math.abs(xTicks[1] - xTicks[0]) : 1;
  const yStep = yTicks.length >= 2 ? Math.abs(yTicks[1] - yTicks[0]) : 1;
  return {
    x: Math.round(data.x / xStep) * xStep,
    y: Math.round(data.y / yStep) * yStep,
  };
}

/** Finite (x, y) values of the sets, skipping the hidden ones. */
export function visiblePoints(sets: ChartDataSet[], hidden: ReadonlySet<number>, xi: number, yi: number): Pt[] {
  return sets
    .filter((_, i) => !hidden.has(i))
    .map((s) => ({ x: Number(s.data[xi]), y: Number(s.data[yi]) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

/** Axis bounds that frame the points with a proportional margin (5 % of the range, at least 1 unit). */
export function framedBounds(points: Pt[]): ScaleBounds | null {
  if (points.length === 0) return null;
  let xMin = Math.min(...points.map((p) => p.x));
  let xMax = Math.max(...points.map((p) => p.x));
  let yMin = Math.min(...points.map((p) => p.y));
  let yMax = Math.max(...points.map((p) => p.y));
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const xPad = Math.max(1, (xMax - xMin) * 0.05);
  const yPad = Math.max(1, (yMax - yMin) * 0.05);
  return { xMin: xMin - xPad, xMax: xMax + xPad, yMin: yMin - yPad, yMax: yMax + yPad };
}

/** Indexes of the visible sets whose point lies inside the rectangle spanned by corners a and b. */
export function setsInRect(sets: ChartDataSet[], hidden: ReadonlySet<number>, xi: number, yi: number, a: Pt, b: Pt): number[] {
  const xMin = Math.min(a.x, b.x), xMax = Math.max(a.x, b.x);
  const yMin = Math.min(a.y, b.y), yMax = Math.max(a.y, b.y);
  const inside: number[] = [];
  sets.forEach((set, i) => {
    if (hidden.has(i)) return;
    const px = Number(set.data[xi]);
    const py = Number(set.data[yi]);
    if (isNaN(px) || isNaN(py)) return;
    if (px >= xMin && px <= xMax && py >= yMin && py <= yMax) inside.push(i);
  });
  return inside;
}

/** Copy of the sets with the point of set `index` moved. */
export function withPointAt(sets: ChartDataSet[], index: number, xi: number, yi: number, x: number, y: number): ChartDataSet[] {
  return sets.map((s, i) => {
    if (i !== index) return s;
    const data = [...s.data];
    data[xi] = x;
    data[yi] = y;
    return { ...s, data };
  });
}

/** The hidden indexes after the selected sets are deleted (the later ones move up). */
export function hiddenAfterDelete(hidden: ReadonlySet<number>, selected: ReadonlySet<number>): Set<number> {
  const sorted = [...selected].sort((a, b) => a - b);
  const next = new Set<number>();
  hidden.forEach((i) => {
    if (selected.has(i)) return;
    next.add(i - sorted.filter((d) => d < i).length);
  });
  return next;
}

/** The line through the leftmost and the rightmost of the points (ties by y), or null with fewer than two. */
export function outermostLine(points: Pt[]): DrawnLine | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const p1 = sorted[0];
  const p2 = sorted[sorted.length - 1];
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

/** The line `line` moved by the difference between two data positions. */
export function translatedLine(line: DrawnLine, from: Pt, to: Pt): DrawnLine {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return { x1: line.x1 + dx, y1: line.y1 + dy, x2: line.x2 + dx, y2: line.y2 + dy };
}

/** Text of the regression formula and of the correlation measures shown below the plot. */
export function regressionAnnotations(
  comp: RegressionComputation,
  pointCount: number,
  showCorrelation: boolean,
): { formula: string; correlation: string } {
  let formula = "";
  if (comp.fit) {
    formula = comp.fit.formula;
    if (comp.fit.warning) formula += ` — ${comp.fit.warning}`;
  }

  // Pearson r (linear association), Spearman ρ (monotone association —
  // meaningful for exponential/logarithmic trends) and model R²
  // (1 − SSres/SStot in original y-space; pseudo-R² for non-linear fits).
  let correlation = "";
  if (showCorrelation && pointCount >= 2) {
    const parts: string[] = [];
    if (comp.pearson !== null) parts.push(`r = ${comp.pearson.toFixed(2)}`);
    if (comp.spearman !== null) parts.push(`ρ = ${comp.spearman.toFixed(2)}`);
    if (comp.fit && comp.fit.r2 !== null) parts.push(`R² = ${comp.fit.r2.toFixed(2)}`);
    correlation = parts.join("   ");
  }
  return { formula, correlation };
}

/** The point that the arrow key `(dx, dy)` moves to from point `from`: the nearest one in that direction, favouring those straight ahead. Without a current point it starts at the extreme point of that direction. Returns `from` when no point lies in that direction. */
export function neighbourInDirection(points: Array<Pt & { index: number }>, from: number | null, dx: number, dy: number): number | null {
  if (points.length === 0) return null;
  const current = points.find((p) => p.index === from);
  if (!current) {
    const extreme = [...points].sort((a, b) => (a.x - b.x) * -dx + (a.y - b.y) * -dy)[0];
    return extreme.index;
  }
  let best: number | null = null;
  let bestScore = Infinity;
  for (const p of points) {
    if (p.index === current.index) continue;
    const along = (p.x - current.x) * dx + (p.y - current.y) * dy;
    if (along <= 0) continue;
    const across = Math.abs((p.x - current.x) * dy - (p.y - current.y) * dx);
    const score = along + 2 * across;
    if (score < bestScore) { bestScore = score; best = p.index; }
  }
  return best ?? current.index;
}
