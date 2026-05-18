import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { addAlphaToRGB, chartOption } from "../../utils";
import { ChartHelper, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const RADAR_OPTIONS = {
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  pointRadius: chartOption("number", 1, "Point Radius", 0, 10),
  fill: chartOption("boolean", false, "Fill"),
  pointColors: chartOption("boolean", false, "Point Colors"),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

declare global {
  interface HTMLElementTagNameMap { "radar-chart": RadarChart; }
}

@customElement("radar-chart")
export class RadarChart extends GenericChart<typeof RADAR_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"radar", number[], string>> | undefined;

  protected getOptionDefinition() { return RADAR_OPTIONS; }

  firstUpdated() {
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "radar",
      data: { labels: this.datasets.labels, datasets: this.prepareDataset() },
      options: {},
    });
    this.chartHelper = ChartHelper.create("radar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(this.sharedState.chart.options.smoothTheLine as boolean);
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(opts.smoothTheLine as boolean);
    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    return this.datasets.sets.map((dataset) => ({
      label: dataset.name,
      data: dataset.data,
      backgroundColor: opts.fill
        ? dataset.colors.map(() => dataset.color)
        : dataset.colors.map(() => addAlphaToRGB(dataset.color, 0.2)),
      pointBackgroundColor: opts.pointColors
        ? dataset.colors
        : dataset.colors.map(() => dataset.color),
      borderColor: dataset.color,
      borderWidth: Number(opts.borderWidth ?? 1),
      pointBorderColor: "transparent",
      pointRadius: Number(opts.pointRadius ?? 0),
    }));
  }
}
