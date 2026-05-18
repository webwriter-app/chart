import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { ChartHelper, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";
import { addAlphaToRGB, chartOption } from "../../utils";

const BAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scalling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 5, "Step Size", 1, undefined),
};

declare global {
  interface HTMLElementTagNameMap { "bar-chart": BarChart; }
}

@customElement("bar-chart")
export class BarChart extends GenericChart<typeof BAR_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"bar", number[], string>> | undefined;

  protected getOptionDefinition() { return BAR_OPTIONS; }

  firstUpdated() {
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "bar",
      data: { labels: this.datasets.labels, datasets: this.prepareDataset() },
      options: {},
    });
    this.chartHelper = ChartHelper.create("bar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setYScales(
      this.sharedState.chart.options.dynamicSize as boolean,
      this.sharedState.chart.options.scaleMin as number,
      this.sharedState.chart.options.scaleMax as number,
      this.sharedState.chart.options.scaleStepSize as number
    );
    this.chartHelper.setHideExactValues(this.hide_excat_values);
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number
    );
    this.chartHelper.setHideExactValues(this.hide_excat_values);
    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    return this.datasets.sets.map((dataset) => ({
      label: dataset.name,
      data: dataset.data,
      backgroundColor: opts.individualColors
        ? dataset.colors.map((c) => addAlphaToRGB(c, opts.filled ? 1 : 0.2))
        : dataset.colors.map(() => addAlphaToRGB(dataset.color, opts.filled ? 1 : 0.2)),
      borderColor: opts.individualColors
        ? dataset.colors
        : dataset.colors.map(() => dataset.color),
      borderWidth: Number(opts.borderWidth ?? 1),
      borderRadius: Number(opts.borderRadius ?? 0),
    }));
  }
}
