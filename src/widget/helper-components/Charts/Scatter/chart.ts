import { html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { getContext } from "../functions";
import { GenericChart } from "../GenericChart";
import { ChartDataSets } from "../../../chart-models";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";
import IconPluslg from "bootstrap-icons/icons/plus-lg.svg";
import IconHandIndex from "bootstrap-icons/icons/hand-index.svg";
import IconEye from "bootstrap-icons/icons/eye.svg";
import IconPencil from "bootstrap-icons/icons/pencil.svg";

declare global {
  interface HTMLElementTagNameMap {
    "scatter-chart-js": ScatterChartJs;
  }
}

type Mode =
  | "none"
  | "add-point"
  | "select-click"
  | "select-brush"
  | "deselect-brush"
  | "draw-line";

interface DrawnLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const SNAP_PX = 12;
const HIT_PX = 8;
const COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3",
  "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#ffc107",
];

function r3(n: number) {
  return Math.round(n * 1000) / 1000;
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

@state() private accessor _showSelectMenu = false;

@state() private accessor _showEditMenu = false;

@state() private accessor _lines: DrawnLine[] = [];

@state() private accessor _selCount = 0;

@state() private accessor _hidCount = 0;

@state() private accessor _selLineIdx: number | null = null;

@state() private accessor _modifiedPoints: Map<number, { x: number; y: number }> = new Map();

private _chart: Chart<"scatter", any, unknown> | null = null;

private _sel = new Set<number>();

private _hid = new Set<number>();

private _brushStartPx: { x: number; y: number } | null = null;

private _brushCurrPx: { x: number; y: number } | null = null;

private _lineStart: { x: number; y: number } | null = null;

private _lineCursorPx: { x: number; y: number } | null = null;

private _dragLineEP: { idx: number; ep: "start" | "end" } | null = null;

private _dragLineEPPos: { x: number; y: number } | null = null;

private _dragLine: { idx: number; start: { x: number; y: number }; line: DrawnLine } | null = null;

private _dragLinePos: DrawnLine | null = null;

private _dragPoint: { setIdx: number } | null = null;

private _skipNextClick = false;

private _hMD!: (e: MouseEvent) => void;

private _hMM!: (e: MouseEvent) => void;

private _hMU!: (e: MouseEvent) => void;

private _hCK!: (e: MouseEvent) => void;

private _hKD!: (e: KeyboardEvent) => void;

private _resizeObserver: ResizeObserver | null = null;

private _plugin: { id: string; afterDraw: (chart: Chart) => void };

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
    .chart-area {
      flex: 1 1 0;
      height: 100%;
      min-width: 0;
      position: relative;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    .right-side {
      flex: 0 0 11rem;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px;
      max-height: 100%;
    }
    .btn-col {
      display: flex;
      flex-direction: column;
      gap: 7px;
      align-items: flex-end;
    }
    .popup-content {
      display: flex;
      flex-direction: column;
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }
    .line-table {
      overflow-y: auto;
      max-height: 12rem;
      font-size: 12px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th,
    td {
      border: 0.5px solid #aaa;
      padding: 2px 4px;
    }
    th {
      background: #f5f5f5;
      font-size: 12px;
      font-weight: 600;
    }
    td {
      font-size: 11px;
    }
    .line-row-selected td {
      background: #fff3e0;
    }
    sl-button::part(base) {
      align-items: center;
    }
    sl-button sl-icon {
      pointer-events: none;
    }
  `;

public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-tooltip": SlTooltip,
      "sl-popup": SlPopup,
      "sl-menu-item": SlMenuItem,
      "sl-icon": SlIcon,
    };
  }

private _createChart() {
    // Destroy existing instance if any (handles axis/data full resets)
    if (this._chart) {
      const oldCanvas = this._chart.canvas;
      oldCanvas.removeEventListener("mousedown", this._hMD);
      oldCanvas.removeEventListener("mousemove", this._hMM);
      oldCanvas.removeEventListener("mouseup", this._hMU);
      oldCanvas.removeEventListener("click", this._hCK);
      this._chart.destroy();
      this._chart = null;
    }

    let ctx: CanvasRenderingContext2D;
    try { ctx = getContext(this); } catch { return; }

    this._chart = new Chart<"scatter", any, unknown>(ctx as any, {
      type: "scatter",
      data: { datasets: this._buildDatasets() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        events: ["click", "mousemove", "mouseout"],
        plugins: {
          legend: { position: "bottom" },
          title: { display: !!this.label, text: this.label },
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
          x: { type: "linear", title: { display: true, text: this._labels()[this.xAxisIndex] ?? "" } },
          y: { type: "linear", title: { display: true, text: this._labels()[this.yAxisIndex] ?? "" } },
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
  }

  override firstUpdated() {
    this._hMD = this._handleMousedown.bind(this);
    this._hMM = this._handleMousemove.bind(this);
    this._hMU = this._handleMouseup.bind(this);
    this._hCK = this._handleClick.bind(this);
    this._hKD = this._handleKeydown.bind(this);

    window.addEventListener("mouseup", this._hMU);
    this.tabIndex = -1;
    this.addEventListener("keydown", this._hKD);

    // The canvas lives inside a sl-tab-panel that starts hidden (display:none).
    // Chart.js silently aborts rendering when the canvas has 0px dimensions.
    // Use a ResizeObserver to defer chart creation until the canvas is actually
    // visible, and to resize the chart whenever the container changes size.
    const canvas = this.shadowRoot?.getElementById("chart-canvas") as HTMLCanvasElement | null;
    if (canvas) {
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

override disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._chart && this._hMD) {
      const canvas = this._chart.canvas;
      canvas.removeEventListener("mousedown", this._hMD);
      canvas.removeEventListener("mousemove", this._hMM);
      canvas.removeEventListener("mouseup", this._hMU);
      canvas.removeEventListener("click", this._hCK);
    }
    if (this._hMU) window.removeEventListener("mouseup", this._hMU);
    if (this._hKD) this.removeEventListener("keydown", this._hKD);
    this._chart?.destroy();
    this._chart = null;
  }

override updated(changed: PropertyValues) {
    const axisChanged = changed.has("xAxisIndex") || changed.has("yAxisIndex");
    const dataChanged = changed.has("datasets") || axisChanged;
    const lineChanged = changed.has("_lines") || changed.has("_selLineIdx");
    const optionsChanged = changed.has("sharedState");

    if (!this._chart) return;

    if (axisChanged) {
      this._modifiedPoints.clear();
      this._sel.clear();
      this._hid.clear();
      this._selCount = 0;
      this._hidCount = 0;
    }

    if (dataChanged) {
      const newCount = (this.datasets as ChartDataSets)?.sets?.length ?? 0;
      this._sel.forEach((i) => { if (i >= newCount) this._sel.delete(i); });
      this._hid.forEach((i) => { if (i >= newCount) this._hid.delete(i); });
      this._modifiedPoints.forEach((_, i) => { if (i >= newCount) this._modifiedPoints.delete(i); });
      this._selCount = this._sel.size;
      this._hidCount = this._hid.size;
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

    if (changed.has("label")) {
      const tp = this._chart.options.plugins?.title as any;
      if (tp) { tp.text = this.label; tp.display = !!this.label; }
    }

    if (dataChanged || lineChanged || optionsChanged || changed.has("label")) {
      this._chart.update("none");
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
    const ds = this.datasets as ChartDataSets;
    const labels = this._labels();
    const sets = ds?.sets ?? [];
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) {
      return [];
    }

    const pointDatasets = sets.flatMap((set, i) => {
      let x = Number((set.data as any[])[xi]);
      let y = Number((set.data as any[])[yi]);
      // Use modified coordinates if they exist
      const modified = this._modifiedPoints.get(i);
      if (modified) {
        x = modified.x;
        y = modified.y;
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
      const activeLine =
        this._dragLine?.idx === i && this._dragLinePos
          ? this._dragLinePos
          : this._dragLineEP?.idx === i && this._dragLineEPPos
          ? (this._dragLineEP.ep === "start"
              ? { ...line, x1: this._dragLineEPPos.x, y1: this._dragLineEPPos.y }
              : { ...line, x2: this._dragLineEPPos.x, y2: this._dragLineEPPos.y })
          : line;
      return {
        type: "line",
        label: `Line ${i + 1}`,
        data: [
          { x: activeLine.x1, y: activeLine.y1 },
          { x: activeLine.x2, y: activeLine.y2 },
        ],
        parsing: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHitRadius: 8,
        pointBackgroundColor: isSel ? "#ff6600" : "#555",
        borderColor: isSel ? "#ff6600" : "#444",
        borderWidth: isSel ? 2.5 : 2,
        tension: 0,
        fill: false,
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

    return previewLine ? [...pointDatasets, ...lineDatasets, previewLine] : [...pointDatasets, ...lineDatasets];
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

private _pxToData(
    px: { x: number; y: number }
  ): { x: number; y: number } | null {
    if (!this._chart) return null;
    const x = this._chart.scales.x.getValueForPixel(px.x);
    const y = this._chart.scales.y.getValueForPixel(px.y);
    return x !== undefined && y !== undefined ? { x, y } : null;
  }

/** Keep a pixel position inside the plotted grid area. */
  private _clampToChartAreaPx(px: { x: number; y: number }): { x: number; y: number } {
    if (!this._chart) return px;
    const a = this._chart.chartArea;
    return {
      x: Math.max(a.left, Math.min(a.right, px.x)),
      y: Math.max(a.top, Math.min(a.bottom, px.y)),
    };
  }

/** Index of nearest visible point within HIT_PX, or null. */
  private _pointAtPx(px: { x: number; y: number }): number | null {
    if (!this._chart) return null;
    const ds = this.datasets as ChartDataSets;
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return null;
    let best: number | null = null;
    let bestD = HIT_PX;
    (ds?.sets ?? []).forEach((set, i) => {
      if (this._hid.has(i)) return;
      const modified = this._modifiedPoints.get(i);
      const dx = modified ? modified.x : Number(set.data[xi]);
      const dy = modified ? modified.y : Number(set.data[yi]);
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
    const ds = this.datasets as ChartDataSets;
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    let best: { x: number; y: number } | null = null;
    let bestD = SNAP_PX;
    (ds?.sets ?? []).forEach((set, i) => {
      if (this._hid.has(i)) return;
      const modified = this._modifiedPoints.get(i);
      const dx = modified ? modified.x : Number(set.data[xi]);
      const dy = modified ? modified.y : Number(set.data[yi]);
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

private _snapDataCoord(coord: { x: number; y: number }): { x: number; y: number } {
    if (!this._chart) return coord;
    const px = {
      x: this._chart.scales.x.getPixelForValue(coord.x),
      y: this._chart.scales.y.getPixelForValue(coord.y),
    };
    return this._snapData(px);
  }

private _applyFixedPointBounds() {
    if (!this._chart) return;
    const dynamicSize = Boolean(this.sharedState.chart.options.dynamicSize ?? true);
    const xScale = this._chart.options.scales?.x as any;
    const yScale = this._chart.options.scales?.y as any;

    if (dynamicSize) {
      if (xScale) {
        xScale.min = undefined;
        xScale.max = undefined;
        xScale.grace = 1;
      }
      if (yScale) {
        yScale.min = undefined;
        yScale.max = undefined;
        yScale.grace = 1;
      }
      return;
    }

    const ds = this.datasets as ChartDataSets;
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return;

    const points = (ds?.sets ?? [])
      .map((set, i) => {
        const modified = this._modifiedPoints.get(i);
        return {
          x: modified ? modified.x : Number(set.data[xi]),
          y: modified ? modified.y : Number(set.data[yi]),
        };
      })
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (points.length === 0) return;

    let xMin = Math.min(...points.map((p) => p.x));
    let xMax = Math.max(...points.map((p) => p.x));
    let yMin = Math.min(...points.map((p) => p.y));
    let yMax = Math.max(...points.map((p) => p.y));

    if (xMin === xMax) {
      xMin -= 1;
      xMax += 1;
    }
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }

    const pad = 1;
    if (xScale) {
      xScale.grace = undefined;
      xScale.min = xMin - pad;
      xScale.max = xMax + pad;
    }
    if (yScale) {
      yScale.grace = undefined;
      yScale.min = yMin - pad;
      yScale.max = yMax + pad;
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
    if (this._dragPoint) { canvas.style.cursor = "grabbing"; return; }
    switch (this._mode) {
      case "add-point":
      case "select-brush":
      case "deselect-brush":
      case "draw-line":
        canvas.style.cursor = "crosshair"; break;
      case "select-click":
        canvas.style.cursor = "pointer"; break;
      default:
        canvas.style.cursor = "default";
    }
  }

private _handleMousedown(e: MouseEvent) {
    if (e.button !== 0) return;
    const px = this._canvasPx(e);

    if (this._mode === "select-brush" || this._mode === "deselect-brush") {
      this._brushStartPx = px;
      this._brushCurrPx = { ...px };
      e.preventDefault();
      return;
    }

    if (this._mode === "draw-line") {
      // Mousedown near an existing endpoint → start endpoint drag
      const ep = this._lineEPAtPx(px);
      if (ep) {
        this._dragLineEP = ep;
        this._dragLineEPPos = this._snapData(px);
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
          e.preventDefault();
          return;
        }
      }
      // Line drawing itself is handled in _handleClick (two-click flow)
      return;
    }

    if (this._mode === "none") {
      const ep = this._lineEPAtPx(px);
      if (ep) {
        this._dragLineEP = ep;
        this._dragLineEPPos = this._snapData(px);
        e.preventDefault();
        return;
      }
      const li = this._lineAtPx(px);
      if (li !== null) {
        const start = this._pxToData(px);
        if (start) {
          this._dragLine = { idx: li, start, line: { ...this._lines[li] } };
          this._dragLinePos = { ...this._lines[li] };
          e.preventDefault();
          return;
        }
      }
    }

    // In none/select-click mode: mousedown on a selected point starts dragging.
    if (this._mode === "none" || this._mode === "select-click") {
      const pi = this._pointAtPx(px);
      if (pi !== null && this._sel.has(pi)) {
        this._dragPoint = { setIdx: pi };
        this._updateCursor();
        e.preventDefault();
      }
    }
  }

private _handleMousemove(e: MouseEvent) {
    const px = this._canvasPx(e);

    if (this._brushStartPx) {
      this._brushCurrPx = px;
      this._chart?.update("none");
      return;
    }

    // Endpoint drag should work in both draw mode and normal mode.
    if (this._dragLineEP !== null) {
      this._dragLineEPPos = this._snapData(px);
      this._skipNextClick = true;
      this._chart!.data.datasets = this._buildDatasets();
      this._chart?.update("none");
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
          this._skipNextClick = true;
          this._chart!.data.datasets = this._buildDatasets();
          this._chart?.update("none");
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
        this._skipNextClick = true;
        this._chart!.data.datasets = this._buildDatasets();
        this._chart?.update("none");
      }
      return;
    }

    if (this._dragPoint !== null) {
      const clampedPx = this._clampToChartAreaPx(px);
      const data = this._pxToData(clampedPx);
      if (!data || !this._chart) return;
      const si = this._dragPoint.setIdx;
      // Store modified position in local state (don't mutate dataset)
      this._modifiedPoints.set(si, { x: data.x, y: data.y });
      this._chart.data.datasets = this._buildDatasets();
      this._chart.update("none");
      this._skipNextClick = true;
    }
  }

private _handleMouseup(e: MouseEvent) {
    if (e.button !== 0) return;

    // ── End brush selection ────────────────────────────────────────────────
    if (this._brushStartPx && this._brushCurrPx) {
      const s = this._pxToData(this._brushStartPx);
      const c = this._pxToData(this._brushCurrPx);
      const brushDist = Math.hypot(
        this._brushCurrPx.x - this._brushStartPx.x,
        this._brushCurrPx.y - this._brushStartPx.y
      );
      if (s && c) {
        const xMin = Math.min(s.x, c.x), xMax = Math.max(s.x, c.x);
        const yMin = Math.min(s.y, c.y), yMax = Math.max(s.y, c.y);
        const ds = this.datasets as ChartDataSets;
        const xi = this.xAxisIndex;
        const yi = this.yAxisIndex;
        if (xi >= 0 && yi >= 0) {
          ds.sets.forEach((set, i) => {
            if (this._hid.has(i)) return;
            const px = Number(set.data[xi]);
            const py = Number(set.data[yi]);
            if (isNaN(px) || isNaN(py)) return;
            if (px >= xMin && px <= xMax && py >= yMin && py <= yMax) {
              if (this._mode === "select-brush") this._sel.add(i);
              else this._sel.delete(i);
            }
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

    // ── End point drag: update local state (don't sync to parent dataset) ───
    if (this._dragPoint !== null) {
      const clampedPx = this._clampToChartAreaPx(this._canvasPx(e));
      const dropped = this._pxToData(clampedPx);
      if (dropped) {
        const si = this._dragPoint.setIdx;
        this._modifiedPoints.set(si, { x: dropped.x, y: dropped.y });
      }
      // Modifications are stored in _modifiedPoints and don't sync back to main dataset
      this._dragPoint = null;
      this._updateCursor();
      if (this._chart) {
        this._chart.data.datasets = this._buildDatasets();
      }
      this._chart?.update("none");
      this._skipNextClick = true;
    }

    // ── End line endpoint drag: commit to _lines ───────────────────────────
    if (this._dragLineEP !== null && this._dragLineEPPos !== null) {
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
      this._dragLineEP = null;
      this._dragLineEPPos = null;
      this._skipNextClick = true;
    }

    // ── End whole-line drag: commit translated and snapped endpoints ───────
    if (this._dragLine !== null && this._dragLinePos !== null) {
      const idx = this._dragLine.idx;
      const s1 = this._snapDataCoord({ x: this._dragLinePos.x1, y: this._dragLinePos.y1 });
      const s2 = this._snapDataCoord({ x: this._dragLinePos.x2, y: this._dragLinePos.y2 });
      this._lines = this._lines.map((l, i) => (i === idx ? { x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y } : l));
      this._dragLine = null;
      this._dragLinePos = null;
      this._skipNextClick = true;
    }

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

    // ── Select by click: toggle nearest point ────────────────────────────
    if (this._mode === "select-click") {
      const pi = this._pointAtPx(px);
      if (pi !== null) {
        if (this._sel.has(pi)) this._sel.delete(pi);
        else this._sel.add(pi);
        this._selCount = this._sel.size;
        this._refreshStyles();
        this.requestUpdate();
      }
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
        // Second click: create line
        const end = this._snapData(px);
        const length = Math.hypot(end.x - this._lineStart.x, end.y - this._lineStart.y);
        if (length > 1e-10) {
          this._lines = [
            ...this._lines,
            { x1: this._lineStart.x, y1: this._lineStart.y, x2: end.x, y2: end.y },
          ];
        }
        this._lineStart = null;
        this._lineCursorPx = null;
        this._chart!.data.datasets = this._buildDatasets();
        this._chart?.update("none");
      }
      return;
    }

    // ── None mode: click near line endpoint to select that line ──────────
    if (this._mode === "none") {
      const ep = this._lineEPAtPx(px);
      if (ep) {
        this._selLineIdx = ep.idx === this._selLineIdx ? null : ep.idx;
        this._chart?.update("none");
        return;
      }
      const li = this._lineAtPx(px);
      if (li !== null) {
        this._selLineIdx = li === this._selLineIdx ? null : li;
        this._chart?.update("none");
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
        // _lines @state() triggers chart.update via updated()
      }
    }
  }

private _hideSelected() {
    this._sel.forEach((i) => this._hid.add(i));
    this._sel.clear();
    this._selCount = 0;
    this._hidCount = this._hid.size;
    this._refreshStyles();
    this.requestUpdate();
  }

private _showAll() {
    this._hid.clear();
    this._hidCount = 0;
    this._refreshStyles();
    this.requestUpdate();
  }

private _selectAll(total: number) {
    for (let i = 0; i < total; i++) this._sel.add(i);
    this._selCount = this._sel.size;
    this._refreshStyles();
    this.requestUpdate();
  }

private _deleteSelected() {
    const ds = this.datasets as ChartDataSets;
    const sorted = [...this._sel].sort((a, b) => a - b);
    const newSets = ds.sets.filter((_, i) => !this._sel.has(i));

    // Remap hidden indices: shift each index down by the number of deleted indices before it
    const newHid = new Set<number>();
    this._hid.forEach((i) => {
      if (this._sel.has(i)) return; // also being deleted
      const shift = sorted.filter((d) => d < i).length;
      newHid.add(i - shift);
    });
    this._hid = newHid;
    this._hidCount = newHid.size;
    this._sel.clear();
    this._selCount = 0;

    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: { ...ds, sets: newSets },
      },
    };
    this.dispatchStateChange();
  }

private _addPoint(x: number, y: number) {
    const ds = this.datasets as ChartDataSets;
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return;

    const newData = this._labels().map((_, i) => (i === xi ? x : i === yi ? y : 0));
    const color = COLORS[ds.sets.length % COLORS.length];
    const newSet = {
      name: `Point ${ds.sets.length + 1}`,
      color,
      data: newData,
      colors: newData.map(() => color),
    };
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: { ...ds, sets: [...ds.sets, newSet] },
      },
    };
    this.dispatchStateChange();
  }

override render() {
    const sets = (this.datasets as ChartDataSets)?.sets ?? [];
    const hasData = sets.length > 0;
    const isSel =
      this._mode === "select-click" ||
      this._mode === "select-brush" ||
      this._mode === "deselect-brush";

    return html`
      <div class="root">
        <div class="chart-area">
          <canvas id="chart-canvas"></canvas>
        </div>

        <div class="right-side">
          <div class="btn-col">

            <!-- ── Add point ───────────────────────────────────── -->
            <sl-tooltip hoist placement="top-end"
              content=${!hasData
                ? "Add data first"
                : this._mode === "add-point"
                ? "Click on chart to place a new point"
                : "Add a data point"}
            >
              <sl-button size="small" circle
                variant=${this._mode === "add-point" ? "primary" : "default"}
                .disabled=${!hasData}
                @click=${() => this._toggle("add-point")}
              >
                <sl-icon src=${IconPluslg} label="Add point" style="pointer-events:none"></sl-icon>
              </sl-button>
            </sl-tooltip>

            <!-- ── Select ─────────────────────────────────────── -->
            <sl-popup placement="left" strategy="fixed" .active=${this._showSelectMenu} distance="7">
              <span slot="anchor">
                <sl-tooltip hoist placement="top-end"
                  content=${!hasData ? "Add data first" : "Select / deselect points"}
                >
                  <sl-button size="small" circle
                    variant=${isSel ? "primary" : "default"}
                    .disabled=${!hasData}
                    @click=${(e: MouseEvent) => {
                      if (isSel) {
                        this._setMode("none");
                      } else {
                        this._setMode("none");
                        this._showSelectMenu = !this._showSelectMenu;
                      }
                      (e.target as any)?.focus();
                    }}
                    @blur=${() => setTimeout(() => { this._showSelectMenu = false; }, 150)}
                  >
                    <sl-icon src=${IconHandIndex} label="Select" style="pointer-events:none"></sl-icon>
                  </sl-button>
                </sl-tooltip>
              </span>
              <div class="popup-content">
                <sl-button @mousedown=${(e: MouseEvent) => {
                  if (e.button !== 0) return;
                  this._setMode("select-click");
                  this._showSelectMenu = false;
                }}>Select by clicking</sl-button>
                <sl-button @mousedown=${(e: MouseEvent) => {
                  if (e.button !== 0) return;
                  this._setMode("select-brush");
                  this._showSelectMenu = false;
                }}>Select by brushing</sl-button>
                <sl-button .disabled=${this._selCount === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this._setMode("deselect-brush");
                    this._showSelectMenu = false;
                  }}>Deselect by brushing</sl-button>
              </div>
            </sl-popup>

            <!-- ── Draw line ───────────────────────────────────── -->
            <sl-tooltip hoist placement="top-end"
              content=${!hasData
                ? "Add data first"
                : this._mode === "draw-line"
                ? "Click two points to draw a line. Drag endpoints to reposition (snaps to data points). Select a line row then press Delete to remove it."
                : "Draw a line"}
            >
              <sl-button size="small" circle
                variant=${this._mode === "draw-line" ? "primary" : "default"}
                .disabled=${!hasData}
                @click=${() => this._toggle("draw-line")}
              >
                <sl-icon src=${IconPencil} label="Draw line" style="pointer-events:none"></sl-icon>
              </sl-button>
            </sl-tooltip>

            <!-- ── Eye / visibility ───────────────────────────── -->
            <sl-popup placement="left" strategy="fixed" .active=${this._showEditMenu} distance="7">
              <span slot="anchor">
                <sl-tooltip hoist placement="top-end"
                  content=${!hasData ? "Add data first" : "Show / hide / delete points"}
                >
                  <sl-button size="small" circle
                    .disabled=${!hasData}
                    @click=${(e: MouseEvent) => {
                      this._setMode("none");
                      this._showEditMenu = !this._showEditMenu;
                      (e.target as any)?.focus();
                    }}
                    @blur=${() => setTimeout(() => { this._showEditMenu = false; }, 150)}
                  >
                    <sl-icon src=${IconEye} label="Visibility" style="pointer-events:none"></sl-icon>
                  </sl-button>
                </sl-tooltip>
              </span>
              <div class="popup-content">
                <sl-menu-item type="checkbox"
                  .disabled=${this._selCount === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    this._hideSelected();
                    this._showEditMenu = false;
                  }}>Hide selected</sl-menu-item>
                <sl-menu-item type="checkbox"
                  ?checked=${this._hidCount === 0 && hasData}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    this._showAll();
                    this._showEditMenu = false;
                  }}>Show all</sl-menu-item>
                <sl-menu-item type="checkbox"
                  ?checked=${this._selCount === sets.length && sets.length > 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    this._selectAll(sets.length);
                    this._showEditMenu = false;
                  }}>Select all</sl-menu-item>
                <sl-menu-item type="checkbox"
                  .disabled=${this._selCount === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    this._deleteSelected();
                    this._showEditMenu = false;
                  }}>Delete selected</sl-menu-item>
              </div>
            </sl-popup>
          </div>

          <!-- ── Line formulas table ────────────────────────────── -->
          ${this._lines.length > 0 ? html`
            <div class="line-table">
              <table>
                <thead><tr><th>Line</th></tr></thead>
                <tbody>
                  ${this._lines.map((line, i) => html`
                    <tr
                      class=${i === this._selLineIdx ? "line-row-selected" : ""}
                      style="cursor:pointer"
                      @click=${() => {
                        this._selLineIdx = i === this._selLineIdx ? null : i;
                        this._chart?.update("none");
                      }}
                    >
                      <td>${lineFormula(line, this._labels()[this.xAxisIndex] ?? "x", this._labels()[this.yAxisIndex] ?? "y")}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
}