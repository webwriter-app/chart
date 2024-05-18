import { LitElement } from "lit";
import { CompleteChartData } from "../../interfaces";
import { Chart, ChartType } from "chart.js";

export function getContext<T extends LitElement>(
  this_: T,
  canvasId = "chart-canvas",
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
  targets: Record<string, any>[],
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

  constructor(type: ChartType, chart: T) {
    this.chart = chart;
    this.chartType = type;
    console.log(this.chartType);
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
    stepSize: number,
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
    console.log({ t: "hideExactValues", v: val });
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
