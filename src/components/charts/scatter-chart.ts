import { html, PropertyValues } from "lit";
import { str } from "@lit/localize";
import { property, state } from "lit/decorators.js";
import type Chart from "chart.js/auto";
import type { LinearScaleOptions } from "chart.js";
import { getContext } from "./chart-helpers";
import { createHtmlLegendPlugin } from "./html-legend";
import { GenericChart } from "./chart-base";
import type { ChartDataSet, ChartDataSets, DrawnLine, RegressionType } from "../../model/models";
import {
  computeRegression,
  type Point as RegPoint,
  type RegressionComputation,
} from "../../model/regression";
import {
  COLORS,
  framedBounds,
  hiddenAfterDelete,
  lineFormula,
  neighbourInDirection,
  outermostLine,
  r3,
  regressionAnnotations,
  visiblePoints,
  withPointAt,
  type ScatterMode,
} from "../../model/scatter-geometry";
import { buildPlotDatasets, type PlotDataset } from "../../model/scatter-datasets";
import { drawScatterOverlay } from "./scatter-overlay";
import { createScatterPlot, type PlotChart } from "./scatter-plot";
import { ScatterPointerController } from "./scatter-pointer-controller";
import { scatterChartStyles } from "./scatter-chart.styles";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import IconPluslg from "@tabler/icons/outline/plus.svg";
import IconTrash from "@tabler/icons/outline/trash.svg";
import IconArrowsMove from "@tabler/icons/outline/arrows-move.svg";
import IconLine from "@tabler/icons/outline/line.svg";

declare global {
  interface HTMLElementTagNameMap {
    "scatter-chart-js": ScatterChartJs;
  }
}


export class ScatterChartJs extends GenericChart<Record<string, never>> {
  /** Column index for the X axis — avoids all string-matching issues. */
  @property({ type: Number })
  accessor xAxisIndex: number = 0;

  /** Column index for the Y axis. */
  @property({ type: Number })
  accessor yAxisIndex: number = 1;

@state() accessor _mode: ScatterMode = "none";


@state() accessor _lines: DrawnLine[] = [];

@state() accessor _selCount = 0;


@state() accessor _selLineIdx: number | null = null;

/** The point the keyboard cursor is on (index into the working sets), or null. */
@state() accessor _kbIdx: number | null = null;

/** What a screen reader announces about the point under the keyboard cursor. */
@state() accessor _announcement = "";

/** Local shadow copy of dataset sets — all plot edits live here until "Apply to data" is clicked. */
@state() accessor _localSets: ChartDataSet[] | null = null;

/** True when there are uncommitted local plot changes. */
@state() accessor _hasPendingChanges = false;


/** Index of line currently hovered by mouse (for formula tooltip). */
@state() accessor _hoveredLineIdx: number | null = null;

/** Right-click coordinate editor popup state. */
@state() accessor _editPopup: {
  pointIdx: number; x: number; y: number; px: number; py: number;
} | null = null;

/** Canvas pixel where "Connect data points" tooltip should appear (when 2+ points selected in select-click mode). */
@state() private accessor _connectTooltipPx: { x: number; y: number } | null = null;


_chart: PlotChart | null = null;

_sel = new Set<number>();

_hid = new Set<number>();

/** Gestures in progress on the canvas. */
ptr = new ScatterPointerController(this);

private _connectTooltipTimer: ReturnType<typeof setTimeout> | null = null;

private _resizeObserver: ResizeObserver | null = null;

private _connection: AbortController | null = null;

private _plugin = {
  id: "scatter-interaction",
  afterDraw: (chart: Chart) => drawScatterOverlay(chart, this),
};

private _htmlLegendPlugin = createHtmlLegendPlugin(
  () => this.shadowRoot?.getElementById("html-legend")
);

/** Per-point animation progress 0→1 for the dotted-line-to-axis animation. */
_animProgress: number[] = [];
private _animRaf: number | null = null;

/** Memo for the regression pipeline (see _regression()). */
private _regCache: { key: string; value: RegressionComputation } | null = null;

static styles = scatterChartStyles;


  static scopedElements = {
    "sl-button": SlButton,
    "sl-tooltip": SlTooltip,
    "sl-popup": SlPopup,
    "sl-icon": SlIcon,
  };

/** Return the effective line position for index i, accounting for active drags. */
  _getActiveLine(line: DrawnLine, i: number): DrawnLine {
    if (this.ptr._dragLine?.idx === i && this.ptr._dragLinePos) return this.ptr._dragLinePos;
    if (this.ptr._dragLineEP?.idx === i && this.ptr._dragLineEPPos) {
      const p = this.ptr._dragLineEPPos;
      return this.ptr._dragLineEP.ep === "start"
        ? { ...line, x1: p.x, y1: p.y }
        : { ...line, x2: p.x, y2: p.y };
    }
    return line;
  }

private _createChart() {
    // Destroy existing instance if any (handles axis/data full resets)
    if (this._chart) {
      this.ptr.detach(this._chart.canvas);
      this._chart.destroy();
      this._chart = null;
    }

    let ctx: CanvasRenderingContext2D;
    try { ctx = getContext(this); } catch { return; }

    const labels = this._labels();
    this._chart = createScatterPlot(ctx, {
      datasets: this._buildDatasets(),
      xTitle: labels[this.xAxisIndex] ?? "",
      yTitle: labels[this.yAxisIndex] ?? "",
      plugins: [this._plugin, this._htmlLegendPlugin],
    });

    this._applyFixedPointBounds();
    this._chart.update("none");
    this.ptr.attach(this._chart.canvas);
  }


  override connectedCallback() {
    super.connectedCallback();
    this._connection = new AbortController();
    this.ptr.connect(this._connection.signal);
  }

  override firstUpdated() {
    // Restore lines persisted across page reloads via sharedState
    const saved = this.sharedState?.scatterLines;
    if (Array.isArray(saved) && saved.length > 0) this._lines = saved;

    this.tabIndex = -1;

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
  }

/** Draws the plot at the current size; creates it when it was never visible (the canvas of a hidden tab has no size). */
override refreshChart() {
  const canvas = this.shadowRoot?.getElementById("chart-canvas");
  if (this._chart) this._chart.resize();
  else if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) this._createChart();
}

override disconnectedCallback() {
    super.disconnectedCallback();
    this.ptr.dispose();
    this._connection?.abort();
    this._connection = null;
    if (this._connectTooltipTimer !== null) clearTimeout(this._connectTooltipTimer);
    if (this._animRaf !== null) { cancelAnimationFrame(this._animRaf); this._animRaf = null; }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._chart) this.ptr.detach(this._chart.canvas);
    this._chart?.destroy();
    this._chart = null;
  }


_showConnectTooltip(px: { x: number; y: number }) {
    if (this._connectTooltipTimer !== null) clearTimeout(this._connectTooltipTimer);
    this._connectTooltipPx = px;
    this._connectTooltipTimer = setTimeout(() => {
      this._connectTooltipPx = null;
      this._connectTooltipTimer = null;
    }, 1500);
  }

  _hideConnectTooltip() {
    if (this._connectTooltipTimer !== null) { clearTimeout(this._connectTooltipTimer); this._connectTooltipTimer = null; }
    this._connectTooltipPx = null;
  }

  _lineName(index: number): string {
    return this.msg(str`Line ${index + 1}`);
  }

  _buildDatasets(): PlotDataset[] {
    const ptr = this.ptr;
    const cursor = ptr._lineStart && ptr._lineCursorPx ? ptr._pxToData(ptr._lineCursorPx) : null;
    return buildPlotDatasets({
      sets: this._getWorkingSets(),
      xi: this.xAxisIndex,
      yi: this.yAxisIndex,
      selected: this._sel,
      hidden: this._hid,
      lines: this._lines,
      selectedLine: this._selLineIdx,
      activeLine: (line, i) => this._getActiveLine(line, i),
      dragged: ptr._dragPoint && ptr._dragPos ? { index: ptr._dragPoint.setIdx, at: ptr._dragPos } : null,
      preview: ptr._lineStart && cursor ? { from: ptr._lineStart, to: cursor } : null,
      lineName: (i) => this._lineName(i),
      previewName: this.msg("Preview line"),
    });
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
      this.ptr._touchDragging = false;
    } else if (changed.has("datasets")) {
      // External data change (data-tab edit, import, apply) — the data table
      // is the single source of truth, so always drop the local shadow copy,
      // including pending plot edits that were never applied.
      this._localSets = null;
      this._hasPendingChanges = false;
      this._editPopup = null;
    }

    if (dataChanged) {
      const newCount = this._getWorkingSets().length;
      if (this._kbIdx !== null && this._kbIdx >= newCount) this._kbIdx = null;
      this._sel.forEach((i) => { if (i >= newCount) this._sel.delete(i); });
      this._hid.forEach((i) => { if (i >= newCount) this._hid.delete(i); });
      this._selCount = this._sel.size;
    }

    if (dataChanged || lineChanged) {
      this._chart.data.datasets = this._buildDatasets();
    }

    if (dataChanged) {
      // Update scale titles in-place — covers axis switches AND column
      // renames in the data tab (labels change without an axis change)
      const labels = this._labels();
      this._scaleOptions("x").title.text = labels[this.xAxisIndex] ?? "";
      this._scaleOptions("y").title.text = labels[this.yAxisIndex] ?? "";
      this._applyFixedPointBounds();
    } else if (optionsChanged) {
      this._applyFixedPointBounds();
    }

    if (dataChanged || lineChanged || optionsChanged) {
      this._chart.update("none");
    }
  }

  /** Whether dragged/added points snap to grid ticks (off by default;
   *  only active once the user enables the switch). */
  get _snapToGrid(): boolean {
    return Boolean(this.sharedState?.chart?.options?.snapToGrid ?? false);
  }

  /** Returns the current working set array (local shadow or parent). */
  _getWorkingSets(): ChartDataSet[] {
    if (this._localSets !== null) return this._localSets;
    const ds = this.datasets as ChartDataSets;
    return ds?.sets ?? [];
  }

  /** Ensure _localSets is initialized from parent before mutating. */
  _ensureLocalSets() {
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

/** Update visual styles in-place without full dataset reconstruction. */
  _refreshStyles() {
    if (!this._chart) return;
    this._chart.data.datasets = this._buildDatasets();
    this._chart.update("none");
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

/** Live scale options of the plot; the plot only has linear axes. */
  _scaleOptions(axis: "x" | "y") {
    return this._chart!.options.scales![axis] as LinearScaleOptions;
  }

private _applyOptions() {
    if (!this._chart) return;
    const opts = this.sharedState?.chart?.options ?? {};

    // Grid visibility
    const showGrid = Boolean(opts.showGrid ?? true);
    const xScale = this._scaleOptions("x");
    const yScale = this._scaleOptions("y");
    if (xScale?.grid) xScale.grid.display = showGrid;
    if (yScale?.grid) yScale.grid.display = showGrid;

    // Animation — always disable Chart.js built-in; use custom sequential dotted-line animation
    this._chart.options.animation = false;
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

_applyFixedPointBounds() {
    if (!this._chart) return;
    this._applyOptions();

    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return;

    const bounds = framedBounds(visiblePoints(this._getWorkingSets(), new Set(), xi, yi));
    if (!bounds) return;

    const xScale = this._scaleOptions("x");
    const yScale = this._scaleOptions("y");
    xScale.grace = undefined;
    xScale.min = bounds.xMin;
    xScale.max = bounds.xMax;
    yScale.grace = undefined;
    yScale.min = bounds.yMin;
    yScale.max = bounds.yMax;
  }

_setMode(m: ScatterMode) {
    this._mode = m;
    this.ptr._lineStart = null;
    this.ptr._lineCursorPx = null;
    this.ptr._brushStartPx = null;
    this.ptr._brushCurrPx = null;
    this.ptr._dragLineEP = null;
    this.ptr._dragLineEPPos = null;
    this.ptr._dragLine = null;
    this.ptr._dragLinePos = null;
    this.ptr._dragPoint = null;
    this._hideConnectTooltip();
    this.ptr._updateCursor();
    if (this._chart) {
      this._chart.data.datasets = this._buildDatasets();
    }
    this._chart?.update("none"); // clear any in-progress visual overlays
  }

private _toggle(m: ScatterMode) {
    if (this._mode === m) this._setMode("none");
    else this._setMode(m);
  }

/** The visible points with their index into the working sets. */
private _plotPoints(): Array<{ index: number; x: number; y: number }> {
  const xi = this.xAxisIndex;
  const yi = this.yAxisIndex;
  return this._getWorkingSets()
    .map((set, index) => ({ index, x: Number(set.data[xi]), y: Number(set.data[yi]) }))
    .filter((p) => !this._hid.has(p.index) && Number.isFinite(p.x) && Number.isFinite(p.y));
}

/** Toggles the selection of a point, as a double click does. */
_toggleSelected(index: number) {
  if (this._sel.has(index)) this._sel.delete(index);
  else this._sel.add(index);
  this._selCount = this._sel.size;
  this._hideConnectTooltip();
  this._refreshStyles();
  this.requestUpdate();
}

private _moveCursor(index: number | null) {
  this._kbIdx = index;
  const point = this._plotPoints().find((p) => p.index === index);
  if (point) {
    const places = this._plotPoints();
    const position = places.findIndex((p) => p.index === index) + 1;
    const where = this.msg(str`Point ${position} of ${places.length}: x = ${r3(point.x)}, y = ${r3(point.y)}`);
    this._announcement = this._sel.has(point.index) ? `${where}, ${this.msg("selected")}` : where;
  }
  this._chart?.update("none");
}

/** Moves the selected points by one step: a grid step while snapping, else a fiftieth of the visible range. */
private _nudgeSelection(dx: number, dy: number) {
  const chart = this._chart;
  if (!chart || this._sel.size === 0) return false;
  const stepOf = (scale: Chart["scales"][string]) => {
    const ticks = scale.ticks.map((t) => t.value);
    if (this._snapToGrid && ticks.length >= 2) return Math.abs(ticks[1] - ticks[0]);
    return Math.max((scale.max - scale.min) / 50, 0.01);
  };
  const xStep = stepOf(chart.scales.x);
  const yStep = stepOf(chart.scales.y);
  const sets = this._getWorkingSets();
  for (const index of this._sel) {
    const x = Number(sets[index]?.data[this.xAxisIndex]);
    const y = Number(sets[index]?.data[this.yAxisIndex]);
    if (Number.isFinite(x) && Number.isFinite(y)) this._movePoint(index, r3(x + dx * xStep), r3(y + dy * yStep));
  }
  this._redrawPlot();
  return true;
}

/** Keyboard path of the plot: arrow keys move between points, Enter or Space selects, Shift with an arrow moves the selection, Escape clears it. */
_onCanvasKeydown(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const arrows: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  const arrow = arrows[e.key];
  let handled = true;
  if (arrow && e.shiftKey) handled = this._nudgeSelection(...arrow);
  else if (arrow) this._moveCursor(neighbourInDirection(this._plotPoints(), this._kbIdx, ...arrow));
  else if (e.key === "Enter" || e.key === " ") {
    if (this._kbIdx === null || !this._plotPoints().some((p) => p.index === this._kbIdx)) handled = false;
    else { this._toggleSelected(this._kbIdx); this._moveCursor(this._kbIdx); }
  } else if (e.key === "l" && this._selCount >= 2) this._connectSelected();
  else if (e.key === "Escape" && (this._sel.size > 0 || this._selLineIdx !== null || this._editPopup)) {
    this._sel.clear();
    this._selCount = 0;
    this._selLineIdx = null;
    this._editPopup = null;
    this._hideConnectTooltip();
    this._refreshStyles();
  } else handled = false;
  if (handled) { e.preventDefault(); e.stopPropagation(); }
}

/** True while a drawn line or a point is selected: what `deleteSelection()` would remove. */
get hasSelection(): boolean {
  return this._selLineIdx !== null || this._selCount > 0;
}

/** Removes the selected line, or else the selected points. Run by the Delete key through the widget's actions. */
deleteSelection() {
  if (this._selLineIdx !== null) {
    this._lines = this._lines.filter((_, i) => i !== this._selLineIdx);
    this._selLineIdx = null;
  } else if (this._selCount > 0) {
    this._deleteSelected();
  }
}

/** Rebuilds the datasets and the axis bounds after the data changed locally. */
  private _redrawPlot() {
    if (this._chart) {
      this._chart.data.datasets = this._buildDatasets();
      this._applyFixedPointBounds();
      this._chart.update("none");
    }
    this.requestUpdate();
  }

  /** Moves the point of set `index` in the local copy of the data. */
  _movePoint(index: number, x: number, y: number) {
    this._ensureLocalSets();
    this._localSets = withPointAt(this._localSets!, index, this.xAxisIndex, this.yAxisIndex, x, y);
    this._hasPendingChanges = true;
  }

  private _applyEditPopup() {
    if (!this._editPopup) return;
    const { pointIdx, x, y } = this._editPopup;
    const at = this._snapToGrid && this._chart ? this.ptr._snapDragPos({ x, y }) : { x, y };
    this._movePoint(pointIdx, at.x, at.y);
    this._editPopup = null;
    this._redrawPlot();
  }

  private _deleteSelected() {
    this._ensureLocalSets();
    this._hid = hiddenAfterDelete(this._hid, this._sel);
    this._localSets = this._localSets!.filter((_, i) => !this._sel.has(i));
    this._sel.clear();
    this._selCount = 0;
    this._hasPendingChanges = true;
    this._redrawPlot();
  }

private _connectSelected() {
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    const sets = this._getWorkingSets();
    const line = outermostLine(
      [...this._sel]
        .map((i) => ({ x: Number(sets[i]?.data[xi]), y: Number(sets[i]?.data[yi]) }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    );
    if (!line) return;
    this._lines = [...this._lines, { ...line, name: this._lineName(this._lines.length) }];
    this._hideConnectTooltip();
    this._sel.clear();
    this._selCount = 0;
    this._refreshStyles();
    this.requestUpdate();
  }

_addPoint(x: number, y: number) {
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return;

    if (this._snapToGrid && this._chart) {
      const s = this.ptr._snapDragPos({ x, y });
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
    this._redrawPlot();
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
        datasets: { ...ds, sets: local },
      },
    };
    this.dispatchStateChange();
    this._hasPendingChanges = false;
    this._localSets = null; // re-init from parent (which now has our data)
  }


/** Memoized regression pipeline (fit + outlier mask + correlations) —
   *  shared by the canvas plugin and the HTML annotations. The cache matters
   *  because afterDraw runs on every mousemove during brush/drag and LOESS
   *  is O(n²) per evaluation. */
  _regression(points: RegPoint[]): RegressionComputation {
    const opts = this.sharedState?.chart?.options ?? {};
    const type = (this.sharedState?.regressionType ?? "none") as RegressionType;
    const params = {
      degree: Math.round(Number(opts.polynomialDegree ?? 2)) || 2,
      span: Math.min(1, Math.max(0.15, Number(opts.loessSpan ?? 50) / 100)),
    };
    const key = JSON.stringify([type, params, points]);
    if (this._regCache?.key === key) return this._regCache.value;
    const value = computeRegression(type, points, params);
    this._regCache = { key, value };
    return value;
  }

private _computeChartAnnotations(): { formula: string; correlation: string } {
    const xi = this.xAxisIndex;
    const yi = this.yAxisIndex;
    if (xi < 0 || yi < 0) return { formula: "", correlation: "" };
    const points = visiblePoints(this._getWorkingSets(), this._hid, xi, yi);
    const showCorrelation = Boolean(this.sharedState?.chart?.options?.showCorrelation);
    return regressionAnnotations(this._regression(points), points.length, showCorrelation);
  }

override render() {
    const sets = this._getWorkingSets();
    const hasData = sets.length > 0;
    const { formula, correlation } = this._computeChartAnnotations();

    return html`
      <div class="root" @click=${() => { if (this._editPopup) this._editPopup = null; }}>
        <div class="chart-col">
        <div class="chart-area" style="position:relative;">
          <canvas
            id="chart-canvas"
            tabindex="0"
            role="application"
            aria-label=${this.msg("Scatter plot")}
            aria-description=${this.msg("Arrow keys move between points. Enter or Space selects a point. Shift with an arrow key moves the selected points. L connects two or more selected points with a line. Escape clears the selection.")}
            @keydown=${this._onCanvasKeydown}
            @focus=${() => this._chart?.update("none")}
            @blur=${() => this._chart?.update("none")}
          ></canvas>
          <div class="visually-hidden" role="status" aria-live="polite">${this._announcement}</div>

          <!-- ── Line formula hover tooltip ────────────────────── -->
          ${this._hoveredLineIdx !== null && this.ptr._hoverPx && this._lines[this._hoveredLineIdx] ? html`
            <div class="line-tooltip" style="left:${this.ptr._hoverPx.x + 14}px;top:${this.ptr._hoverPx.y - 16}px;">
              <div class="line-tooltip-name">${this._lines[this._hoveredLineIdx].name ?? this._lineName(this._hoveredLineIdx)}</div>
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
              <sl-button size="small" @click=${() => this._connectSelected()}>${this.msg("Connect data points")}</sl-button>
            </div>`;
          })() : ""}

          <!-- ── Selected line name editor (positioned near line midpoint) ── -->
          ${this._selLineIdx !== null && this._lines[this._selLineIdx] && !this.ptr._dragLine && !this.ptr._dragLineEP ? (() => {
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
                .value=${sl.name ?? this._lineName(this._selLineIdx!)}
                placeholder=${this.msg("Line name")}
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
              <div class="coord-popup-title">${this.msg("Edit coordinates")}</div>
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
                <button class="apply" @click=${() => this._applyEditPopup()}>${this.msg("Apply")}</button>
                <button @click=${() => { this._editPopup = null; }}>${this.msg("Cancel")}</button>
              </div>
            </div>
          `; })() : ""}
        </div>

        <div id="html-legend" class="html-legend-container"></div>

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
              ? this.msg("Add data first")
              : this._mode === "add-point"
              ? this.msg("Click on chart to place a new point")
              : this.msg("Add a data point")}
          >
            <sl-button size="small" circle
              variant=${this._mode === "add-point" ? "primary" : "default"}
              .disabled=${!hasData}
              @click=${() => this._toggle("add-point")}
            >
              <sl-icon src=${IconPluslg} label=${this.msg("Add a data point")} style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <!-- ── Edit position of selected point ──────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${this._selCount !== 1 ? this.msg("Double-click exactly one point to select it, then edit its position") : this.msg("Edit point position")}
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
              <sl-icon src=${IconArrowsMove} label=${this.msg("Edit point position")} style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <!-- ── Draw line ───────────────────────────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${!hasData
              ? this.msg("Add data first")
              : this._mode === "draw-line"
              ? this.msg("Click two points to draw a line. Drag endpoints to adjust. Press Delete to remove selected.")
              : this.msg("Draw a line")}
          >
            <sl-button size="small" circle
              variant=${this._mode === "draw-line" ? "primary" : "default"}
              .disabled=${!hasData}
              @click=${() => this._toggle("draw-line")}
            >
              <sl-icon src=${IconLine} label=${this.msg("Draw a line")} style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <!-- ── Delete selected (points or line) ─────────────── -->
          <sl-tooltip hoist placement="top-end"
            content=${this._selLineIdx !== null
              ? `${this.msg("Delete")} "${this._lines[this._selLineIdx]?.name ?? this._lineName(this._selLineIdx)}"`
              : this._selCount === 0
              ? this.msg("Double-click points or click a line to select them first")
              : `${this.msg("Delete")} ${this._selCount} ${this._selCount > 1 ? this.msg("selected points") : this.msg("selected point")}`}
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
              <sl-icon src=${IconTrash} label=${this.msg("Delete")} style="pointer-events:none"></sl-icon>
            </sl-button>
          </sl-tooltip>

        </div>
      </div>
    `;
  }
}