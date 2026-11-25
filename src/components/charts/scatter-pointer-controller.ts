import type { DrawnLine } from "../../model/models";
import {
  DOUBLE_CLICK_MS,
  SNAP_PX,
  HIT_PX,
  distToSegment,
  setsInRect,
  snapToTicks,
  translatedLine,
  type Pt,
  type ScaleBounds,
} from "../../model/scatter-geometry";
import type { ScatterChartJs } from "./scatter-chart";

/** Pointer and touch handling of the scatter plot: selecting, dragging and drawing on the canvas.
 *  The element owns the data and the chart; this controller owns the state of a gesture in progress. */
export class ScatterPointerController {
  _brushStartPx: Pt | null = null;
  _brushCurrPx: Pt | null = null;
  _brushCursorTimer: ReturnType<typeof setTimeout> | null = null;
  _lineStart: Pt | null = null;
  _lineCursorPx: Pt | null = null;
  _dragLineEP: { idx: number; ep: "start" | "end" } | null = null;
  _dragLineEPPos: Pt | null = null;
  _dragLineEPMoved = false;
  _dragLine: { idx: number; start: Pt; line: DrawnLine } | null = null;
  _dragLinePos: DrawnLine | null = null;
  _dragLineMoved = false;
  _dragPoint: { setIdx: number } | null = null;
  /** Snapped position during an active point drag, used for visual rendering. */
  _dragPos: Pt | null = null;
  /** Raw (un-snapped) mouse position during drag, used for scale expansion target. */
  _dragRawPos: Pt | null = null;
  /** Scale bounds locked at drag-start to prevent chart rescaling during drag. */
  _lockedScaleBounds: ScaleBounds | null = null;
  /** Last known mouse position over a hovered line, for tooltip placement. */
  _hoverPx: Pt | null = null;
  _hoveredPointIdx: number | null = null;
  _skipNextClick = false;
  /** True while a touch drag of a selected point is in progress. */
  _touchDragging = false;
  /** Double-click/double-tap detection for arming the drag mode. Works for
   *  mouse clicks and for the synthesized clicks that taps produce. */
  _lastClickIdx: number | null = null;
  _lastClickTime = 0;
  /** requestAnimationFrame id for smooth scale expansion during drag. */
  _scaleExpRAFId = 0;
  /** Timer id for the expansion delay (ms before scale starts growing). */
  _scaleExpTimer: ReturnType<typeof setTimeout> | null = null;

  _hMD = (e: MouseEvent) => this._handleMousedown(e);
  _hMM = (e: MouseEvent) => this._handleMousemove(e);
  _hMU = (e: MouseEvent) => this._handleMouseup(e);
  _hCK = (e: MouseEvent) => this._handleClick(e);
  _hTS = (e: TouchEvent) => this._handleTouchStart(e);
  _hTM = (e: TouchEvent) => this._handleTouchMove(e);
  _hTE = (e: TouchEvent) => this._handleTouchEnd(e);
  /** Mouseleave clears the hover state. */
  _hML = () => {
    if (this.host._hoveredLineIdx !== null) this.host._hoveredLineIdx = null;
    if (this._hoveredPointIdx !== null) { this._hoveredPointIdx = null; this._updateCursor(); }
  };

  constructor(readonly host: ScatterChartJs) {}

  /** Listens on the chart canvas. */
  attach(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousedown", this._hMD);
    canvas.addEventListener("mousemove", this._hMM);
    canvas.addEventListener("mouseup", this._hMU);
    canvas.addEventListener("click", this._hCK);
    canvas.addEventListener("mouseleave", this._hML);
    // passive: false, because the handlers call preventDefault() to suppress
    // synthesized mouse events and page scrolling during point drags
    canvas.addEventListener("touchstart", this._hTS, { passive: false });
    canvas.addEventListener("touchmove", this._hTM, { passive: false });
    canvas.addEventListener("touchend", this._hTE);
  }

  detach(canvas: HTMLCanvasElement) {
    canvas.removeEventListener("mousedown", this._hMD);
    canvas.removeEventListener("mousemove", this._hMM);
    canvas.removeEventListener("mouseup", this._hMU);
    canvas.removeEventListener("click", this._hCK);
    canvas.removeEventListener("mouseleave", this._hML);
    canvas.removeEventListener("touchstart", this._hTS);
    canvas.removeEventListener("touchmove", this._hTM);
    canvas.removeEventListener("touchend", this._hTE);
  }

  /** A drag that ends outside the canvas still has to end. */
  connect(signal: AbortSignal) {
    window.addEventListener("mouseup", this._hMU, { signal });
  }

  /** Stops timers and animation frames and drops the window listener of a drag. */
  dispose() {
    this._stopScaleExp();
    if (this._brushCursorTimer !== null) { clearTimeout(this._brushCursorTimer); this._brushCursorTimer = null; }
    window.removeEventListener("mousemove", this._hMM);
  }

/** Convert MouseEvent to canvas pixel coords (handles HiDPI). */
  private _canvasPx(e: MouseEvent): { x: number; y: number } {
    const canvas = this.host._chart?.canvas;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    // Chart.js scale pixel APIs operate in CSS pixel space.
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

_pxToData(
    px: { x: number; y: number }
  ): { x: number; y: number } | null {
    if (!this.host._chart) return null;
    const x = this.host._chart.scales.x.getValueForPixel(px.x);
    const y = this.host._chart.scales.y.getValueForPixel(px.y);
    return x !== undefined && y !== undefined ? { x, y } : null;
  }

/** Index of nearest visible point within HIT_PX, or null. */
  private _pointAtPx(px: { x: number; y: number }): number | null {
    if (!this.host._chart) return null;
    const xi = this.host.xAxisIndex;
    const yi = this.host.yAxisIndex;
    if (xi < 0 || yi < 0) return null;
    let best: number | null = null;
    let bestD = HIT_PX;
    this.host._getWorkingSets().forEach((set, i) => {
      if (this.host._hid.has(i)) return;
      const dx = (this._dragPoint?.setIdx === i && this._dragPos) ? this._dragPos.x : Number(set.data[xi]);
      const dy = (this._dragPoint?.setIdx === i && this._dragPos) ? this._dragPos.y : Number(set.data[yi]);
      if (isNaN(dx) || isNaN(dy)) return;
      const ppx = this.host._chart!.scales.x.getPixelForValue(dx);
      const ppy = this.host._chart!.scales.y.getPixelForValue(dy);
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
    if (!this.host._chart) return this._pxToData(px) ?? { x: 0, y: 0 };
    const xi = this.host.xAxisIndex;
    const yi = this.host.yAxisIndex;
    let best: { x: number; y: number } | null = null;
    let bestD = SNAP_PX;
    this.host._getWorkingSets().forEach((set, i) => {
      if (this.host._hid.has(i)) return;
      const dx = Number(set.data[xi]);
      const dy = Number(set.data[yi]);
      if (isNaN(dx) || isNaN(dy)) return;
      const ppx = this.host._chart!.scales.x.getPixelForValue(dx);
      const ppy = this.host._chart!.scales.y.getPixelForValue(dy);
      const d = Math.hypot(ppx - px.x, ppy - px.y);
      if (d < bestD) { bestD = d; best = { x: dx, y: dy }; }
    });
    return best ?? (this._pxToData(px) ?? { x: 0, y: 0 });
  }

/** Nearest line endpoint within 10px, or null. */
  private _lineEPAtPx(
    px: { x: number; y: number }
  ): { idx: number; ep: "start" | "end" } | null {
    if (!this.host._chart) return null;
    let best: { idx: number; ep: "start" | "end" } | null = null;
    let bestD = 10;
    this.host._lines.forEach((l, i) => {
      let x1 = l.x1, y1 = l.y1, x2 = l.x2, y2 = l.y2;
      if (this._dragLineEP?.idx === i && this._dragLineEPPos) {
        if (this._dragLineEP.ep === "start") { x1 = this._dragLineEPPos.x; y1 = this._dragLineEPPos.y; }
        else { x2 = this._dragLineEPPos.x; y2 = this._dragLineEPPos.y; }
      }
      const x1p = this.host._chart!.scales.x.getPixelForValue(x1);
      const y1p = this.host._chart!.scales.y.getPixelForValue(y1);
      const x2p = this.host._chart!.scales.x.getPixelForValue(x2);
      const y2p = this.host._chart!.scales.y.getPixelForValue(y2);
      const d1 = Math.hypot(x1p - px.x, y1p - px.y);
      const d2 = Math.hypot(x2p - px.x, y2p - px.y);
      if (d1 < bestD) { bestD = d1; best = { idx: i, ep: "start" }; }
      if (d2 < bestD) { bestD = d2; best = { idx: i, ep: "end" }; }
    });
    return best;
  }

/** Nearest line body within 8px, or null. */
  private _lineAtPx(px: { x: number; y: number }): number | null {
    if (!this.host._chart) return null;
    let bestIdx: number | null = null;
    let bestD = 8;
    this.host._lines.forEach((l, i) => {
      const a = {
        x: this.host._chart!.scales.x.getPixelForValue(l.x1),
        y: this.host._chart!.scales.y.getPixelForValue(l.y1),
      };
      const b = {
        x: this.host._chart!.scales.x.getPixelForValue(l.x2),
        y: this.host._chart!.scales.y.getPixelForValue(l.y2),
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
    if (!this.host._chart) return;
    this._lockedScaleBounds = {
      xMin: this.host._chart.scales.x.min,
      xMax: this.host._chart.scales.x.max,
      yMin: this.host._chart.scales.y.min,
      yMax: this.host._chart.scales.y.max,
    };
  }

  /** Apply locked bounds to chart options (call before chart.update during drag). */
  private _applyLockedBounds() {
    if (!this._lockedScaleBounds || !this.host._chart) return;
    const xs = this.host._scaleOptions("x");
    const ys = this.host._scaleOptions("y");
    xs.grace = undefined;
    xs.min = this._lockedScaleBounds.xMin;
    xs.max = this._lockedScaleBounds.xMax;
    ys.grace = undefined;
    ys.min = this._lockedScaleBounds.yMin;
    ys.max = this._lockedScaleBounds.yMax;
  }

/** Snap a data-space position to the nearest visible grid tick intersection. */
  _snapDragPos(data: Pt): Pt {
    const chart = this.host._chart;
    if (!chart) return data;
    return snapToTicks(data, chart.scales.x.ticks.map((t) => t.value), chart.scales.y.ticks.map((t) => t.value));
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
    if (!this.host._chart || !this._lockedScaleBounds) { this._stopScaleExp(); return; }
    const xScale = this.host._scaleOptions("x");
    const yScale = this.host._scaleOptions("y");

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

    this.host._chart.data.datasets = this.host._buildDatasets();
    this.host._chart.update("none");

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
      this.host._chart.update("none");
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
    if (!this.host._chart) return coord;
    const px = {
      x: this.host._chart.scales.x.getPixelForValue(coord.x),
      y: this.host._chart.scales.y.getPixelForValue(coord.y),
    };
    return this._snapData(px);
  }

_updateCursor() {
    const canvas = this.host._chart?.canvas;
    if (!canvas) return;
    if (this._dragPoint || this._dragLine || this._dragLineEP) { canvas.style.cursor = "grabbing"; return; }
    if (this._brushStartPx) { canvas.style.cursor = "crosshair"; return; }
    if (this.host._mode === "add-point" || this.host._mode === "draw-line") { canvas.style.cursor = "crosshair"; return; }
    if (this._hoveredPointIdx !== null && this.host._sel.has(this._hoveredPointIdx)) {
      canvas.style.cursor = "grab"; return;
    }
    if (this._hoveredPointIdx !== null || this.host._hoveredLineIdx !== null) {
      canvas.style.cursor = "pointer"; return;
    }
    canvas.style.cursor = "default";
  }

/** Starts dragging a line endpoint or a whole line under the pointer; true when one was hit. */
  private _startLineDrag(px: Pt, e: MouseEvent): boolean {
    // Mousedown near an existing endpoint → start endpoint drag
    const ep = this._lineEPAtPx(px);
    if (ep) {
      this._dragLineEP = ep;
      this._dragLineEPPos = this._snapData(px);
      this._dragLineEPMoved = false;
      this._updateCursor();
      window.addEventListener("mousemove", this._hMM);
      e.preventDefault();
      return true;
    }

    // Mousedown on line body → drag whole line
    const li = this._lineAtPx(px);
    const start = li !== null ? this._pxToData(px) : null;
    if (li === null || !start) return false;
    this._dragLine = { idx: li, start, line: { ...this.host._lines[li] } };
    this._dragLinePos = { ...this.host._lines[li] };
    this._updateCursor();
    window.addEventListener("mousemove", this._hMM);
    e.preventDefault();
    return true;
  }

  _handleMousedown(e: MouseEvent) {
    if (e.button !== 0) return;
    const px = this._canvasPx(e);

    if (this.host._mode === "draw-line") {
      // Line drawing itself is handled in _handleClick (two-click flow)
      this._startLineDrag(px, e);
      return;
    }

    if (this.host._mode === "none") {
      if (this._startLineDrag(px, e)) return;
      // Selected point drag — blocked when coordinate-edit popup is open
      const pi = this._pointAtPx(px);
      if (pi !== null && this.host._sel.has(pi) && !this.host._editPopup) {
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

/** Redraws the plot while an item is dragged, unless the scale expansion animation does it. */
  private _redrawDuringDrag() {
    const chart = this.host._chart;
    if (!chart || this._scaleExpRAFId !== 0) return;
    chart.data.datasets = this.host._buildDatasets();
    this._applyLockedBounds();
    chart.update("none");
  }

  _handleMousemove(e: MouseEvent) {
    const px = this._canvasPx(e);

    // ── Line hover detection (for formula tooltip) ────────────────────────
    const isActive = this._brushStartPx || this._dragPoint || this._dragLine || this._dragLineEP;
    if (!isActive) {
      const hli = this._lineAtPx(px);
      if (hli !== this.host._hoveredLineIdx) {
        this.host._hoveredLineIdx = hli; // @state triggers Lit re-render for show/hide
        this._updateCursor();
      }
      if (hli !== null) {
        this._hoverPx = { x: px.x, y: px.y };
        // Update tooltip position directly (avoids full re-render on every move)
        const tip = this.host.shadowRoot?.querySelector(".line-tooltip") as HTMLElement | null;
        if (tip) {
          tip.style.left = `${px.x + 14}px`;
          tip.style.top = `${px.y - 16}px`;
        }
      }
    } else if (this.host._hoveredLineIdx !== null) {
      this.host._hoveredLineIdx = null;
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
      this.host._chart?.update("none");
      return;
    }

    // Endpoint drag — snap to nearby data point (magnet), fall back to raw coords.
    if (this._dragLineEP !== null) {
      const epData = this._snapData(px);
      this._dragLineEPPos = epData;
      this._dragLineEPMoved = true;
      this._skipNextClick = true;
      this._maybeExpandScale(epData);
      this._redrawDuringDrag();
      return;
    }

    if (this._dragLine !== null) {
      const cur = this._pxToData(px);
      if (cur) {
        const moved = translatedLine(this._dragLine.line, this._dragLine.start, cur);
        this._dragLinePos = moved;
        this._dragLineMoved = true;
        this._skipNextClick = true;
        const mid = { x: (moved.x1 + moved.x2) / 2, y: (moved.y1 + moved.y2) / 2 };
        this._maybeExpandScale(mid);
        this._redrawDuringDrag();
      }
      return;
    }

    if (this.host._mode === "draw-line") {
      if (this._lineStart !== null) {
        this._lineCursorPx = px;
        this.host._chart!.data.datasets = this.host._buildDatasets();
        this.host._chart?.update("none");
      }
      return;
    }

    if (this._dragPoint !== null) {
      const data = this._pxToData(px);
      if (!data || !this.host._chart) return;
      this._dragRawPos = data;
      // When snap is ON: snap to visible grid tick; when OFF: use raw position
      this._dragPos = this.host._snapToGrid ? this._snapDragPos(data) : data;
      this._skipNextClick = true;
      this._maybeExpandScale(data);                  // use raw so snapping can't hide out-of-bounds
      this._redrawDuringDrag();
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
        const xi = this.host.xAxisIndex;
        const yi = this.host.yAxisIndex;
        if (xi >= 0 && yi >= 0) {
          const inArea = setsInRect(this.host._getWorkingSets(), this.host._hid, xi, yi, s, c);
          // If all points in area are already selected → deselect all; else select all
          const allSelected = inArea.length > 0 && inArea.every(i => this.host._sel.has(i));
          inArea.forEach(i => {
            if (allSelected) this.host._sel.delete(i);
            else this.host._sel.add(i);
          });
          this.host._selCount = this.host._sel.size;
          this.host._refreshStyles();
          this.host.requestUpdate();
        }
      }
      this._brushStartPx = null;
      this._brushCurrPx = null;
      this.host._chart?.update("none");
      if (brushDist > 4) this._skipNextClick = true;
    }

    // ── End point drag: commit position to _localSets ───────────────────────
    if (this._dragPoint !== null) {
      this._commitPointDrag();
    }

    // ── End line endpoint drag: commit to _lines ───────────────────────────
    if (this._dragLineEP !== null) {
      this._stopScaleExp();
      if (this._dragLineEPMoved && this._dragLineEPPos !== null) {
        const { idx, ep } = this._dragLineEP;
        const pos = this._dragLineEPPos;
        this.host._lines = this.host._lines.map((l, i) =>
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
        this.host._lines = this.host._lines.map((l, i) => (i === idx ? { ...l, x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y } : l));
        this._skipNextClick = true;
      }
      this._dragLine = null;
      this._dragLinePos = null;
      this._dragLineMoved = false;
    }

    this._updateCursor();
  }

/** Commit an in-progress point drag to _localSets and reset drag state.
   *  Shared by the mouse (mouseup) and touch (touchend) paths. */
  private _commitPointDrag() {
    if (this._dragPoint === null) return;
    this._stopScaleExp(); // stop any in-progress scale expansion
    const actuallyMoved = this._dragPos !== null;
    if (actuallyMoved) {
      const si = this._dragPoint.setIdx;
      // When snap ON: _dragPos is already at the grid tick. When OFF: round raw to 3 decimals.
      const raw = this._dragRawPos ?? this._dragPos!;
      const finalX = this.host._snapToGrid ? this._dragPos!.x : Math.round(raw.x * 100) / 100;
      const finalY = this.host._snapToGrid ? this._dragPos!.y : Math.round(raw.y * 100) / 100;
      this.host._movePoint(si, finalX, finalY);
      this._skipNextClick = true; // only skip click after an actual drag
    }
    this._dragPos = null;
    this._dragRawPos = null;
    this._dragPoint = null;
    this._lockedScaleBounds = null;
    this._updateCursor();
    if (this.host._chart) {
      this.host._chart.data.datasets = this.host._buildDatasets();
      this.host._applyFixedPointBounds();
      this.host._chart.update("none");
    }
  }

  // ── Touch dragging (mobile) ──────────────────────────────────────────────
  // A single tap shows the tooltip (Chart.js touchstart handling); a quick
  // double-tap arms the drag mode via the synthesized-click double-click
  // detection in _handleClick (point turns red). Only touching such an
  // armed (red) point starts a drag. Mouse behavior is unaffected.

  private _touchPx(t: Touch): { x: number; y: number } {
    const canvas = this.host._chart?.canvas;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }

  private _handleTouchStart(e: TouchEvent) {
    // add-point / draw-line keep their tap flow (synthesized clicks)
    if (this.host._mode !== "none") return;
    if (e.touches.length !== 1 || !this.host._chart) return;
    const pi = this._pointAtPx(this._touchPx(e.touches[0]));
    // Only a touch on an ALREADY selected point starts a drag; anything else
    // falls through to the default flow (tap → synthesized click → select).
    if (pi === null || !this.host._sel.has(pi) || this.host._editPopup) return;
    this._touchDragging = true;
    this._dragPoint = { setIdx: pi };
    this._lockScaleBounds();
    navigator.vibrate?.(30); // haptic feedback where supported
    // No synthesized click (which would toggle the selection off) and no
    // page scrolling while dragging.
    e.preventDefault();
  }

  private _handleTouchMove(e: TouchEvent) {
    if (!this._touchDragging || this._dragPoint === null || !this.host._chart) return;
    if (e.touches.length !== 1) return;
    e.preventDefault(); // no page scroll while dragging a point
    const data = this._pxToData(this._touchPx(e.touches[0]));
    if (!data) return;
    this._dragRawPos = data;
    this._dragPos = this.host._snapToGrid ? this._snapDragPos(data) : data;
    this._maybeExpandScale(data);
    if (this._scaleExpRAFId === 0) {
      this.host._chart.data.datasets = this.host._buildDatasets();
      this._applyLockedBounds();
      this.host._chart.update("none");
    }
  }

  private _handleTouchEnd(_e: TouchEvent) {
    if (!this._touchDragging) return;
    this._touchDragging = false;
    this._commitPointDrag();
    // The point stays selected, so another touch can adjust it further.
  }

private _handleClick(e: MouseEvent) {
    if (this._skipNextClick) { this._skipNextClick = false; return; }
    const px = this._canvasPx(e);

    // ── Add point ─────────────────────────────────────────────────────────
    if (this.host._mode === "add-point") {
      const data = this._pxToData(px);
      if (data) this.host._addPoint(data.x, data.y);
      return;
    }

    // ── Draw line: two-click flow ─────────────────────────────────────────
    if (this.host._mode === "draw-line") {
      if (this._lineStart === null) {
        // First click: set first endpoint
        this._lineStart = this._snapData(px);
        this._lineCursorPx = px;
        this.host._chart!.data.datasets = this.host._buildDatasets();
        this.host._chart?.update("none");
      } else {
        // Second click: create line, then immediately deactivate draw-line mode
        const end = this._snapData(px);
        const length = Math.hypot(end.x - this._lineStart.x, end.y - this._lineStart.y);
        if (length > 1e-10) {
          this.host._lines = [
            ...this.host._lines,
            { x1: this._lineStart.x, y1: this._lineStart.y, x2: end.x, y2: end.y, name: this.host._lineName(this.host._lines.length) },
          ];
        }
        this.host._setMode("none"); // deactivates button immediately
      }
      return;
    }

    // ── None mode: line body has priority, then point click ─────────────
    if (this.host._mode === "none") {
      const li = this._lineAtPx(px);
      if (li !== null) {
        this.host._selLineIdx = li === this.host._selLineIdx ? null : li;
        this.host._chart?.update("none");
        return;
      }
      const pi = this._pointAtPx(px);
      if (pi !== null) {
        // A single click/tap only shows the tooltip (hover on desktop,
        // Chart.js touch handling on mobile) — no color change, no drag.
        // Only a quick SECOND click/tap on the same point toggles the red
        // "draggable" selection state.
        const now = performance.now();
        const isDouble =
          this._lastClickIdx === pi && now - this._lastClickTime < DOUBLE_CLICK_MS;
        this._lastClickIdx = pi;
        this._lastClickTime = now;
        if (!isDouble) return;
        this._lastClickIdx = null; // consume, so a third click starts fresh
        if (this.host._sel.has(pi)) this.host._sel.delete(pi);
        else this.host._sel.add(pi);
        this.host._selCount = this.host._sel.size;
        if (this.host._selCount >= 2) this.host._showConnectTooltip(px);
        else this.host._hideConnectTooltip();
        this.host._refreshStyles();
        this.host.focus(); // ensure keyboard events (Delete/Backspace) work
        this.host.requestUpdate();
        return;
      }
      // Click/tap on empty chart area: deselect everything — points return
      // to their original color and are no longer draggable.
      if (this.host._sel.size > 0) {
        this.host._sel.clear();
        this.host._selCount = 0;
        this.host._hideConnectTooltip();
        this.host._refreshStyles();
        this.host.requestUpdate();
      }
      this._lastClickIdx = null;
      if (this.host._selLineIdx !== null) {
        this.host._selLineIdx = null;
        this.host._chart?.update("none");
      }
    }
  }
}
