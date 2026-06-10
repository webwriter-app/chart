import { CompleteChartData } from "../../state/models";
import { Chart, ChartType } from "chart.js";
import { GenericChart } from "./chart-base";

export const CHART_PALETTE = [
  "#3f51b5", "#f44336", "#4caf50", "#ff9800", "#9c27b0",
  "#00bcd4", "#795548", "#607d8b", "#e91e63", "#2196f3",
  "#8bc34a", "#ffc107",
];

// Softer palette for line charts (Material Design 300-level tones)
export const LINE_PALETTE = [
  "#7986cb", "#ef9a9a", "#81c784", "#ffb74d", "#ce93d8",
  "#4dd0e1", "#a1887f", "#90a4ae", "#f48fb1", "#64b5f6",
  "#aed581", "#ffd54f",
];

function dimColor(c: string): string {
  if (typeof c !== "string" || c.length < 4) return c;
  if (c.startsWith("rgba(")) return c.replace(/,\s*[\d.]+\)$/, ", 0.6)");
  if (c.startsWith("rgb(")) return c.replace("rgb(", "rgba(").replace(")", ", 0.6)");
  const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
  return hex.slice(0, 7) + "99"; // 60% opacity
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

export const getLabels = (data: CompleteChartData): string[] =>
  Object.values(data).map((val) => val.label);

export const getData = (data: CompleteChartData): number[] =>
  Object.values(data).map((val) => val.value);

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
    const isPieOrDoughnut = this.chartType === "pie" || this.chartType === "doughnut";

    if (!chart.options.plugins) chart.options.plugins = {};
    if (!chart.options.plugins.legend) chart.options.plugins.legend = {};

    // Position: right for circular/polar, bottom for everything else
    const rightLegendTypes: ChartType[] = ["pie", "doughnut", "polarArea", "radar"];
    (chart.options.plugins.legend as any).position =
      rightLegendTypes.includes(this.chartType) ? "right" : "bottom";

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

      if (isPieOrDoughnut) {
        // setActiveElements triggers hoverBorderWidth (+3) and hoverBackgroundColor natively
        c.setActiveElements([{ datasetIndex: item.datasetIndex, index: item.index }]);
        c.data.datasets.forEach((ds: any, dsIdx: number) => {
          if (dsIdx !== item.datasetIndex) {
            dimDataset(ds);
          } else {
            // Dim all arcs except the hovered one; leave hovered arc untouched so
            // Chart.js can apply hoverBackgroundColor on top of the original color
            if (Array.isArray(ds.backgroundColor)) {
              ds.backgroundColor = ds.backgroundColor.map((col: string, si: number) =>
                si === item.index ? col : dimColor(col)
              );
            }
            if (Array.isArray(ds.borderColor)) {
              ds.borderColor = ds.borderColor.map((col: string, si: number) =>
                si === item.index ? col : dimColor(col)
              );
            }
          }
        });
      } else {
        // For all other chart types legend items map to datasets
        c.data.datasets.forEach((ds: any, i: number) => {
          if (i !== item.datasetIndex) {
            dimDataset(ds);
          } else {
            // Keep original colors; increase border width by +1
            ds.borderWidth = (typeof ds.borderWidth === "number" ? ds.borderWidth : 1) + 1;
          }
        });
      }

      c.update("none");
    };

    (chart.options.plugins.legend as any).onLeave = (_e: any, _item: any, legend: any) => {
      const c = legend.chart;
      if (c.canvas) c.canvas.style.cursor = "";

      if (isPieOrDoughnut) c.setActiveElements([]);

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

  public update() {
    this.chart.update();
  }
}
