import { html, css, PropertyValues } from "lit";
import { msg } from "@lit/localize";
import { customElement, property, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import * as d3regression from "d3-regression";
import { getContext } from "../chart-helpers";
import { GenericChart } from "../chart-base";
import { ChartDataSets, DrawnLine } from "../../../state/models";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";
import IconPluslg from "@tabler/icons/outline/plus.svg";
import IconTrash from "@tabler/icons/outline/trash.svg";
import IconArrowsMove from "@tabler/icons/outline/arrows-move.svg";
import IconLine from "@tabler/icons/outline/line.svg";

declare global {
  interface HTMLElementTagNameMap {
    "scatter-chart-js": ScatterChartJs;
  }
}

type Mode = "none" | "add-point" | "draw-line";


const SNAP_PX = 12;
const HIT_PX = 8;
const COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3",
  "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#ffc107",
];

function r3(n: number) {
  return Math.round(n * 100) / 100;
}

function lineFormula(l: DrawnLine, xL: string, yL: string): string {
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

@customElement("scatter-chart-js")
export class ScatterChartJs extends GenericChart<Record<string, never>> {
  /** Column index for the X axis — avoids all string-matching issues. */
  @property({ type: Number })
  accessor xAxisIndex: number = 0;

  /** Column index for the Y axis. */
  @property({ type: Number })
  accessor yAxisIndex: number = 1;

@state() private accessor _mode: Mode = "none";


@state() private accessor _lines: DrawnLine[] = [];

@state() private accessor _selCount = 0;


@state() private accessor _selLineIdx: number | null = null;

/** Local shadow copy of dataset sets — all plot edits live here until "Apply to data" is clicked. */
@state() private accessor _localSets: any[] | null = null;

/** True when there are uncommitted local plot changes. */
@state() private accessor _hasPendingChanges = false;


/** Index of line currently hovered by mouse (for formula tooltip). */
@state() private accessor _hoveredLineIdx: number | null = null;

/** Right-click coordinate editor popup state. */
@state() private accessor _editPopup: {
  pointIdx: number; x: number; y: number; px: number; py: number;
} | null = null;

/** Canvas pixel where "Connect data points" tooltip should appear (when 2+ points selected in select-click mode). */
@state() private accessor _connectTooltipPx: { x: number; y: number } | null = null;

private _chart: Chart<"scatter", any, unknown> | null = null;

private _sel = new Set<number>();

private _hid = new Set<number>();

private _brushStartPx: { x: number; y: number } | null = null;

private _brushCurrPx: { x: number; y: number } | null = null;

private _brushCursorTimer: ReturnType<typeof setTimeout> | null = null;

private _lineStart: { x: number; y: number } | null = null;

private _lineCursorPx: { x: number; y: number } | null = null;

private _dragLineEP: { idx: number; ep: "start" | "end" } | null = null;

private _dragLineEPPos: { x: number; y: number } | null = null;

private _dragLineEPMoved = false;

private _dragLine: { idx: number; start: { x: number; y: number }; line: DrawnLine } | null = null;

private _dragLinePos: DrawnLine | null = null;

private _dragLineMoved = false;

private _connectTooltipTimer: ReturnType<typeof setTimeout> | null = null;

private _dragPoint: { setIdx: number } | null = null;

/** Snapped position during an active point drag — used for visual rendering. */
private _dragPos: { x: number; y: number } | null = null;

/** Raw (un-snapped) mouse position during drag — used for scale expansion target. */
private _dragRawPos: { x: number; y: number } | null = null;

/** Scale bounds locked at drag-start to prevent chart rescaling during drag. */
private _lockedScaleBounds: { xMin: number; xMax: number; yMin: number; yMax: number } | null = null;

/** Last known mouse position over a hovered line — for tooltip placement. */
private _hoverPx: { x: number; y: number } | null = null;

private _hoveredPointIdx: number | null = null;

private _skipNextClick = false;

/** requestAnimationFrame id for smooth scale expansion during drag. */
private _scaleExpRAFId = 0;
/** Timer id for the expansion delay (ms before scale starts growing). */
private _scaleExpTimer: ReturnType<typeof setTimeout> | null = null;

private _hMD!: (e: MouseEvent) => void;

private _hMM!: (e: MouseEvent) => void;

private _hMU!: (e: MouseEvent) => void;

private _hCK!: (e: MouseEvent) => void;

private _hKD!: (e: KeyboardEvent) => void;



private _hML!: () => void; // mouseleave → clear hover

private _resizeObserver: ResizeObserver | null = null;

private _plugin: { id: string; afterDraw: (chart: Chart) => void };

/** Per-point animation progress 0→1 for the dotted-line-to-axis animation. */
private _animProgress: number[] = [];
private _animRaf: number | null = null;

constructor() {
    super();
    this._plugin = {
      id: "scatter-interaction",
      afterDraw: (chart: Chart) => {
        const ctx = chart.ctx;
        ctx.save();

        // ── Brush selection rectangle ─────────────────────────────────────────
        if (this._brushStartPx && this._brushCurrPx) {
          const rx = this._brushStartPx.x;
          const ry = this._brushStartPx.y;
          const rw = this._brushCurrPx.x - rx;
          const rh = this._brushCurrPx.y - ry;
          ctx.strokeStyle = "rgba(33,150,243,0.8)";
          ctx.fillStyle = "rgba(33,150,243,0.1)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(rx, ry, rw, rh);
          ctx.fillRect(rx, ry, rw, rh);
          ctx.setLineDash([]);
        }

        const opts = this.sharedState?.chart?.options ?? {};
        const xi = this.xAxisIndex;
        const yi = this.yAxisIndex;
        if (xi < 0 || yi < 0) { ctx.restore(); return; }

        const sets = this._getWorkingSets();
        const allPoints = sets
          .filter((_: any, i: number) => !this._hid.has(i))
          .map((s: any) => ({ x: Number(s.data[xi]), y: Number(s.data[yi]) }))
          .filter((p: any) => Number.isFinite(p.x) && Number.isFinite(p.y));

        const a = chart.chartArea;
        const xSc = chart.scales.x;
        const ySc = chart.scales.y;

        // ── Sequential dotted-line-to-axis animation ──────────────────────────
        if (Boolean(opts.animation) && this._animProgress.length > 0) {
          ctx.save();
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.5;
          sets.forEach((s: any, i: number) => {
            const prog = this._animProgress[i] ?? 0;
            if (prog <= 0 || this._hid.has(i)) return;
            const dx = Number(s.data[xi]);
            const dy = Number(s.data[yi]);
            if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
            const px = xSc.getPixelForValue(dx);
            const py = ySc.getPixelForValue(dy);
            const color = s.color ?? COLORS[i % COLORS.length];
            ctx.strokeStyle = color + "bb";
            // Horizontal line: from y-axis left edge → point x, at point y
            ctx.beginPath();
            ctx.moveTo(a.left, py);
            ctx.lineTo(a.left + (px - a.left) * prog, py);
            ctx.stroke();
            // Vertical line: from x-axis bottom → point y, at point x
            ctx.beginPath();
            ctx.moveTo(px, a.bottom);
            ctx.lineTo(px, a.bottom - (a.bottom - py) * prog, );
            ctx.stroke();
          });
          ctx.restore();
        }

        // ── Outlier highlighting (IQR) ────────────────────────────────────────
        if (opts.showOutliers && allPoints.length >= 4) {
          const pct = (s: number[], p: number) => {
            const idx = p * (s.length - 1);
            const lo = Math.floor(idx), hi = Math.ceil(idx);
            return s[lo] + (s[hi] - s[lo]) * (idx - lo);
          };
          const iqrBounds = (vals: number[]) => {
            const s = [...vals].sort((a, b) => a - b);
            const q1 = pct(s, 0.25), q3 = pct(s, 0.75);
            const iqr = q3 - q1;
            return { lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };
          };
          const bx = iqrBounds(allPoints.map((p: any) => p.x));
          const by = iqrBounds(allPoints.map((p: any) => p.y));
          allPoints.forEach((p: any) => {
            const isOut = p.x < bx.lo || p.x > bx.hi || p.y < by.lo || p.y > by.hi;
            if (!isOut) return;
            const px = xSc.getPixelForValue(p.x);
            const py = ySc.getPixelForValue(p.y);
            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.strokeStyle = "#ff9800";
            ctx.lineWidth = 2;
            ctx.stroke();
          });
        }

        // ── Mean lines ───────────────────────────────────────────────────────
        if (opts.showMean && allPoints.length > 0) {
          const mx = allPoints.reduce((s: number, p: any) => s + p.x, 0) / allPoints.length;
          const my = allPoints.reduce((s: number, p: any) => s + p.y, 0) / allPoints.length;

          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 1.5;

          // Mean X vertical line
          const mxPx = xSc.getPixelForValue(mx);
          if (mxPx >= a.left && mxPx <= a.right) {
            ctx.strokeStyle = "#9c27b0";
            ctx.beginPath();
            ctx.moveTo(mxPx, a.top);
            ctx.lineTo(mxPx, a.bottom);
            ctx.stroke();
            ctx.fillStyle = "#9c27b0";
            ctx.font = "11px sans-serif";
            ctx.fillText(`x̄=${r3(mx)}`, mxPx + 3, a.top + 12);
          }

          // Mean Y horizontal line
          const myPy = ySc.getPixelForValue(my);
          if (myPy >= a.top && myPy <= a.bottom) {
            ctx.strokeStyle = "#009688";
            ctx.beginPath();
            ctx.moveTo(a.left, myPy);
            ctx.lineTo(a.right, myPy);
            ctx.stroke();
            ctx.fillStyle = "#009688";
            ctx.font = "11px sans-serif";
            ctx.fillText(`ȳ=${r3(my)}`, a.left + 4, myPy - 4);
          }
          ctx.restore();
        }

        // ── Regression line ───────────────────────────────────────────────────
        const regressionType = this.sharedState?.regressionType ?? "none";
        if (regressionType !== "none" && allPoints.length >= 2) {
          let reg: any;
          try {
            if (regressionType === "Linear Regression") {
              reg = (d3regression.regressionLinear() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
            } else if (regressionType === "Polynomial Regression") {
              reg = (d3regression.regressionQuad() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
            } else if (regressionType === "Local Regression") {
              reg = (d3regression.regressionLoess() as any).bandwidth(0.3).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
            } else if (regressionType === "Exponential Regression") {
              reg = (d3regression.regressionExp() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
            } else if (regressionType === "Logarithmic Regression") {
              reg = (d3regression.regressionLog() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
            }
          } catch { reg = null; }

          if (reg && reg.length >= 2) {
            ctx.save();
            // Clip regression line to chart area so it doesn't extend beyond bounds
            ctx.beginPath();
            ctx.rect(a.left, a.top, a.right - a.left, a.bottom - a.top);
            ctx.clip();
            ctx.strokeStyle = "#e91e63";
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            let started = false;
            reg.forEach((pt: [number, number]) => {
              const px = xSc.getPixelForValue(pt[0]);
              const py = ySc.getPixelForValue(pt[1]);
              if (!started) { ctx.moveTo(px, py); started = true; }
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.restore();
          }
        }
        // Correlation and regression formula are rendered as HTML below the legend

        // ── Line endpoint handles (drawn last so data points always win) ─────
        if (this._lines.length > 0) {
          const epXSc = chart.scales?.x;
          const epYSc = chart.scales?.y;
          if (epXSc && epYSc) {
            // Collect pixel positions of all visible scatter points
            const scatterPxs = this._getWorkingSets()
              .map((s: any, idx: number) => {
                if (this._hid.has(idx)) return null;
                const sx = Number(s.data[xi]);
                const sy = Number(s.data[yi]);
                if (!Number.isFinite(sx) || !Number.isFinite(sy)) return null;
                return { px: epXSc.getPixelForValue(sx), py: epYSc.getPixelForValue(sy) };
              })
              .filter(Boolean) as Array<{ px: number; py: number }>;

            ctx.save();
            const ca = chart.chartArea;
            ctx.beginPath();
            ctx.rect(ca.left, ca.top, ca.right - ca.left, ca.bottom - ca.top);
            ctx.clip();

            this._lines.forEach((line: any, i: number) => {
              const isSel = i === this._selLineIdx;
              const al = this._getActiveLine(line, i);
              const color = isSel ? "#ff6600" : "#666";
              [[al.x1, al.y1], [al.x2, al.y2]].forEach(([lx, ly]) => {
                const px = epXSc.getPixelForValue(lx);
                const py = epYSc.getPixelForValue(ly);
                // If this endpoint sits on a scatter data point, skip the dot —
                // the data point itself is the visible anchor.
                const onPoint = scatterPxs.some(
                  (pp) => Math.hypot(px - pp.px, py - pp.py) < 7
                );
                if (onPoint) return;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });
            });
            ctx.restore();
          }
        }

        ctx.restore();
      },
    };
  }

static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .root {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      gap: 8px;
      overflow: hidden;
    }
    .chart-col {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }
    .chart-area {
      flex: 1 1 0;
      min-height: 0;
      min-width: 0;
      position: relative;
    }
    .chart-annotations {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: bold;
      flex-shrink: 0;
      gap: 12px;
    }
    .annotation-regression { color: #e91e63; }
    .annotation-correlation { color: #3f51b5; margin-left: auto; }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    .btn-col {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      gap: 7px;
      align-items: center;
    }
    .popup-content {
      display: flex;
      flex-direction: column;
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }
    .line-tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.82);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 100;
      white-space: nowrap;
      line-height: 1.5;
    }
    .line-tooltip-name {
      font-weight: 600;
      margin-bottom: 1px;
    }
    .line-edit-bar {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.14);
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      z-index: 60;
      white-space: nowrap;
    }
    .line-edit-bar input {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
      width: 100px;
    }
    .line-edit-bar .line-formula {
      color: #555;
      font-size: 11px;
    }
    sl-button::part(base) {
      align-items: center;
    }
    sl-button sl-icon {
      pointer-events: none;
    }
    .coord-popup {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      padding: 10px 12px;
      z-index: 100;
      min-width: 160px;
      font-size: 13px;
    }
    .coord-popup-title {
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 12px;
      color: #555;
    }
    .coord-popup-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }
    .coord-popup-row label {
      width: 18px;
      font-weight: 600;
      color: #333;
    }
    .coord-popup-row input {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 13px;
      width: 80px;
    }
    .coord-popup-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .coord-popup-actions button {
      flex: 1;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
      cursor: pointer;
      font-size: 12px;
    }
    .coord-popup-actions button.apply {
      background: #2196f3;
      color: white;
      border-color: #2196f3;
    }
    .connect-tooltip {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      padding: 4px 8px;
      z-index: 200;
      pointer-events: auto;
      white-space: nowrap;
    }
  `;

public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-tooltip": SlTooltip,
      "sl-popup": SlPopup,
      "sl-icon": SlIcon,
    };
  }

/** Return the effective line position for index i, accounting for active drags. */
  private _getActiveLine(line: DrawnLine, i: number): DrawnLine {
    if (this._dragLine?.idx === i && this._dragLinePos) return this._dragLinePos;
    if (this._dragLineEP?.idx === i && this._dragLineEPPos) {
      const p = this._dragLineEPPos;
      return this._dragLineEP.ep === "start"
        ? { ...line, x1: p.x, y1: p.y }
        : { ...line, x2: p.x, y2: p.y };
    }
    return line;
  }

private _createChart() {
    // Destroy existing instance if any (handles axis/data full resets)
    if (this._chart) {
      const oldCanvas = this._chart.canvas;
      oldCanvas.removeEventListener("mousedown", this._hMD);
      oldCanvas.removeEventListener("mousemove", this._hMM);
      oldCanvas.removeEventListener("mouseup", this._hMU);
      oldCanvas.removeEventListener("click", this._hCK);
      oldCanvas.removeEventListener("mouseleave", this._hML);
      this._chart.destroy();
      this._chart = null;
    }

    let ctx: CanvasRenderingContext2D;
    try { ctx = getContext(this); } catch { return; }

    // Saved colors/sizes for legend hover — restored on leave
    let legendSaved: Array<{ bc: any; bgc: any; pr: any }> | null = null;
    const dimLegendColor = (c: any): any => {
      if (typeof c !== "string" || c.length < 4) return c;
      if (c.startsWith("rgba(")) return c.replace(/,\s*[\d.]+\)$/, ", 0.25)");
      if (c.startsWith("rgb(")) return c.replace("rgb(", "rgba(").replace(")", ", 0.25)");
      const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
      return hex.slice(0, 7) + "40";
    };

    this._chart = new Chart<"scatter", any, unknown>(ctx as any, {
      type: "scatter",
      data: { datasets: this._buildDatasets() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        events: ["click", "mousemove", "mouseout"],
        plugins: {
          legend: {
            position: "bottom",
            onHover: (_e: any, item: any, legend: any) => {
              if (legend.chart.canvas) legend.chart.canvas.style.cursor = "pointer";
              const chart = legend.chart;
              if (!legendSaved) {
                legendSaved = chart.data.datasets.map((ds: any) => ({
                  bc: ds.borderColor,
                  bgc: ds.backgroundColor,
                  pr: (ds as any).pointRadius,
                }));
              }
              chart.data.datasets.forEach((ds: any, i: number) => {
                if (i !== item.datasetIndex) {
                  ds.borderColor = dimLegendColor(ds.borderColor);
                  ds.backgroundColor = dimLegendColor(ds.backgroundColor);
                } else {
                  // Boost hovered: brighter fill + larger point
                  if (typeof ds.backgroundColor === "string" && ds.backgroundColor.length >= 7) {
                    ds.backgroundColor = ds.backgroundColor.slice(0, 7) + "CC";
                  }
                  if ((ds as any).type !== "line") {
                    (ds as any).pointRadius = ((ds as any).pointRadius ?? 6) + 2;
                  }
                }
              });
              chart.update("none");
            },
            onLeave: (_e: any, _item: any, legend: any) => {
              this._updateCursor();
              const chart = legend.chart;
              if (legendSaved) {
                chart.data.datasets.forEach((ds: any, i: number) => {
                  if (!legendSaved![i]) return;
                  ds.borderColor = legendSaved![i].bc;
                  ds.backgroundColor = legendSaved![i].bgc;
                  (ds as any).pointRadius = legendSaved![i].pr;
                });
                legendSaved = null;
              }
              chart.update("none");
            },
          },
          title: { display: false },
          tooltip: {
            enabled: true,
            mode: "nearest",
            intersect: true,
            callbacks: {
              label: (ctx) => {
                const pt = ctx.raw as { x: number; y: number };
                return `${ctx.dataset.label}: (${r3(pt.x)}, ${r3(pt.y)})`;
              },
            },
          },
        },
        scales: {
          x: { type: "linear", grid: { display: true }, title: { display: true, text: this._labels()[this.xAxisIndex] ?? "" } },
          y: { type: "linear", grid: { display: true }, title: { display: true, text: this._labels()[this.yAxisIndex] ?? "" } },
        },
      },
      plugins: [this._plugin],
    });

    this._applyFixedPointBounds();
    this._chart.update("none");

    const canvas = this._chart.canvas;
    canvas.addEventListener("mousedown", this._hMD);
    canvas.addEventListener("mousemove", this._hMM);
    canvas.addEventListener("mouseup", this._hMU);
    canvas.addEventListener("click", this._hCK);
    canvas.addEventListener("mouseleave", this._hML);
  }

  override firstUpdated() {
    // Restore lines persisted across page reloads via sharedState
    const saved = this.sharedState?.scatterLines;
    if (Array.isArray(saved) && saved.length > 0) this._lines = saved;

    this._hMD = this._handleMousedown.bind(this);
    this._hMM = this._handleMousemove.bind(this);
    this._hMU = this._handleMouseup.bind(this);
    this._hCK = this._handleClick.bind(this);
    this._hKD = this._handleKeydown.bind(this);
    this._hML = () => {
      if (this._hoveredLineIdx !== null) this._hoveredLineIdx = null;
      if (this._hoveredPointIdx !== null) { this._hoveredPointIdx = null; this._updateCursor(); }
    };

    window.addEventListener("mouseup", this._hMU);
    this.tabIndex = -1;
    this.addEventListener("keydown", this._hKD);

    // The canvas lives inside a sl-tab-panel that starts hidden (display:none).
    // Chart.js silently aborts rendering when the canvas has 0px dimensions.
    // Use a ResizeObserver to defer chart creation until the canvas is actually
    // visible, and to resize the chart whenever the container changes size.
    const canvas = this.shadowRoot?.getElementById("chart-canvas") as HTMLCanvasElement | null;
    if (canvas) {
      canvas.addEventListener("mouseleave", this._hML);
      this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            if (!this._chart) {
              this._createChart();
            } else {
              this._chart.resize();
            }
          }
        }
      });
      this._resizeObserver.observe(canvas);
    }

    // Add pointer cursor to legend items to indicate interactivity
    const applyLegendCursor = () => {
      const legendItems = document.querySelectorAll('.chartjs-legend li');
      legendItems.forEach(item => {
        (item as HTMLElement).style.cursor = 'pointer';
      });
    };
    // Apply immediately and retry if needed
    applyLegendCursor();
    setTimeout(applyLegendCursor, 100);
    setTimeout(applyLegendCursor, 300);
  }

private _showConnectTooltip(px: { x: number; y: number }) {
    if (this._connectTooltipTimer !== null) clearTimeout(this._connectTooltipTimer);
    this._connectTooltipPx = px;
    this._connectTooltipTimer = setTimeout(() => {
      this._connectTooltipPx = null;
      this._connectTooltipTimer = null;
    }, 1500);
  }

  private _hideConnectTooltip() {
    if (this._connectTooltipTimer !== null) { clearTimeout(this._connectTooltipTimer); this._connectTooltipTimer = null; }
    this._connectTooltipPx = null;
  }

override disconnectedCallback() {
    super.disconnectedCallback();
    this._stopScaleExp();
    if (this._connectTooltipTimer !== null) clearTimeout(this._connectTooltipTimer);
    if (this._brushCursorTimer !== null) { clearTimeout(this._brushCursorTimer); this._brushCursorTimer = null; }
    if (this._animRaf !== null) { cancelAnimationFrame(this._animRaf); this._animRaf = null; }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._chart && this._hMD) {
      const canvas = this._chart.canvas;
      canvas.removeEventListener("mousedown", this._hMD);
      canvas.removeEventListener("mousemove", this._hMM);
      canvas.removeEventListener("mouseup", this._hMU);
      canvas.removeEventListener("click", this._hCK);
      canvas.removeEventListener("mouseleave", this._hML);
    }
    if (this._hMU) window.removeEventListener("mouseup", this._hMU);
    if (this._hMM) window.removeEventListener("mousemove", this._hMM);
    if (this._hKD) this.removeEventListener("keydown", this._hKD);
    // Also remove from the static canvas element (registered in firstUpdated)
    const staticCanvas = this.shadowRoot?.getElementById("chart-canvas") as HTMLCanvasElement | null;
    if (staticCanvas && this._hML) staticCanvas.removeEventListener("mouseleave", this._hML);
    this._chart?.destroy();
    this._chart = null;
  }

override updated(changed: PropertyValues) {
    const axisChanged = changed.has("xAxisIndex") || changed.has("yAxisIndex");
    const dataChanged = changed.has("datasets") || axisChanged;
    const lineChanged = changed.has("_lines") || changed.has("_selLineIdx");
    const optionsChanged = changed.has("sharedState");

    // Persist drawn lines to sharedState so they survive tab switches and page reloads
    if (changed.has("_lines")) this._persistLines();

    // Notify parent when pending-changes state flips so it can show/hide the Apply button
    if (changed.has("_hasPendingChanges")) {
      this.sharedState = { ...this.sharedState, hasPendingScatterChanges: this._hasPendingChanges };
      this.dispatchStateChange();
    }

    if (!this._chart) return;

    if (axisChanged) {
      // Reset all local state on axis change — positions are axis-dependent
      this._localSets = null;
      this._hasPendingChanges = false;
      this._editPopup = null;
      this._sel.clear();
      this._hid.clear();
      this._selCount = 0;
    } else if (changed.has("datasets") && !this._hasPendingChanges) {
      // External data update — re-sync local sets (only if no pending changes)
      this._localSets = null;
      this._editPopup = null;
    }

    if (dataChanged) {
      const newCount = this._getWorkingSets().length;
      this._sel.forEach((i) => { if (i >= newCount) this._sel.delete(i); });
      this._hid.forEach((i) => { if (i >= newCount) this._hid.delete(i); });
      this._selCount = this._sel.size;
    }

    if (dataChanged || lineChanged) {
      this._chart.data.datasets = this._buildDatasets();
    }

    if (axisChanged) {
      // Update scale titles in-place — no destroy needed
      const labels = this._labels();
      (this._chart.options.scales!.x as any).title.text = labels[this.xAxisIndex] ?? "";
      (this._chart.options.scales!.y as any).title.text = labels[this.yAxisIndex] ?? "";
      this._applyFixedPointBounds();
    } else if (dataChanged) {
      this._applyFixedPointBounds();
    } else if (optionsChanged) {
      this._applyFixedPointBounds();
    }

    if (dataChanged || lineChanged || optionsChanged) {
      this._chart.update("none");
    }
  }

  /** Whether coordinates should snap to integers (from options panel). */
  private get _snapToGrid(): boolean {
    return Boolean(this.sharedState?.chart?.options?.snapToGrid ?? true);
  }

  /** Returns the current working set array (local shadow or parent). */
  private _getWorkingSets(): any[] {
    if (this._localSets !== null) return this._localSets;
    const ds = this.datasets as ChartDataSets;
    return ds?.sets ?? [];
  }

  /** Ensure _localSets is initialized from parent before mutating. */
  private _ensureLocalSets() {
    if (this._localSets === null) {
      const ds = this.datasets as ChartDataSets;
      this._localSets = JSON.parse(JSON.stringify(ds?.sets ?? []));
    }
  }

  /** Return dataset labels with underscores restored to spaces.
   *  sharedState is reflect:true on StateComponent, so WebWriter serializes it
   *  as an HTML attribute and converts spaces → underscores in the JSON.
   *  We undo that here so display text is always correct. */
  private _labels(): string[] {
    return ((this.datasets as ChartDataSets)?.labels ?? [])
      .map(l => l.replace(/_/g, " ").trim());
  }

  private _buildDatasets(): any[] {
    const sets = this._getWorkingSets();
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) {
      return [];
    }

    const pointDatasets = sets.flatMap((set, i) => {
      let x = Number((set.data as any[])[xi]);
      let y = Number((set.data as any[])[yi]);
      // Use live drag position for the point being dragged (smooth visual)
      if (this._dragPoint?.setIdx === i && this._dragPos) {
        x = this._dragPos.x;
        y = this._dragPos.y;
      }
      if (isNaN(x) || isNaN(y)) return [];
      const isSel = this._sel.has(i);
      const isHid = this._hid.has(i);
      const base = set.color ?? COLORS[i % COLORS.length];
      return [
        {
          label: set.name,
          data: [{ x, y }],
          backgroundColor: isHid
            ? "transparent"
            : isSel
            ? "rgba(220,0,0,0.3)"
            : `${base}4D`, 
          borderColor: isSel ? "#cc0000" : base,
          borderWidth: isSel ? 2 : 1,
          pointRadius: isHid ? 0 : 6,
          pointHoverRadius: isHid ? 0 : 9,
          pointHoverBorderWidth: 2,
          pointHitRadius: isHid ? 0 : HIT_PX,
        },
      ];
    });

    const lineDatasets = this._lines.map((line, i) => {
      const isSel = i === this._selLineIdx;
      const al = this._getActiveLine(line, i);
      return {
        type: "line",
        label: line.name ?? `Line ${i + 1}`,
        data: [{ x: al.x1, y: al.y1 }, { x: al.x2, y: al.y2 }],
        parsing: false,
        // Endpoints are drawn in beforeDatasetsDraw behind scatter points
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 8,
        borderColor: isSel ? "#ff6600" : "#444",
        borderWidth: isSel ? 2.5 : 2,
        tension: 0,
        fill: false,
        order: -1,
      };
    });

    const previewLine =
      this._lineStart && this._lineCursorPx
        ? (() => {
            const cursor = this._pxToData(this._lineCursorPx);
            if (!cursor) return null;
            return {
              type: "line",
              label: "Preview line",
              data: [
                { x: this._lineStart.x, y: this._lineStart.y },
                { x: cursor.x, y: cursor.y },
              ],
              parsing: false,
              pointRadius: 0,
              pointHitRadius: 0,
              borderColor: "#444",
              borderWidth: 2,
              borderDash: [6, 3],
              tension: 0,
              fill: false,
            };
          })()
        : null;

    // Lines rendered first (behind points) so points remain clickable when overlapping
    return previewLine ? [...lineDatasets, ...pointDatasets, previewLine] : [...lineDatasets, ...pointDatasets];
  }

/** Update visual styles in-place without full dataset reconstruction. */
  private _refreshStyles() {
    if (!this._chart) return;
    this._chart.data.datasets = this._buildDatasets();
    this._chart.update("none");
  }

/** Convert MouseEvent to canvas pixel coords (handles HiDPI). */
  private _canvasPx(e: MouseEvent): { x: number; y: number } {
    const canvas = this._chart?.canvas;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    // Chart.js scale pixel APIs operate in CSS pixel space.
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /** Clamp a popup's (left,top) so it stays within the chart canvas area. */
  private _clampPopup(left: number, top: number, popupW: number, popupH: number) {
    const canvas = this._chart?.canvas;
    const cw = canvas?.offsetWidth ?? 400;
    const ch = canvas?.offsetHeight ?? 300;
    return {
      left: Math.max(4, Math.min(left, cw - popupW - 4)),
      top: Math.max(4, Math.min(top, ch - popupH - 4)),
    };
  }

private _pxToData(
    px: { x: number; y: number }
  ): { x: number; y: number } | null {
    if (!this._chart) return null;
    const x = this._chart.scales.x.getValueForPixel(px.x);
    const y = this._chart.scales.y.getValueForPixel(px.y);
    return x !== undefined && y !== undefined ? { x, y } : null;
  }


/** Index of nearest visible point within HIT_PX, or null. */
  private _pointAtPx(px: { x: number; y: number }): number | null {
    if (!this._chart) return null;
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return null;
    let best: number | null = null;
    let bestD = HIT_PX;
    this._getWorkingSets().forEach((set, i) => {
      if (this._hid.has(i)) return;
      const dx = (this._dragPoint?.setIdx === i && this._dragPos) ? this._dragPos.x : Number(set.data[xi]);
      const dy = (this._dragPoint?.setIdx === i && this._dragPos) ? this._dragPos.y : Number(set.data[yi]);
      if (isNaN(dx) || isNaN(dy)) return;
      const ppx = this._chart!.scales.x.getPixelForValue(dx);
      const ppy = this._chart!.scales.y.getPixelForValue(dy);
      const d = Math.hypot(ppx - px.x, ppy - px.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

/**
   * Return data-space coords, snapping to the nearest visible point
   * if it is within SNAP_PX pixels (magnet effect for line endpoints).
   */
  private _snapData(px: { x: number; y: number }): { x: number; y: number } {
    if (!this._chart) return this._pxToData(px) ?? { x: 0, y: 0 };
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    let best: { x: number; y: number } | null = null;
    let bestD = SNAP_PX;
    this._getWorkingSets().forEach((set, i) => {
      if (this._hid.has(i)) return;
      const dx = Number(set.data[xi]);
      const dy = Number(set.data[yi]);
      if (isNaN(dx) || isNaN(dy)) return;
      const ppx = this._chart!.scales.x.getPixelForValue(dx);
      const ppy = this._chart!.scales.y.getPixelForValue(dy);
      const d = Math.hypot(ppx - px.x, ppy - px.y);
      if (d < bestD) { bestD = d; best = { x: dx, y: dy }; }
    });
    return best ?? (this._pxToData(px) ?? { x: 0, y: 0 });
  }

/** Nearest line endpoint within 10px, or null. */
  private _lineEPAtPx(
    px: { x: number; y: number }
  ): { idx: number; ep: "start" | "end" } | null {
    if (!this._chart) return null;
    let best: { idx: number; ep: "start" | "end" } | null = null;
    let bestD = 10;
    this._lines.forEach((l, i) => {
      let x1 = l.x1, y1 = l.y1, x2 = l.x2, y2 = l.y2;
      if (this._dragLineEP?.idx === i && this._dragLineEPPos) {
        if (this._dragLineEP.ep === "start") { x1 = this._dragLineEPPos.x; y1 = this._dragLineEPPos.y; }
        else { x2 = this._dragLineEPPos.x; y2 = this._dragLineEPPos.y; }
      }
      const x1p = this._chart!.scales.x.getPixelForValue(x1);
      const y1p = this._chart!.scales.y.getPixelForValue(y1);
      const x2p = this._chart!.scales.x.getPixelForValue(x2);
      const y2p = this._chart!.scales.y.getPixelForValue(y2);
      const d1 = Math.hypot(x1p - px.x, y1p - px.y);
      const d2 = Math.hypot(x2p - px.x, y2p - px.y);
      if (d1 < bestD) { bestD = d1; best = { idx: i, ep: "start" }; }
      if (d2 < bestD) { bestD = d2; best = { idx: i, ep: "end" }; }
    });
    return best;
  }

/** Nearest line body within 8px, or null. */
  private _lineAtPx(px: { x: number; y: number }): number | null {
    if (!this._chart) return null;
    const distToSegment = (
      p: { x: number; y: number },
      a: { x: number; y: number },
      b: { x: number; y: number }
    ) => {
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const apx = p.x - a.x;
      const apy = p.y - a.y;
      const ab2 = abx * abx + aby * aby;
      if (ab2 <= 1e-9) return Math.hypot(apx, apy);
      const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
      const cx = a.x + t * abx;
      const cy = a.y + t * aby;
      return Math.hypot(p.x - cx, p.y - cy);
    };

    let bestIdx: number | null = null;
    let bestD = 8;
    this._lines.forEach((l, i) => {
      const a = {
        x: this._chart!.scales.x.getPixelForValue(l.x1),
        y: this._chart!.scales.y.getPixelForValue(l.y1),
      };
      const b = {
        x: this._chart!.scales.x.getPixelForValue(l.x2),
        y: this._chart!.scales.y.getPixelForValue(l.y2),
      };
      const d = distToSegment(px, a, b);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

/** Capture current rendered scale bounds so drag doesn't cause rescaling. */
  private _lockScaleBounds() {
    if (!this._chart) return;
    this._lockedScaleBounds = {
      xMin: this._chart.scales.x.min,
      xMax: this._chart.scales.x.max,
      yMin: this._chart.scales.y.min,
      yMax: this._chart.scales.y.max,
    };
  }

  /** Apply locked bounds to chart options (call before chart.update during drag). */
  private _applyLockedBounds() {
    if (!this._lockedScaleBounds || !this._chart) return;
    const xs = this._chart.options.scales!.x as any;
    const ys = this._chart.options.scales!.y as any;
    xs.grace = undefined;
    xs.min = this._lockedScaleBounds.xMin;
    xs.max = this._lockedScaleBounds.xMax;
    ys.grace = undefined;
    ys.min = this._lockedScaleBounds.yMin;
    ys.max = this._lockedScaleBounds.yMax;
  }

/** Snap a data-space position to the nearest visible grid tick intersection. */
  private _snapDragPos(data: { x: number; y: number }): { x: number; y: number } {
    if (!this._chart) return data;
    const xTicks = this._chart.scales.x.ticks;
    const yTicks = this._chart.scales.y.ticks;
    const xStep = xTicks.length >= 2 ? Math.abs(xTicks[1].value - xTicks[0].value) : 1;
    const yStep = yTicks.length >= 2 ? Math.abs(yTicks[1].value - yTicks[0].value) : 1;
    return {
      x: Math.round(data.x / xStep) * xStep,
      y: Math.round(data.y / yStep) * yStep,
    };
  }

/** Stop any running scale expansion (timer + RAF). */
  private _stopScaleExp() {
    cancelAnimationFrame(this._scaleExpRAFId);
    this._scaleExpRAFId = 0;
    if (this._scaleExpTimer) { clearTimeout(this._scaleExpTimer); this._scaleExpTimer = null; }
  }

/** Lerp the chart scale toward the position of the dragged item + buffer.
  *  Runs via requestAnimationFrame so the expansion is smooth and followable. */
  private _tickScaleExp(dragPos: { x: number; y: number }) {
    if (!this._chart || !this._lockedScaleBounds) { this._stopScaleExp(); return; }
    const xScale = this._chart.options.scales!.x as any;
    const yScale = this._chart.options.scales!.y as any;

    const target = {
      xMin: Math.min(xScale.min, dragPos.x - 1),
      xMax: Math.max(xScale.max, dragPos.x + 1),
      yMin: Math.min(yScale.min, dragPos.y - 1),
      yMax: Math.max(yScale.max, dragPos.y + 1),
    };

    // 4% lerp per frame (~60 fps) → smooth, unhurried scale growth
    const f = 0.04;
    xScale.min += (target.xMin - xScale.min) * f;
    xScale.max += (target.xMax - xScale.max) * f;
    yScale.min += (target.yMin - yScale.min) * f;
    yScale.max += (target.yMax - yScale.max) * f;

    this._lockedScaleBounds = { xMin: xScale.min, xMax: xScale.max, yMin: yScale.min, yMax: yScale.max };

    this._chart.data.datasets = this._buildDatasets();
    this._chart.update("none");

    const converged =
      Math.abs(xScale.min - target.xMin) < 0.05 &&
      Math.abs(xScale.max - target.xMax) < 0.05 &&
      Math.abs(yScale.min - target.yMin) < 0.05 &&
      Math.abs(yScale.max - target.yMax) < 0.05;

    if (!converged) {
      this._scaleExpRAFId = requestAnimationFrame(() => {
        // Use raw (unsnapped) position so the target tracks the actual cursor, not the snapped tick
        const pos = this._dragRawPos ?? (this._dragLinePos
          ? { x: (this._dragLinePos.x1 + this._dragLinePos.x2) / 2, y: (this._dragLinePos.y1 + this._dragLinePos.y2) / 2 }
          : dragPos);
        this._tickScaleExp(pos);
      });
    } else {
      xScale.min = target.xMin; xScale.max = target.xMax;
      yScale.min = target.yMin; yScale.max = target.yMax;
      this._lockedScaleBounds = { ...target };
      this._chart.update("none");
      this._scaleExpRAFId = 0;
    }
  }

/** Check if a data position is outside locked bounds and trigger delayed smooth expansion. */
  private _maybeExpandScale(pos: { x: number; y: number }) {
    if (!this._lockedScaleBounds) return;
    const { xMin, xMax, yMin, yMax } = this._lockedScaleBounds;
    const outside = pos.x < xMin || pos.x > xMax || pos.y < yMin || pos.y > yMax;
    if (!outside) { this._stopScaleExp(); return; }
    if (this._scaleExpRAFId !== 0) {
      // Already animating — let RAF pick up latest _dragPos automatically
      return;
    }
    if (!this._scaleExpTimer) {
      // 700 ms delay so the user can see the current scale before it expands
      this._scaleExpTimer = setTimeout(() => {
        this._scaleExpTimer = null;
        const p = this._dragPos ?? pos;
        this._scaleExpRAFId = requestAnimationFrame(() => this._tickScaleExp(p));
      }, 700);
    }
  }

private _snapDataCoord(coord: { x: number; y: number }): { x: number; y: number } {
    if (!this._chart) return coord;
    const px = {
      x: this._chart.scales.x.getPixelForValue(coord.x),
      y: this._chart.scales.y.getPixelForValue(coord.y),
    };
    return this._snapData(px);
  }

private _applyOptions() {
    if (!this._chart) return;
    const opts = this.sharedState?.chart?.options ?? {};

    // Grid visibility
    const showGrid = Boolean(opts.showGrid ?? true);
    const xScale = this._chart.options.scales?.x as any;
    const yScale = this._chart.options.scales?.y as any;
    if (xScale?.grid) xScale.grid.display = showGrid;
    if (yScale?.grid) yScale.grid.display = showGrid;

    // Animation — always disable Chart.js built-in; use custom sequential dotted-line animation
    (this._chart.options as any).animation = false;
    if (Boolean(opts.animation ?? false)) this._startAnimation();
  }

  private _startAnimation() {
    if (this._animRaf !== null) { cancelAnimationFrame(this._animRaf); this._animRaf = null; }
    const sets = this._getWorkingSets();
    const count = sets.length;
    if (count === 0 || !this._chart) return;
    this._animProgress = new Array(count).fill(0);
    const PER_POINT_MS = 500;   // animation duration per point
    const DELAY_MS = 160;       // stagger between points
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      let anyActive = false;
      for (let i = 0; i < count; i++) {
        const t = (elapsed - i * DELAY_MS) / PER_POINT_MS;
        this._animProgress[i] = Math.min(1, Math.max(0, t));
        if (this._animProgress[i] < 1) anyActive = true;
      }
      this._chart?.update("none");
      if (anyActive) this._animRaf = requestAnimationFrame(animate);
      else this._animRaf = null;
    };
    this._animRaf = requestAnimationFrame(animate);
  }

private _applyFixedPointBounds() {
    if (!this._chart) return;
    this._applyOptions();

    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return;

    const xScale = this._chart.options.scales?.x as any;
    const yScale = this._chart.options.scales?.y as any;

    const points = this._getWorkingSets()
      .map((set) => ({
        x: Number(set.data[xi]),
        y: Number(set.data[yi]),
      }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

    if (points.length === 0) return;

    let xMin = Math.min(...points.map((p) => p.x));
    let xMax = Math.max(...points.map((p) => p.x));
    let yMin = Math.min(...points.map((p) => p.y));
    let yMax = Math.max(...points.map((p) => p.y));

    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }

    // Proportional buffer: 5% of range, minimum 1 unit
    const xPad = Math.max(1, (xMax - xMin) * 0.05);
    const yPad = Math.max(1, (yMax - yMin) * 0.05);

    if (xScale) {
      xScale.grace = undefined;
      xScale.min = xMin - xPad;
      xScale.max = xMax + xPad;
    }
    if (yScale) {
      yScale.grace = undefined;
      yScale.min = yMin - yPad;
      yScale.max = yMax + yPad;
    }
  }

private _setMode(m: Mode) {
    this._mode = m;
    this._lineStart = null;
    this._lineCursorPx = null;
    this._brushStartPx = null;
    this._brushCurrPx = null;
    this._dragLineEP = null;
    this._dragLineEPPos = null;
    this._dragLine = null;
    this._dragLinePos = null;
    this._dragPoint = null;
    this._hideConnectTooltip();
    this._updateCursor();
    if (this._chart) {
      this._chart.data.datasets = this._buildDatasets();
    }
    this._chart?.update("none"); // clear any in-progress visual overlays
  }

private _toggle(m: Mode) {
    if (this._mode === m) this._setMode("none");
    else this._setMode(m);
  }

private _updateCursor() {
    const canvas = this._chart?.canvas;
    if (!canvas) return;
    if (this._dragPoint || this._dragLine || this._dragLineEP) { canvas.style.cursor = "grabbing"; return; }
    if (this._brushStartPx) { canvas.style.cursor = "crosshair"; return; }
    if (this._mode === "add-point" || this._mode === "draw-line") { canvas.style.cursor = "crosshair"; return; }
    if (this._hoveredPointIdx !== null && this._sel.has(this._hoveredPointIdx)) {
      canvas.style.cursor = "grab"; return;
    }
    if (this._hoveredPointIdx !== null || this._hoveredLineIdx !== null) {
      canvas.style.cursor = "pointer"; return;
    }
    canvas.style.cursor = "default";
  }

private _handleMousedown(e: MouseEvent) {
    if (e.button !== 0) return;
    const px = this._canvasPx(e);

    if (this._mode === "draw-line") {
      // Mousedown near an existing endpoint → start endpoint drag
      const ep = this._lineEPAtPx(px);
      if (ep) {
        this._dragLineEP = ep;
        this._dragLineEPPos = this._snapData(px);
        this._dragLineEPMoved = false;
        this._updateCursor();
        window.addEventListener("mousemove", this._hMM);
        e.preventDefault();
        return;
      }

      // Mousedown on line body → drag whole line
      const li = this._lineAtPx(px);
      if (li !== null) {
        const start = this._pxToData(px);
        if (start) {
          this._dragLine = { idx: li, start, line: { ...this._lines[li] } };
          this._dragLinePos = { ...this._lines[li] };
          this._updateCursor();
          window.addEventListener("mousemove", this._hMM);
          e.preventDefault();
          return;
        }
      }
      // Line drawing itself is handled in _handleClick (two-click flow)
      return;
    }

    if (this._mode === "none") {
      // Line endpoint drag
      const ep = this._lineEPAtPx(px);
      if (ep) {
        this._dragLineEP = ep;
        this._dragLineEPPos = this._snapData(px);
        this._dragLineEPMoved = false;
        this._updateCursor();
        window.addEventListener("mousemove", this._hMM);
        e.preventDefault();
        return;
      }
      // Line body drag
      const li = this._lineAtPx(px);
      if (li !== null) {
        const start = this._pxToData(px);
        if (start) {
          this._dragLine = { idx: li, start, line: { ...this._lines[li] } };
          this._dragLinePos = { ...this._lines[li] };
          this._updateCursor();
          window.addEventListener("mousemove", this._hMM);
          e.preventDefault();
          return;
        }
      }
      // Selected point drag — blocked when coordinate-edit popup is open
      const pi = this._pointAtPx(px);
      if (pi !== null && this._sel.has(pi) && !this._editPopup) {
        this._dragPoint = { setIdx: pi };
        this._lockScaleBounds();
        this._updateCursor();
        window.addEventListener("mousemove", this._hMM);
        e.preventDefault();
        return;
      }
      // Fallback: start brush selection on empty area or unselected point
      this._brushStartPx = px;
      this._brushCurrPx = { ...px };
      this._updateCursor();
      // If mouse doesn't move within 500ms, revert crosshair back to default
      if (this._brushCursorTimer !== null) clearTimeout(this._brushCursorTimer);
      this._brushCursorTimer = setTimeout(() => {
        this._brushCursorTimer = null;
        if (!this._brushStartPx) return;
        const dx = (this._brushCurrPx?.x ?? px.x) - this._brushStartPx.x;
        const dy = (this._brushCurrPx?.y ?? px.y) - this._brushStartPx.y;
        if (Math.hypot(dx, dy) <= 4) {
          this._brushStartPx = null;
          this._brushCurrPx = null;
          this._updateCursor();
        }
      }, 500);
      e.preventDefault();
    }
  }

private _handleMousemove(e: MouseEvent) {
    const px = this._canvasPx(e);

    // ── Line hover detection (for formula tooltip) ────────────────────────
    const isActive = this._brushStartPx || this._dragPoint || this._dragLine || this._dragLineEP;
    if (!isActive) {
      const hli = this._lineAtPx(px);
      if (hli !== this._hoveredLineIdx) {
        this._hoveredLineIdx = hli; // @state triggers Lit re-render for show/hide
        this._updateCursor();
      }
      if (hli !== null) {
        this._hoverPx = { x: px.x, y: px.y };
        // Update tooltip position directly (avoids full re-render on every move)
        const tip = this.shadowRoot?.querySelector(".line-tooltip") as HTMLElement | null;
        if (tip) {
          tip.style.left = `${px.x + 14}px`;
          tip.style.top = `${px.y - 16}px`;
        }
      }
    } else if (this._hoveredLineIdx !== null) {
      this._hoveredLineIdx = null;
    }

    // ── Point hover detection (for cursor) ───────────────────────────────
    if (!isActive) {
      const pi = this._pointAtPx(px);
      if (pi !== this._hoveredPointIdx) {
        this._hoveredPointIdx = pi;
        this._updateCursor();
      }
    } else if (this._hoveredPointIdx !== null) {
      this._hoveredPointIdx = null;
    }

    if (this._brushStartPx) {
      this._brushCurrPx = px;
      this._chart?.update("none");
      return;
    }

    // Endpoint drag — snap to nearby data point (magnet), fall back to raw coords.
    if (this._dragLineEP !== null) {
      const epData = this._snapData(px);
      this._dragLineEPPos = epData;
      this._dragLineEPMoved = true;
      this._skipNextClick = true;
      this._maybeExpandScale(epData);
      if (this._scaleExpRAFId === 0) {
        this._chart!.data.datasets = this._buildDatasets();
        this._applyLockedBounds();
        this._chart?.update("none");
      }
      return;
    }

    if (this._mode === "draw-line") {
      if (this._dragLine !== null) {
        const cur = this._pxToData(px);
        if (cur) {
          const dx = cur.x - this._dragLine.start.x;
          const dy = cur.y - this._dragLine.start.y;
          this._dragLinePos = {
            x1: this._dragLine.line.x1 + dx,
            y1: this._dragLine.line.y1 + dy,
            x2: this._dragLine.line.x2 + dx,
            y2: this._dragLine.line.y2 + dy,
          };
          this._dragLineMoved = true;
          this._skipNextClick = true;
          const mid = { x: (this._dragLinePos.x1 + this._dragLinePos.x2) / 2, y: (this._dragLinePos.y1 + this._dragLinePos.y2) / 2 };
          this._maybeExpandScale(mid);
          if (this._scaleExpRAFId === 0) {
            this._chart!.data.datasets = this._buildDatasets();
            this._applyLockedBounds();
            this._chart?.update("none");
          }
        }
        return;
      }

      if (this._lineStart !== null) {
        this._lineCursorPx = px;
        this._chart!.data.datasets = this._buildDatasets();
        this._chart?.update("none");
      }
      return;
    }

    if (this._dragLine !== null) {
      const cur = this._pxToData(px);
      if (cur) {
        const dx = cur.x - this._dragLine.start.x;
        const dy = cur.y - this._dragLine.start.y;
        this._dragLinePos = {
          x1: this._dragLine.line.x1 + dx,
          y1: this._dragLine.line.y1 + dy,
          x2: this._dragLine.line.x2 + dx,
          y2: this._dragLine.line.y2 + dy,
        };
        this._dragLineMoved = true;
        this._skipNextClick = true;
        const mid = { x: (this._dragLinePos.x1 + this._dragLinePos.x2) / 2, y: (this._dragLinePos.y1 + this._dragLinePos.y2) / 2 };
        this._maybeExpandScale(mid);
        if (this._scaleExpRAFId === 0) {
          this._chart!.data.datasets = this._buildDatasets();
          this._applyLockedBounds();
          this._chart?.update("none");
        }
      }
      return;
    }

    if (this._dragPoint !== null) {
      const data = this._pxToData(px);
      if (!data || !this._chart) return;
      this._dragRawPos = data;
      // When snap is ON: snap to visible grid tick; when OFF: use raw position
      this._dragPos = this._snapToGrid ? this._snapDragPos(data) : data;
      this._skipNextClick = true;
      this._maybeExpandScale(data);                  // use raw so snapping can't hide out-of-bounds
      if (this._scaleExpRAFId === 0) {
        this._chart.data.datasets = this._buildDatasets();
        this._applyLockedBounds();
        this._chart.update("none");
      }
    }
  }

private _handleMouseup(e: MouseEvent) {
    if (e.button !== 0) return;
    window.removeEventListener("mousemove", this._hMM);
    if (this._brushCursorTimer !== null) { clearTimeout(this._brushCursorTimer); this._brushCursorTimer = null; }

    // ── End brush selection ────────────────────────────────────────────────
    if (this._brushStartPx && this._brushCurrPx) {
      const s = this._pxToData(this._brushStartPx);
      const c = this._pxToData(this._brushCurrPx);
      const brushDist = Math.hypot(
        this._brushCurrPx.x - this._brushStartPx.x,
        this._brushCurrPx.y - this._brushStartPx.y
      );
      if (s && c && brushDist > 4) {
        const xMin = Math.min(s.x, c.x), xMax = Math.max(s.x, c.x);
        const yMin = Math.min(s.y, c.y), yMax = Math.max(s.y, c.y);
        const xi = this.xAxisIndex;
        const yi = this.yAxisIndex;
        if (xi >= 0 && yi >= 0) {
          const inArea: number[] = [];
          this._getWorkingSets().forEach((set: any, i: number) => {
            if (this._hid.has(i)) return;
            const px = Number(set.data[xi]);
            const py = Number(set.data[yi]);
            if (isNaN(px) || isNaN(py)) return;
            if (px >= xMin && px <= xMax && py >= yMin && py <= yMax) inArea.push(i);
          });
          // If all points in area are already selected → deselect all; else select all
          const allSelected = inArea.length > 0 && inArea.every(i => this._sel.has(i));
          inArea.forEach(i => {
            if (allSelected) this._sel.delete(i);
            else this._sel.add(i);
          });
          this._selCount = this._sel.size;
          this._refreshStyles();
          this.requestUpdate();
        }
      }
      this._brushStartPx = null;
      this._brushCurrPx = null;
      this._chart?.update("none");
      if (brushDist > 4) this._skipNextClick = true;
    }

    // ── End point drag: commit position to _localSets ───────────────────────
    if (this._dragPoint !== null) {
      this._stopScaleExp(); // stop any in-progress scale expansion
      const actuallyMoved = this._dragPos !== null;
      if (actuallyMoved) {
        const si = this._dragPoint.setIdx;
        const xi = this.xAxisIndex;
        const yi = this.yAxisIndex;
        // When snap ON: _dragPos is already at the grid tick. When OFF: round raw to 3 decimals.
        const raw = this._dragRawPos ?? this._dragPos!;
        const finalX = this._snapToGrid ? this._dragPos!.x : Math.round(raw.x * 100) / 100;
        const finalY = this._snapToGrid ? this._dragPos!.y : Math.round(raw.y * 100) / 100;
        this._ensureLocalSets();
        this._localSets = this._localSets!.map((s: any, i: number) => {
          if (i !== si) return s;
          const newData = [...s.data];
          newData[xi] = finalX;
          newData[yi] = finalY;
          return { ...s, data: newData };
        });
        this._hasPendingChanges = true;
        this._skipNextClick = true; // only skip click after an actual drag
      }
      this._dragPos = null;
      this._dragRawPos = null;
      this._dragPoint = null;
      this._lockedScaleBounds = null;
      this._updateCursor();
      if (this._chart) {
        this._chart.data.datasets = this._buildDatasets();
        this._applyFixedPointBounds();
        this._chart.update("none");
      }
    }

    // ── End line endpoint drag: commit to _lines ───────────────────────────
    if (this._dragLineEP !== null) {
      this._stopScaleExp();
      if (this._dragLineEPMoved && this._dragLineEPPos !== null) {
        const { idx, ep } = this._dragLineEP;
        const pos = this._dragLineEPPos;
        this._lines = this._lines.map((l, i) =>
          i === idx
            ? ep === "start"
              ? { ...l, x1: pos.x, y1: pos.y }
              : { ...l, x2: pos.x, y2: pos.y }
            : l
        );
        // _lines is @state(), triggers updated() → chart.update('none')
        this._skipNextClick = true;
      }
      this._dragLineEP = null;
      this._dragLineEPPos = null;
      this._dragLineEPMoved = false;
    }

    // ── End whole-line drag: commit translated and snapped endpoints ───────
    if (this._dragLine !== null) {
      this._stopScaleExp();
      if (this._dragLineMoved && this._dragLinePos !== null) {
        const idx = this._dragLine.idx;
        const s1 = this._snapDataCoord({ x: this._dragLinePos.x1, y: this._dragLinePos.y1 });
        const s2 = this._snapDataCoord({ x: this._dragLinePos.x2, y: this._dragLinePos.y2 });
        this._lines = this._lines.map((l, i) => (i === idx ? { ...l, x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y } : l));
        this._skipNextClick = true;
      }
      this._dragLine = null;
      this._dragLinePos = null;
      this._dragLineMoved = false;
    }

    this._updateCursor();
  }

private _handleClick(e: MouseEvent) {
    if (this._skipNextClick) { this._skipNextClick = false; return; }
    const px = this._canvasPx(e);

    // ── Add point ─────────────────────────────────────────────────────────
    if (this._mode === "add-point") {
      const data = this._pxToData(px);
      if (data) this._addPoint(data.x, data.y);
      return;
    }

    // ── Draw line: two-click flow ─────────────────────────────────────────
    if (this._mode === "draw-line") {
      if (this._lineStart === null) {
        // First click: set first endpoint
        this._lineStart = this._snapData(px);
        this._lineCursorPx = px;
        this._chart!.data.datasets = this._buildDatasets();
        this._chart?.update("none");
      } else {
        // Second click: create line, then immediately deactivate draw-line mode
        const end = this._snapData(px);
        const length = Math.hypot(end.x - this._lineStart.x, end.y - this._lineStart.y);
        if (length > 1e-10) {
          this._lines = [
            ...this._lines,
            { x1: this._lineStart.x, y1: this._lineStart.y, x2: end.x, y2: end.y, name: `Line ${this._lines.length + 1}` },
          ];
        }
        this._setMode("none"); // deactivates button immediately
      }
      return;
    }

    // ── None mode: line body has priority, then point click ─────────────
    if (this._mode === "none") {
      const li = this._lineAtPx(px);
      if (li !== null) {
        this._selLineIdx = li === this._selLineIdx ? null : li;
        this._chart?.update("none");
        return;
      }
      const pi = this._pointAtPx(px);
      if (pi !== null) {
        if (this._sel.has(pi)) this._sel.delete(pi);
        else this._sel.add(pi);
        this._selCount = this._sel.size;
        if (this._selCount >= 2) this._showConnectTooltip(px);
        else this._hideConnectTooltip();
        this._refreshStyles();
        this.focus(); // ensure keyboard events (Delete/Backspace) work
        this.requestUpdate();
        return;
      }
      if (this._selLineIdx !== null) {
        this._selLineIdx = null;
        this._chart?.update("none");
      }
    }
  }

private _handleKeydown(e: KeyboardEvent) {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (this._selLineIdx !== null) {
        this._lines = this._lines.filter((_, i) => i !== this._selLineIdx);
        this._selLineIdx = null;
      } else if (this._selCount > 0) {
        this._deleteSelected();
      }
    }
  }

private _deleteSelected() {
    this._ensureLocalSets();
    const sorted = [...this._sel].sort((a, b) => a - b);
    const newHid = new Set<number>();
    this._hid.forEach((i) => {
      if (this._sel.has(i)) return;
      const shift = sorted.filter((d) => d < i).length;
      newHid.add(i - shift);
    });
    this._localSets = this._localSets!.filter((_: any, i: number) => !this._sel.has(i));
    this._hid = newHid;
    this._sel.clear();
    this._selCount = 0;
    this._hasPendingChanges = true;
    if (this._chart) {
      this._chart.data.datasets = this._buildDatasets();
      this._applyFixedPointBounds();
      this._chart.update("none");
    }
    this.requestUpdate();
  }

private _connectSelected() {
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    const sets = this._getWorkingSets();
    const selPts = [...this._sel]
      .map(i => ({ i, x: Number(sets[i]?.data[xi]), y: Number(sets[i]?.data[yi]) }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (selPts.length < 2) return;
    // Outermost = leftmost and rightmost by x (tie-break by y)
    selPts.sort((a, b) => a.x - b.x || a.y - b.y);
    const p1 = selPts[0];
    const p2 = selPts[selPts.length - 1];
    this._lines = [...this._lines, { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, name: `Line ${this._lines.length + 1}` }];
    this._hideConnectTooltip();
    this._sel.clear();
    this._selCount = 0;
    this._refreshStyles();
    this.requestUpdate();
  }

private _addPoint(x: number, y: number) {
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return;

    if (this._snapToGrid && this._chart) {
      const s = this._snapDragPos({ x, y });
      x = s.x; y = s.y;
    } else {
      x = Math.round(x * 100) / 100;
      y = Math.round(y * 100) / 100;
    }

    this._ensureLocalSets();
    const newData = this._labels().map((_, i) => (i === xi ? x : i === yi ? y : 0));
    const color = COLORS[this._localSets!.length % COLORS.length];
    const newSet = {
      name: `Point ${this._localSets!.length + 1}`,
      color,
      data: newData,
      colors: newData.map(() => color),
    };
    this._localSets = [...this._localSets!, newSet];
    this._hasPendingChanges = true;
    if (this._chart) {
      this._chart.data.datasets = this._buildDatasets();
      this._applyFixedPointBounds();
      this._chart.update("none");
    }
    this.requestUpdate();
  }

private _persistLines() {
    // Only dispatch if the lines actually differ from what's already in sharedState
    if (JSON.stringify(this._lines) === JSON.stringify(this.sharedState?.scatterLines)) return;
    this.sharedState = { ...this.sharedState, scatterLines: [...this._lines] };
    this.dispatchStateChange();
  }

applyToData() {
    const local = this._localSets;
    if (!local) return;
    const ds = this.datasets as ChartDataSets;
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: { ...ds, sets: local as any },
      },
    };
    this.dispatchStateChange();
    this._hasPendingChanges = false;
    this._localSets = null; // re-init from parent (which now has our data)
  }


private _computeChartAnnotations(): { formula: string; correlation: string } {
    const opts = this.sharedState?.chart?.options ?? {};
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return { formula: "", correlation: "" };
    const sets = this._getWorkingSets();
    const allPoints = sets
      .filter((_: any, i: number) => !this._hid.has(i))
      .map((s: any) => ({ x: Number(s.data[xi]), y: Number(s.data[yi]) }))
      .filter((p: any) => Number.isFinite(p.x) && Number.isFinite(p.y));

    let formula = "";
    const regressionType = this.sharedState?.regressionType ?? "none";
    if (regressionType !== "none" && allPoints.length >= 2) {
      let reg: any;
      try {
        if (regressionType === "Linear Regression")
          reg = (d3regression.regressionLinear() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
        else if (regressionType === "Polynomial Regression")
          reg = (d3regression.regressionQuad() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
        else if (regressionType === "Exponential Regression")
          reg = (d3regression.regressionExp() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
        else if (regressionType === "Logarithmic Regression")
          reg = (d3regression.regressionLog() as any).x((d: any) => d.x).y((d: any) => d.y)(allPoints);
      } catch { reg = null; }
      if (reg) {
        const sgn = (v: number) => v < 0 ? "−" : "+";
        if (regressionType === "Linear Regression" && reg.a !== undefined) {
          formula = `y = ${r3(reg.a)}·x ${sgn(reg.b)} ${Math.abs(r3(reg.b))}`;
        } else if (regressionType === "Polynomial Regression" && reg.a !== undefined) {
          formula = `y = ${r3(reg.a)}x² ${sgn(reg.b)} ${Math.abs(r3(reg.b))}x ${sgn(reg.c)} ${Math.abs(r3(reg.c))}`;
        } else if (regressionType === "Exponential Regression" && reg.a !== undefined) {
          formula = `y = ${r3(reg.a)}·e^(${r3(reg.b)}·x)`;
        } else if (regressionType === "Logarithmic Regression" && reg.a !== undefined) {
          formula = `y = ${r3(reg.a)} ${sgn(reg.b)} ${Math.abs(r3(reg.b))}·ln(x)`;
        }
      }
    }

    let correlation = "";
    if (opts.showCorrelation && allPoints.length >= 2) {
      const n = allPoints.length;
      const mx = allPoints.reduce((s: number, p: any) => s + p.x, 0) / n;
      const my = allPoints.reduce((s: number, p: any) => s + p.y, 0) / n;
      const num = allPoints.reduce((s: number, p: any) => s + (p.x - mx) * (p.y - my), 0);
      const dx = Math.sqrt(allPoints.reduce((s: number, p: any) => s + (p.x - mx) ** 2, 0));
      const dy = Math.sqrt(allPoints.reduce((s: number, p: any) => s + (p.y - my) ** 2, 0));
      const corr = (dx * dy) > 0 ? num / (dx * dy) : 0;
      correlation = `r = ${(Math.round(corr * 100) / 100).toFixed(2)}`;
    }

    return { formula, correlation };
  }

override render() {
    const sets = this._getWorkingSets();
    const hasData = sets.length > 0;
    const { formula, correlation } = this._computeChartAnnotations();

    return html`
      <div class="root" @click=${() => { if (this._editPopup) this._editPopup = null; }}>
        <div class="chart-col">
        <div class="chart-area" style="position:relative;">
          <canvas id="chart-canvas"></canvas>

          <!-- ── Line formula hover tooltip ────────────────────── -->
          ${this._hoveredLineIdx !== null && this._hoverPx && this._lines[this._hoveredLineIdx] ? html`
            <div class="line-tooltip" style="left:${this._hoverPx.x + 14}px;top:${this._hoverPx.y - 16}px;">
              <div class="line-tooltip-name">${this._lines[this._hoveredLineIdx].name ?? `Line ${this._hoveredLineIdx + 1}`}</div>
              <div>${lineFormula(this._lines[this._hoveredLineIdx], "x", "y")}</div>
            </div>
          ` : ""}

          <!-- ── Connect data points tooltip ──────────────────── -->
          ${this._connectTooltipPx && this._selCount >= 2 ? (() => {
            const cc = this._clampPopup(this._connectTooltipPx.x + 14, this._connectTooltipPx.y - 20, 180, 36);
            return html`
            <div class="connect-tooltip"
              style="left:${cc.left}px;top:${cc.top}px;"
              @click=${(e: Event) => e.stopPropagation()}>
              <sl-button size="small" @click=${() => this._connectSelected()}>${msg("Connect data points")}</sl-button>
            </div>`;
          })() : ""}

          <!-- ── Selected line name editor (positioned near line midpoint) ── -->
          ${this._selLineIdx !== null && this._lines[this._selLineIdx] && !this._dragLine && !this._dragLineEP ? (() => {
            const sl = this._lines[this._selLineIdx!]!;
            let leftPx = "50%", topPx = "8px";
            if (this._chart) {
              const mx = this._chart.scales.x.getPixelForValue((sl.x1 + sl.x2) / 2);
              const my = this._chart.scales.y.getPixelForValue((sl.y1 + sl.y2) / 2);
              const clamped = this._clampPopup(mx + 12, my - 36, 300, 36);
              leftPx = `${clamped.left}px`;
              topPx = `${clamped.top}px`;
            }
            return html`
            <div class="line-edit-bar"
              style="left:${leftPx};top:${topPx};"
              @click=${(e: Event) => e.stopPropagation()}>
              <input
                type="text"
                .value=${sl.name ?? `Line ${this._selLineIdx! + 1}`}
                placeholder=${msg("Line name")}
                @input=${(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  this._lines = this._lines.map((l, i) =>
                    i === this._selLineIdx ? { ...l, name: val } : l
                  );
                }}
              />
              <span class="line-formula">${lineFormula(sl, "x", "y")}</span>
            </div>`;
          })() : ""}

          ${this._editPopup ? (() => {
            const cp = this._clampPopup(this._editPopup.px + 8, this._editPopup.py, 180, 130);
            return html`
            <div class="coord-popup" style="left:${cp.left}px;top:${cp.top}px;"
              @click=${(e: Event) => e.stopPropagation()}>
              <div class="coord-popup-title">${msg("Edit coordinates")}</div>
              <div class="coord-popup-row">
                <label>X</label>
                <input type="number" step=${"any"}
                  .value=${String(this._editPopup.x)}
                  @input=${(e: Event) => {
                    const v = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(v) && this._editPopup) this._editPopup = { ...this._editPopup, x: v };
                  }}
                />
              </div>
              <div class="coord-popup-row">
                <label>Y</label>
                <input type="number" step=${"any"}
                  .value=${String(this._editPopup.y)}
                  @input=${(e: Event) => {
                    const v = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(v) && this._editPopup) this._editPopup = { ...this._editPopup, y: v };
                  }}
                />
              </div>
              <div class="coord-popup-actions">
                <button class="apply" @click=${() => {
                  if (!this._editPopup) return;
                  const { pointIdx, x, y } = this._editPopup;
                  const xi = this.xAxisIndex;
                  const yi = this.yAxisIndex;
                  const snapped = this._snapToGrid && this._chart ? this._snapDragPos({ x, y }) : { x, y };
                  const finalX = this._snapToGrid ? snapped.x : x;
                  const finalY = this._snapToGrid ? snapped.y : y;
                  this._ensureLocalSets();
                  this._localSets = this._localSets!.map((s: any, i: number) => {
                    if (i !== pointIdx) return s;
                    const newData = [...s.data];
                    newData[xi] = finalX;
                    newData[yi] = finalY;
                    return { ...s, data: newData };
                  });
                  this._hasPendingChanges = true;
                  this._editPopup = null;
                  if (this._chart) {
                    this._chart.data.datasets = this._buildDatasets();
                    this._applyFixedPointBounds();
                    this._chart.update("none");
                  }
                }}>${msg("Apply")}</button>
                <button @click=${() => { this._editPopup = null; }}>${msg("Cancel")}</button>
              </div>
            </div>
          `; })() : ""}
        </div>

        ${(formula || correlation) ? html`
          <div class="chart-annotations">
            ${formula ? html`<span class="annotation-regression">${formula}</span>` : ""}
            ${correlation ? html`<span class="annotation-correlation">${correlation}</span>` : ""}
          </div>` : ""}
        </div><!-- end .chart-col -->

        <!-- ── Button column ──────────────────────────────────── -->
        <div class="btn-col">

          <!-- ── Add point ───────────────────────────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${!hasData
              ? msg("Add data first")
              : this._mode === "add-point"
              ? msg("Click on chart to place a new point")
              : msg("Add a data point")}
          >
            <sl-button size="small" circle
              variant=${this._mode === "add-point" ? "primary" : "default"}
              .disabled=${!hasData}
              @click=${() => this._toggle("add-point")}
            >
              <sl-icon src=${IconPluslg} label="Add point" style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <!-- ── Edit position of selected point ──────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${this._selCount !== 1 ? msg("Select exactly one point to edit its position") : msg("Edit point position")}
          >
            <sl-button size="small" circle
              .disabled=${this._selCount !== 1}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                const selIdx = [...this._sel][0];
                if (selIdx === undefined) return;
                const ws = this._getWorkingSets();
                const xi = this.xAxisIndex;
                const yi = this.yAxisIndex;
                const x = Number(ws[selIdx]?.data[xi]);
                const y = Number(ws[selIdx]?.data[yi]);
                if (!isNaN(x) && !isNaN(y) && this._chart) {
                  const ppx = this._chart.scales.x.getPixelForValue(x);
                  const ppy = this._chart.scales.y.getPixelForValue(y);
                  this._editPopup = { pointIdx: selIdx, x, y, px: ppx, py: ppy };
                }
              }}
            >
              <sl-icon src=${IconArrowsMove} label="Edit position" style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <!-- ── Draw line ───────────────────────────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${!hasData
              ? msg("Add data first")
              : this._mode === "draw-line"
              ? msg("Click two points to draw a line. Drag endpoints to adjust. Press Delete to remove selected.")
              : msg("Draw a line")}
          >
            <sl-button size="small" circle
              variant=${this._mode === "draw-line" ? "primary" : "default"}
              .disabled=${!hasData}
              @click=${() => this._toggle("draw-line")}
            >
              <sl-icon src=${IconLine} label="Draw line" style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <!-- ── Delete selected (points or line) ─────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${this._selLineIdx !== null
              ? `${msg("Delete")} "${this._lines[this._selLineIdx]?.name ?? `Line ${this._selLineIdx + 1}`}"`
              : this._selCount === 0
              ? msg("Select points or a line first")
              : `${msg("Delete")} ${this._selCount} ${this._selCount > 1 ? msg("selected points") : msg("selected point")}`}
          >
            <sl-button size="small" circle variant="danger"
              .disabled=${this._selCount === 0 && this._selLineIdx === null}
              @click=${() => {
                if (this._selLineIdx !== null) {
                  this._lines = this._lines.filter((_, i) => i !== this._selLineIdx);
                  this._selLineIdx = null;
                } else {
                  this._deleteSelected();
                }
              }}
            >
              <sl-icon src=${IconTrash} label="Delete" style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

        </div>
      </div>
    `;
  }
}