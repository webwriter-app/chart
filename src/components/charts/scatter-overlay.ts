import type Chart from "chart.js/auto";
import { COLORS, r3, visiblePoints } from "../../model/scatter-geometry";
import type { ScatterChartJs } from "./scatter-chart";

/** Draws what the plot adds to the chart on the canvas: brush rectangle, guide lines, outliers, mean lines, regression curve and line handles. */
export function drawScatterOverlay(chart: Chart, host: ScatterChartJs) {
  const ctx = chart.ctx;
  ctx.save();

  // ── Brush selection rectangle ─────────────────────────────────────────
  if (host.ptr._brushStartPx && host.ptr._brushCurrPx) {
    const rx = host.ptr._brushStartPx.x;
    const ry = host.ptr._brushStartPx.y;
    const rw = host.ptr._brushCurrPx.x - rx;
    const rh = host.ptr._brushCurrPx.y - ry;
    ctx.strokeStyle = "rgba(33,150,243,0.8)";
    ctx.fillStyle = "rgba(33,150,243,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillRect(rx, ry, rw, rh);
    ctx.setLineDash([]);
  }

  const opts = host.sharedState?.chart?.options ?? {};
  const xi = host.xAxisIndex;
  const yi = host.yAxisIndex;
  if (xi < 0 || yi < 0) { ctx.restore(); return; }

  const sets = host._getWorkingSets();
  const allPoints = visiblePoints(sets, host._hid, xi, yi);

  const a = chart.chartArea;
  const xSc = chart.scales.x;
  const ySc = chart.scales.y;

  // ── Sequential dotted-line-to-axis animation ──────────────────────────
  if (Boolean(opts.animation) && host._animProgress.length > 0) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    sets.forEach((s, i) => {
      const prog = host._animProgress[i] ?? 0;
      if (prog <= 0 || host._hid.has(i)) return;
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

  // ── Outlier highlighting (IQR on model residuals; univariate fallback) ─
  const regComp = host._regression(allPoints);
  if (opts.showOutliers) {
    allPoints.forEach((p, i) => {
      if (!regComp.outlierMask[i]) return;
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
    const mx = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length;
    const my = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length;

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
  {
    const reg = regComp.fit?.curve;
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
  if (host._lines.length > 0) {
    const epXSc = chart.scales?.x;
    const epYSc = chart.scales?.y;
    if (epXSc && epYSc) {
      // Collect pixel positions of all visible scatter points
      const scatterPxs = host._getWorkingSets()
        .map((s, idx) => {
          if (host._hid.has(idx)) return null;
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

      host._lines.forEach((line, i) => {
        const isSel = i === host._selLineIdx;
        const al = host._getActiveLine(line, i);
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

  // The keyboard cursor
  if (host._kbIdx !== null && chart.canvas.matches(":focus-visible")) {
    const set = sets[host._kbIdx];
    const x = Number(set?.data[xi]);
    const y = Number(set?.data[yi]);
    if (set && Number.isFinite(x) && Number.isFinite(y)) {
      ctx.beginPath();
      ctx.arc(xSc.getPixelForValue(x), ySc.getPixelForValue(y), 11, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeStyle = "#1a73e8";
      ctx.stroke();
    }
  }

  ctx.restore();
}
