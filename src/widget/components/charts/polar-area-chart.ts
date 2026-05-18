import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { addAlphaToRGB, chartOption } from "../../utils";
import { ChartHelper, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const POLAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
};

declare global {
  interface HTMLElementTagNameMap { "polar-chart": PolarChart; }
}

@customElement("polar-chart")
export class PolarChart extends GenericChart<typeof POLAR_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"polarArea", number[], string>> | undefined;

  protected getOptionDefinition() { return POLAR_OPTIONS; }

  firstUpdated() {
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "polarArea",
      data: { labels: this.datasets.labels, datasets: this.prepareDataset() },
      options: {},
    });
    this.chartHelper = ChartHelper.create("polarArea", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    return this.datasets.sets.map((dataset) => ({
      label: dataset.name,
      data: dataset.data,
      backgroundColor: dataset.colors.map((c) =>
        addAlphaToRGB(c, opts.filled ? 1 : 0.2)
      ),
      borderColor: dataset.colors,
      borderWidth: Number(opts.borderWidth ?? 1),
      borderRadius: Number(opts.borderRadius ?? 0),
    }));
  }
}
