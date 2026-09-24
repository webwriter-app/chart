import { Chart, ChartType } from "chart.js";
import { GenericChart } from "./chart-base";

export const CHART_PALETTE = [
  "#3f51b5", "#f44336", "#4caf50", "#ff9800", "#9c27b0",
  "#00bcd4", "#795548", "#607d8b", "#e91e63", "#2196f3",
  "#8bc34a", "#ffc107",
];

export const LINE_PALETTE = [
  "#7986cb", "#ef9a9a", "#81c784", "#ffb74d", "#ce93d8",
  "#4dd0e1", "#a1887f", "#90a4ae", "#f48fb1", "#64b5f6",
  "#aed581", "#ffd54f",
];

function dimColor(c: string): string {
  if (typeof c !== "string" || c.length < 4) return c;
  if (c.startsWith("rgba(")) return c.replace(/,\s*[\d.]+\)$/, ", 0.15)");
  if (c.startsWith("rgb(")) return c.replace("rgb(", "rgba(").replace(")", ", 0.15)");
  const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
  return hex.slice(0, 7) + "26"; 
}

function dimDataset(ds: any) {
  if (Array.isArray(ds.backgroundColor)) {
    ds.backgroundColor = ds.backgroundColor.map(dimColor);
  } else if (typeof ds.backgroundColor === "string") {
    ds.backgroundColor = dimColor(ds.backgroundColor);
  }
  if (Array.isArray(ds.borderColor)) {
    ds.borderColor = ds.borderColor.map(dimColor);
  } else if (typeof ds.borderColor === "string") {
    ds.borderColor = dimColor(ds.borderColor);
  }
}

export function getContext<T extends GenericChart<{}>>(
  this_: T,
  canvasId = "chart-canvas"
): CanvasRenderingContext2D {
  const canvas = (this_.shadowRoot?.getElementById(canvasId) || null) as HTMLCanvasElement | null;
  if (!canvas) throw new Error("No canvas found");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No context found");
  return ctx;
}

export function updateData(
  sources: Record<string, any>[],
  targets: Record<string, any>[]
) {
  if (sources.length < targets.length) {
    targets.splice(sources.length, targets.length - sources.length);
  }
  if (sources.length > targets.length) {
    for (let i = targets.length; i < sources.length; i++) {
      targets.push(sources[i]);
    }
  }
  targets.forEach((target: any, i: number) => {
    Object.keys(sources[i]).forEach((key) => (target[key] = sources[i][key]));
  });
}

export function makeCircularLegendCallbacks() {
  let saved: { backgroundColor: string[]; borderWidth: any }[] = [];

  return {
    onHover(_e: any, item: any, legend: any) {
      if (legend.chart.canvas) legend.chart.canvas.style.cursor = "pointer";
      const c = legend.chart;
      if (saved.length === 0) {
        c.data.datasets.forEach((ds: any) => {
          saved.push({ backgroundColor: [...ds.backgroundColor], borderWidth: ds.borderWidth });
        });
      }
      c.data.datasets.forEach((ds: any, dsIdx: number) => {
        const origBw = saved[dsIdx]?.borderWidth ?? 1;
        const bwArr: number[] = Array.isArray(origBw)
          ? origBw
          : Array(ds.backgroundColor.length).fill(origBw);
        ds.backgroundColor = ds.backgroundColor.map((color: string, index: number) =>
          index === item.index
            ? color.slice(0, 7) + "80" 
            : color.slice(0, 7) + "26" 
        );
        ds.borderWidth = bwArr.map((_: number, index: number) =>
          index === item.index ? origBw : 0
        );
      });
      c.update("none");
    },
    onLeave(_e: any, _item: any, legend: any) {
      if (legend.chart.canvas) legend.chart.canvas.style.cursor = "";
      const c = legend.chart;
      if (saved.length > 0) {
        c.data.datasets.forEach((ds: any, i: number) => {
          if (saved[i]) {
            ds.backgroundColor = [...saved[i].backgroundColor];
            ds.borderWidth = saved[i].borderWidth;
          }
        });
        saved = [];
      }
      c.update("none");
    },
  };
}

export class ChartHelper<T extends Chart<any, number[], string>> {
  public chart: T;
  private chartType: ChartType;

  public static create<T extends Chart<any, number[], string>>(
    type: ChartType,
    chart: T
  ): ChartHelper<T> {
    const helper = new ChartHelper<T>();
    helper.initialize(type, chart);
    helper.setLegendHoverHighlight();
    helper.setupTouchDismiss();
    helper.setupMobileLegendTap();
    return helper;
  }

  private initialize(type: ChartType, chart: T) {
    if (!chart) throw new Error("Invalid chart instance passed to ChartHelper.");
    if (!chart.options) throw new Error("Chart options are not initialized.");
    this.chart = chart;
    this.chartType = type;
  }

  public setTitle(_title: string) {
    if (!this.chart.options.plugins) this.chart.options.plugins = {};
    if (!this.chart.options.plugins.title) this.chart.options.plugins.title = {};
    this.chart.options.plugins.title.display = false;
  }

  public setYScales(
    dynamicSize: boolean,
    scaleMin: number,
    scaleMax: number,
    stepSize: number,
    yLabel = ""
  ) {
    if (!this.chart.options.scales) this.chart.options.scales = {};
    const title = { display: yLabel !== "", text: yLabel };
    if (!dynamicSize) {
      this.chart.options.scales.y = { min: scaleMin, max: scaleMax, ticks: { stepSize }, title } as any;
    } else {
      this.chart.options.scales.y = {
        afterDataLimits(scale: any) { scale.max = Math.ceil(scale.max) + 1; },
        title,
      } as any;
    }
  }

  public setRScalePadding() {
    if (!this.chart.options.scales) this.chart.options.scales = {};
    const r = (this.chart.options.scales as any).r ?? {};
    (this.chart.options.scales as any).r = {
      ...r,
      afterDataLimits(scale: any) { scale.max = Math.ceil(scale.max) + 1; },
    };
  }

  public setRScales(
    dynamicSize: boolean,
    scaleMin: number,
    scaleMax: number,
    stepSize: number,
    scaleLabel = ""
  ) {
    if (!this.chart.options.scales) this.chart.options.scales = {};
    const tickCallback = scaleLabel
      ? (value: number | string, i: number, ticks: any[]) =>
          i === ticks.length - 1 ? `${value} ${scaleLabel}` : String(value)
      : undefined;
    if (!dynamicSize) {
      (this.chart.options.scales as any).r = {
        min: scaleMin,
        max: scaleMax,
        ticks: { stepSize, callback: tickCallback },
      };
    } else {
      (this.chart.options.scales as any).r = {
        afterDataLimits(scale: any) { scale.max = Math.ceil(scale.max) + 1; },
        ticks: { callback: tickCallback },
      };
    }
  }

  public setIndexAxis(indexAxis: "x" | "y") {
    this.chart.options.indexAxis = indexAxis;
  }

  public setXLabels(labels: string[]) {
    this.chart.data.labels = labels;
  }

  public setHideExactValues(val: boolean) {
    if (!val) {
      this.chart.options.events = [
        "mousemove", "mouseout", "click", "touchstart", "touchmove",
      ];
    } else {
      this.chart.options.events = [];
    }
  }

  public setLineSmooth(isLineSmooth: boolean) {
    if (!this.chart.options.elements) this.chart.options.elements = {};
    if (!this.chart.options.elements.line) this.chart.options.elements.line = {};
    this.chart.options.elements.line.tension = isLineSmooth ? 0.4 : 0;
  }

  public setLegendHoverHighlight() {
    const chart = this.chart;
    const isCircular =
      this.chartType === "pie" ||
      this.chartType === "doughnut" ||
      this.chartType === "polarArea";

    if (!chart.options.plugins) chart.options.plugins = {};
    if (!chart.options.plugins.legend) chart.options.plugins.legend = {};

    // The legend is rendered as scrollable HTML below the canvas
    // (html-legend.ts); the native canvas legend stays off so it can
    // never squeeze the chart area.
    (chart.options.plugins.legend as any).display = false;

    if (isCircular) {
      return;
    }
    let saved: { borderColor: any; backgroundColor: any; borderWidth: any }[] = [];

    (chart.options.plugins.legend as any).onHover = (_e: any, item: any, legend: any) => {
      const c = legend.chart;
      if (c.canvas) c.canvas.style.cursor = "pointer";

      if (saved.length === 0) {
        c.data.datasets.forEach((ds: any) => {
          saved.push({
            borderColor: Array.isArray(ds.borderColor) ? [...ds.borderColor] : ds.borderColor,
            backgroundColor: Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : ds.backgroundColor,
            borderWidth: ds.borderWidth,
          });
        });
      }

      c.data.datasets.forEach((ds: any, i: number) => {
        if (i !== item.datasetIndex) {
          dimDataset(ds);
        } else {
          ds.borderWidth = (typeof ds.borderWidth === "number" ? ds.borderWidth : 1) * 1.5;
        }
      });

      c.update("none");
    };

    (chart.options.plugins.legend as any).onLeave = (_e: any, _item: any, legend: any) => {
      const c = legend.chart;
      if (c.canvas) c.canvas.style.cursor = "";

      c.data.datasets.forEach((ds: any, i: number) => {
        if (saved[i]) {
          ds.borderColor = saved[i].borderColor;
          ds.backgroundColor = saved[i].backgroundColor;
          ds.borderWidth = saved[i].borderWidth;
        }
      });
      saved = [];

      c.update("none");
    };
  }

  /** Touch: a tap on empty chart area dismisses the active tooltip/highlight.
   *  A tap on an element is handled natively by Chart.js (touchstart is in
   *  the default event list) and shows the tooltip — "tap to select". */
  private setupTouchDismiss() {
    const chart = this.chart;
    const canvas = chart.canvas;
    if (!canvas) return;
    canvas.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        const els = chart.getElementsAtEventForMode(
          e as unknown as Event,
          "nearest",
          { intersect: true },
          false
        );
        if (els.length === 0) {
          chart.setActiveElements([]);
          (chart as any).tooltip?.setActiveElements([], { x: 0, y: 0 });
          chart.update("none");
        }
      },
      { passive: true }
    );
  }

  /** Touch devices have no hover, so legend taps do double duty:
   *  first tap on an item = highlight (what hover does on desktop),
   *  second tap on the same item = default toggle (hide/show the data). */
  private setupMobileLegendTap() {
    const isCoarse =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ?? false);
    if (!isCoarse) return;
    const legend = this.chart.options.plugins!.legend as any;
    const hoverFn = legend.onHover;
    const leaveFn = legend.onLeave;
    if (!hoverFn) return;
    // Circular types override legend onClick (per-index toggleDataVisibility)
    // instead of the generic per-dataset toggle
    const defaultToggle =
      (Chart.overrides as any)[this.chartType]?.plugins?.legend?.onClick ??
      (Chart.defaults.plugins.legend as any).onClick;
    let lastKey: string | null = null;
    legend.onClick = (e: any, item: any, lg: any) => {
      const key = `${item.datasetIndex ?? ""}:${item.index ?? ""}`;
      if (lastKey !== key) {
        lastKey = key;
        hoverFn(e, item, lg);
      } else {
        lastKey = null;
        leaveFn?.(e, item, lg);
        defaultToggle?.call(lg, e, item, lg);
      }
    };
  }

  public update() {
    this.chart.update();
  }
}
