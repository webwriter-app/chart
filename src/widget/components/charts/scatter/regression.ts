// Pure math module for scatterplot statistics: regression fits (linear,
// polynomial, LOESS, exponential, logarithmic), residual-based outlier
// detection (IQR) and correlation measures (Pearson r, Spearman ρ, R²).
// No chart / DOM dependencies — fully unit-testable.
import type { RegressionType } from "../../../state/models";

export interface Point {
  x: number;
  y: number;
}

export interface RegressionFit {
  predict: (x: number) => number;
  curve: [number, number][];
  formula: string;
  r2: number | null;
  usedCount: number;
  warning?: string;
}

export interface RegressionOptions {
  degree?: number;
  span?: number;
}

export interface RegressionComputation {
  fit: RegressionFit | null;
  outlierMask: boolean[];
  pearson: number | null;
  spearman: number | null;
}

const CURVE_SAMPLES = 100;

// ─── Basic helpers ────────────────────────────────────────────────────────────

function mean(v: number[]): number {
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function quantile(sorted: number[], p: number): number {
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function median(v: number[]): number {
  return quantile([...v].sort((a, b) => a - b), 0.5);
}

function ranks(v: number[]): number[] {
  const order = v.map((val, i) => ({ val, i })).sort((a, b) => a.val - b.val);
  const r = new Array<number>(v.length);
  let k = 0;
  while (k < order.length) {
    let j = k;
    while (j + 1 < order.length && order[j + 1].val === order[k].val) j++;
    const avgRank = (k + j) / 2 + 1;
    for (let m = k; m <= j; m++) r[order[m].i] = avgRank;
    k = j + 1;
  }
  return r;
}

/**
 * Solve A·x = b via Gaussian elimination with partial pivoting.
 * Returns null when the system is (near-)singular.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return "NaN";
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1e4 || abs < 1e-3)) return v.toExponential(2);
  return String(Math.round(v * 1000) / 1000);
}

function signTerm(v: number): string {
  return v < 0 ? "−" : "+";
}

/** R² = 1 − SSres/SStot in the original y-space (pseudo-R² for non-linear fits). */
function rSquared(points: Point[], predict: (x: number) => number): number | null {
  const pairs = points
    .map((p) => ({ y: p.y, f: predict(p.x) }))
    .filter((p) => Number.isFinite(p.f));
  if (pairs.length < 2) return null;
  const my = mean(pairs.map((p) => p.y));
  const ssTot = pairs.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const ssRes = pairs.reduce((s, p) => s + (p.y - p.f) ** 2, 0);
  if (ssTot === 0) return null;
  return 1 - ssRes / ssTot;
}

function sampleCurve(
  predict: (x: number) => number,
  xMin: number,
  xMax: number
): [number, number][] {
  if (!(xMax > xMin)) {
    const y = predict(xMin);
    return Number.isFinite(y) ? [[xMin, y]] : [];
  }
  const out: [number, number][] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const x = xMin + ((xMax - xMin) * i) / CURVE_SAMPLES;
    const y = predict(x);
    if (Number.isFinite(y)) out.push([x, y]);
  }
  return out;
}

// ─── Correlation ──────────────────────────────────────────────────────────────

/** Pearson product-moment correlation coefficient r. */
export function pearson(points: Point[]): number | null {
  const n = points.length;
  if (n < 2) return null;
  const mx = mean(points.map((p) => p.x));
  const my = mean(points.map((p) => p.y));
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    dx2 += (p.x - mx) ** 2;
    dy2 += (p.y - my) ** 2;
  }
  const den = Math.sqrt(dx2) * Math.sqrt(dy2);
  return den > 0 ? num / den : null;
}

/** Spearman rank correlation ρ: Pearson on average-tie ranks. */
export function spearman(points: Point[]): number | null {
  if (points.length < 2) return null;
  const rx = ranks(points.map((p) => p.x));
  const ry = ranks(points.map((p) => p.y));
  return pearson(rx.map((x, i) => ({ x, y: ry[i] })));
}

// ─── Fits ─────────────────────────────────────────────────────────────────────

/**
 * Polynomial least squares of the given degree. x is centered and scaled
 * before building the normal equations to keep them well-conditioned; the
 * coefficients are expanded back to the original x for the formula.
 */
export function fitPolynomial(points: Point[], degree: number): RegressionFit | null {
  const n = points.length;
  // Clamp degree: at most n − 1 (unique solvability) and 6 (edge overfitting)
  const deg = Math.max(1, Math.min(Math.floor(degree) || 1, 6, n - 1));
  if (n < 2) return null;

  const mx = mean(points.map((p) => p.x));
  const sx = Math.sqrt(mean(points.map((p) => (p.x - mx) ** 2))) || 1;
  const t = points.map((p) => (p.x - mx) / sx);

  // Normal equations Σ t^(i+j)·β_j = Σ t^i·y
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i <= deg; i++) {
    A.push([]);
    for (let j = 0; j <= deg; j++) {
      A[i].push(t.reduce((s, tv) => s + tv ** (i + j), 0));
    }
    b.push(t.reduce((s, tv, k) => s + tv ** i * points[k].y, 0));
  }
  const beta = solveLinearSystem(A, b);
  if (!beta) return null;

  const predict = (x: number) => {
    const tv = (x - mx) / sx;
    let y = 0;
    for (let k = deg; k >= 0; k--) y = y * tv + beta[k];
    return y;
  };

  // Expand β(t) with t = (x − mx)/sx into coefficients of x for the formula
  let coeffs = [beta[deg]];
  for (let k = deg - 1; k >= 0; k--) {
    const next = new Array<number>(coeffs.length + 1).fill(0);
    for (let i = 0; i < coeffs.length; i++) {
      next[i] += (coeffs[i] * -mx) / sx;
      next[i + 1] += coeffs[i] / sx;
    }
    next[0] += beta[k];
    coeffs = next;
  }
  const terms: string[] = [];
  for (let k = coeffs.length - 1; k >= 0; k--) {
    const c = coeffs[k];
    const xPart = k === 0 ? "" : k === 1 ? "·x" : `·x${superscript(k)}`;
    if (terms.length === 0) terms.push(`${fmt(c)}${xPart}`);
    else terms.push(`${signTerm(c)} ${fmt(Math.abs(c))}${xPart}`);
  }

  const xs = points.map((p) => p.x);
  return {
    predict,
    curve: sampleCurve(predict, Math.min(...xs), Math.max(...xs)),
    formula: `y = ${terms.join(" ")}`,
    r2: rSquared(points, predict),
    usedCount: n,
  };
}

function superscript(k: number): string {
  const sup = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  return String(k).split("").map((d) => sup[Number(d)]).join("");
}

/** Ordinary least squares line y = m·x + b. */
export function fitLinear(points: Point[]): RegressionFit | null {
  const fit = fitPolynomial(points, 1);
  if (!fit) return null;
  // Recompute m and b directly for an exact, simply-formatted formula
  const mx = mean(points.map((p) => p.x));
  const my = mean(points.map((p) => p.y));
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  if (den === 0) return null;
  const m = num / den;
  const b = my - m * mx;
  const predict = (x: number) => m * x + b;
  const xs = points.map((p) => p.x);
  return {
    predict,
    curve: sampleCurve(predict, Math.min(...xs), Math.max(...xs)),
    formula: `y = ${fmt(m)}·x ${signTerm(b)} ${fmt(Math.abs(b))}`,
    r2: rSquared(points, predict),
    usedCount: points.length,
  };
}

/**
 * Robust LOESS: locally weighted quadratic regression with tricube kernel
 * (degree 2 is R's loess default — local linear underestimates peaks) plus
 * two robustness iterations (bisquare weights on residuals, LOWESS-style).
 * `span` ∈ (0, 1] is the fraction of points per local window.
 */
export function fitLoess(points: Point[], span: number): RegressionFit | null {
  const n = points.length;
  if (n < 3) return null;
  const s = Math.min(1, Math.max(0.15, Number.isFinite(span) ? span : 0.5));
  const k = Math.max(3, Math.min(n, Math.ceil(s * n)));
  const pts = [...points].sort((a, b) => a.x - b.x);

  // Local weighted polynomial fit at x0, centered (t = x − x0) so the
  // prediction is simply the intercept β₀. Falls back degree 2 → 1 → 0
  // when the local system is singular (e.g. too few distinct x values).
  const localFit = (x0: number, robust: number[]): number => {
    const dists = pts.map((p) => Math.abs(p.x - x0));
    const sortedD = [...dists].sort((a, b) => a - b);
    const dmax = sortedD[k - 1] || 1e-12;
    const idx: number[] = [];
    const w: number[] = [];
    for (let i = 0; i < n; i++) {
      const u = dists[i] / dmax;
      if (u >= 1) continue;
      const wi = (1 - u ** 3) ** 3 * robust[i];
      if (wi <= 0) continue;
      idx.push(i);
      w.push(wi);
    }
    if (idx.length === 0) return NaN;
    for (let deg = 2; deg >= 1; deg--) {
      const A: number[][] = [];
      const b: number[] = [];
      for (let i = 0; i <= deg; i++) {
        A.push(new Array(deg + 1).fill(0));
        b.push(0);
      }
      idx.forEach((pi, j) => {
        const t = pts[pi].x - x0;
        for (let i = 0; i <= deg; i++) {
          for (let c = 0; c <= deg; c++) A[i][c] += w[j] * t ** (i + c);
          b[i] += w[j] * t ** i * pts[pi].y;
        }
      });
      const beta = solveLinearSystem(A, b);
      if (beta) return beta[0];
    }
    // Degenerate window → weighted mean
    let sw = 0, swy = 0;
    idx.forEach((pi, j) => { sw += w[j]; swy += w[j] * pts[pi].y; });
    return sw > 0 ? swy / sw : NaN;
  };

  // Robustness iterations: fit → residuals → bisquare weights → refit
  let robust = new Array<number>(n).fill(1);
  for (let iter = 0; iter < 2; iter++) {
    const res = pts.map((p, i) => p.y - localFit(p.x, robust));
    const absRes = res.map(Math.abs);
    const sMed = median(absRes);
    if (sMed <= 1e-12) {
      // Near-exact fit for most points (median residual 0): zero-weight
      // only the clearly deviating points so lone outliers still drop out.
      const yScale = median(pts.map((p) => Math.abs(p.y))) || 1;
      const eps = 1e-9 * Math.max(1, yScale);
      if (absRes.every((r) => r <= eps)) break;
      robust = absRes.map((r) => (r <= eps ? 1 : 0));
      continue;
    }
    robust = res.map((r) => {
      const u = r / (6 * sMed);
      return Math.abs(u) < 1 ? (1 - u * u) ** 2 : 0;
    });
  }

  const finalRobust = robust;
  const predict = (x: number) => localFit(x, finalRobust);
  return {
    predict,
    curve: sampleCurve(predict, pts[0].x, pts[n - 1].x),
    formula: `LOESS (span = ${Math.round(s * 100) / 100})`,
    r2: rSquared(points, predict),
    usedCount: n,
  };
}

/**
 * Exponential model y = a·e^(b·x), fitted by weighted least squares on
 * ln(y) with weights y² — the first-order approximation of the original
 * least-squares problem (an unweighted log-fit would over-weight small y).
 * Points with y ≤ 0 cannot enter the model and are dropped with a warning.
 */
export function fitExponential(points: Point[]): RegressionFit | null {
  const valid = points.filter((p) => p.y > 0);
  const dropped = points.length - valid.length;
  if (valid.length < 2) return null;

  let sw = 0, swx = 0, swz = 0, swxx = 0, swxz = 0;
  for (const p of valid) {
    const w = p.y * p.y;
    const z = Math.log(p.y);
    sw += w;
    swx += w * p.x;
    swz += w * z;
    swxx += w * p.x * p.x;
    swxz += w * p.x * z;
  }
  const den = sw * swxx - swx * swx;
  if (Math.abs(den) < 1e-12) return null;
  const b = (sw * swxz - swx * swz) / den;
  const lnA = (swz - b * swx) / sw;
  const a = Math.exp(lnA);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const predict = (x: number) => a * Math.exp(b * x);
  const xs = valid.map((p) => p.x);
  return {
    predict,
    curve: sampleCurve(predict, Math.min(...xs), Math.max(...xs)),
    formula: `y = ${fmt(a)}·e^(${fmt(b)}·x)`,
    r2: rSquared(valid, predict),
    usedCount: valid.length,
    warning: dropped > 0 ? `${dropped} point${dropped > 1 ? "s" : ""} with y ≤ 0 ignored` : undefined,
  };
}

/**
 * Logarithmic model y = a + b·ln(x) via OLS on (ln x, y).
 * Points with x ≤ 0 are outside the model domain and dropped with a warning.
 */
export function fitLogarithmic(points: Point[]): RegressionFit | null {
  const valid = points.filter((p) => p.x > 0);
  const dropped = points.length - valid.length;
  if (valid.length < 2) return null;

  const lx = valid.map((p) => Math.log(p.x));
  const mlx = mean(lx);
  const my = mean(valid.map((p) => p.y));
  let num = 0;
  let den = 0;
  valid.forEach((p, i) => {
    num += (lx[i] - mlx) * (p.y - my);
    den += (lx[i] - mlx) ** 2;
  });
  if (den === 0) return null;
  const b = num / den;
  const a = my - b * mlx;

  const predict = (x: number) => (x > 0 ? a + b * Math.log(x) : NaN);
  const xs = valid.map((p) => p.x);
  return {
    predict,
    curve: sampleCurve(predict, Math.min(...xs), Math.max(...xs)),
    formula: `y = ${fmt(a)} ${signTerm(b)} ${fmt(Math.abs(b))}·ln(x)`,
    r2: rSquared(valid, predict),
    usedCount: valid.length,
    warning: dropped > 0 ? `${dropped} point${dropped > 1 ? "s" : ""} with x ≤ 0 ignored` : undefined,
  };
}

// ─── Outlier detection ────────────────────────────────────────────────────────

/** Tukey fences (1.5 × IQR); returns null bounds when IQR is 0 (no spread). */
function iqrBounds(values: number[]): { lo: number; hi: number } | null {
  const s = [...values].sort((a, b) => a - b);
  const q1 = quantile(s, 0.25);
  const q3 = quantile(s, 0.75);
  const iqr = q3 - q1;
  if (iqr <= 0) return null;
  return { lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };
}

/**
 * Model-based outliers: IQR fences on the residuals y − f(x) of the fit.
 * Points outside the model domain (prediction NaN) are never flagged.
 */
export function detectOutliersByResiduals(
  points: Point[],
  predict: (x: number) => number
): boolean[] {
  const residuals = points.map((p) => {
    const f = predict(p.x);
    return Number.isFinite(f) ? p.y - f : NaN;
  });
  const finite = residuals.filter(Number.isFinite);
  if (finite.length < 4) return points.map(() => false);
  const bounds = iqrBounds(finite);
  if (!bounds) return points.map(() => false);
  return residuals.map((r) => Number.isFinite(r) && (r < bounds.lo || r > bounds.hi));
}

/** Univariate fallback (no model selected): IQR fences on x and y separately. */
export function detectOutliersUnivariate(points: Point[]): boolean[] {
  if (points.length < 4) return points.map(() => false);
  const bx = iqrBounds(points.map((p) => p.x));
  const by = iqrBounds(points.map((p) => p.y));
  return points.map(
    (p) =>
      (bx !== null && (p.x < bx.lo || p.x > bx.hi)) ||
      (by !== null && (p.y < by.lo || p.y > by.hi))
  );
}

// ─── Orchestration ────────────────────────────────────────────────────────────

function fitModel(
  type: RegressionType,
  points: Point[],
  opts: RegressionOptions
): RegressionFit | null {
  if (points.length < 2) return null;
  switch (type) {
    case "Linear Regression":
      return fitLinear(points);
    case "Polynomial Regression":
      return fitPolynomial(points, opts.degree ?? 2);
    case "Local Regression":
      return fitLoess(points, opts.span ?? 0.5);
    case "Exponential Regression":
      return fitExponential(points);
    case "Logarithmic Regression":
      return fitLogarithmic(points);
    default:
      return null;
  }
}

/**
 * Full pipeline: fit the selected model, then flag outliers via IQR on the
 * residuals of that fit (univariate IQR when no model is selected).
 */
export function computeRegression(
  type: RegressionType,
  points: Point[],
  opts: RegressionOptions = {}
): RegressionComputation {
  const fit = fitModel(type, points, opts);

  const outlierMask = fit
    ? detectOutliersByResiduals(points, fit.predict)
    : detectOutliersUnivariate(points);

  return {
    fit,
    outlierMask,
    pearson: pearson(points),
    spearman: spearman(points),
  };
}
