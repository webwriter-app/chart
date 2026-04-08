import { CompleteChartData } from "../../chart-models";
import { Chart, ChartType } from "chart.js";
import { GenericChart } from "./GenericChart";

export function getContext<T extends GenericChart<{}>>(
  this_: T,
  canvasId = "chart-canvas"
): CanvasRenderingContext2D {
  const canvas = (this_.shadowRoot?.getElementById(canvasId) ||
    null) as HTMLCanvasElement | null;
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
//TODO: fix ChartTypeRegistry
export class ChartHelper<T extends Chart<any, number[], string>> {
  public chart: T;
  private chartType: ChartType;

  // Static method to create and initialize a ChartHelper
  public static create<T extends Chart<any, number[], string>>(
    type: ChartType,
    chart: T
  ): ChartHelper<T> {
    const helper = new ChartHelper<T>();
    helper.initialize(type, chart);
    return helper;
  } // Add the closing parenthesis here
  // Initialize method (private to ensure it's only called internally)
  private initialize(type: ChartType, chart: T) {
    // Ensure the chart is not null or undefined
    if (!chart) {
      throw new Error("Invalid chart instance passed to ChartHelper.");
    }

    // Ensure chart options are initialized
    if (!chart.options) {
      throw new Error("Chart options are not initialized.");
    }

    // Initialize the chart and chartType
    this.chart = chart;
    this.chartType = type;
  }

  public setTitle(title: string) {
    if (!this.chart.options.plugins) this.chart.options.plugins = {};
    if (!this.chart.options.plugins.title)
      this.chart.options.plugins.title = {};
    this.chart.options.plugins.title.text = title;
    this.chart.options.plugins.title.display = title !== "";
  }

  public setYScales(
    dynamicSize: boolean,
    scaleMin: number,
    scaleMax: number,
    stepSize: number
  ) {
    if (!this.chart.options.scales) this.chart.options.scales = {};
    if (!this.chart.options.scales.y) this.chart.options.scales.y = {};

    this.chart.options.scales.y = {
      min: undefined,
      max: undefined,
    };

    if (!dynamicSize)
      this.chart.options.scales.y = {
        min: scaleMin,
        max: scaleMax,
        ticks: {
          stepSize: stepSize,
        },
      };

    // @ts-ignore
    if (this.chart.options.scales.y.beginAtZero)
      // @ts-ignore
      this.chart.options.scales.y.beginAtZero = dynamicSize;
  }

  public setIndexAxis(indexAxis: "x" | "y") {
    this.chart.options.indexAxis = indexAxis;
  }

  public setXLabels(labels: string[]) {
    this.chart.data.labels = labels;
  }

  public setHideExactValues(val: boolean) {
    if (!val)
      this.chart.options.events = [
        "mousemove",
        "mouseout",
        "click",
        "touchstart",
        "touchmove",
      ];
    else this.chart.options.events = [];
  }

  public setLineSmooth(isLineSmooth: boolean) {
    if (!this.chart.options.elements) this.chart.options.elements = {};
    if (!this.chart.options.elements.line)
      this.chart.options.elements.line = {};

    this.chart.options.elements.line.tension = isLineSmooth ? 0.4 : 0;
  }

  public update() {
    this.chart.update();
  }
}
