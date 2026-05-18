import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { fillArray, chartOption } from "../../utils";
import { ChartHelper, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const LINE_OPTIONS = {
  borderWidth: chartOption("number", 1, "Line Border Width", 0, 5),
  pointRadius: chartOption("number", 1, "Point Radius", 0, 10),
  pointColors: chartOption("boolean", false, "Point Colors"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scalling"),
  scaleMin: chartOption("number", 0, "Scale Min", Infinity, Infinity),
  scaleMax: chartOption("number", 100, "Scale Max", Infinity, Infinity),
  scaleStepSize: chartOption("number", 5, "Step Size", Infinity, Infinity),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

declare global {
  interface HTMLElementTagNameMap { "line-chart": LineChart; }
}

@customElement("line-chart")
export class LineChart extends GenericChart<typeof LINE_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"line", number[], string>> | undefined;

  protected getOptionDefinition() { return LINE_OPTIONS; }

  firstUpdated() {
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "line",
      data: { labels: this.datasets.labels, datasets: this.prepareDataset() },
      options: {},
    });
    // @ts-ignore
    this.chartHelper = ChartHelper.create("line", chart);
    const opts = this.sharedState.chart.options;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(opts.smoothTheLine as boolean);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number
    );
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(opts.smoothTheLine as boolean);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number
    );
    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    return this.datasets.sets.map((dataset) => ({
      label: dataset.name,
      data: dataset.data,
      backgroundColor: opts.pointColors
        ? dataset.colors
        : fillArray(dataset.colors.length, dataset.color),
      borderColor: dataset.color,
      borderWidth: Number(opts.borderWidth ?? 1),
      pointBorderColor: "transparent",
      pointRadius: Number(opts.pointRadius ?? 0),
    }));
  }
}
