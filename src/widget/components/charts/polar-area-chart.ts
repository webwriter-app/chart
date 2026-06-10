import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { addAlphaToRGB, chartOption } from "../../utils";
import { ChartHelper, CHART_PALETTE, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const POLAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scaling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 10, "Step Size", 1, undefined),
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
    const { xLabels } = this.transformByXAxis();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "polarArea",
      data: { labels: xLabels, datasets: this.prepareDataset() },
      options: { responsive: true, maintainAspectRatio: false },
    });
    const opts0 = this.sharedState.chart.options;
    this.chartHelper = ChartHelper.create("polarArea", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setRScales(
      opts0.dynamicSize !== false,
      Number(opts0.scaleMin ?? 0),
      Number(opts0.scaleMax ?? 100),
      Number(opts0.scaleStepSize ?? 10),
      this.scaleLabel
    );
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    const { xLabels } = this.transformByXAxis();
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setRScales(
      opts.dynamicSize !== false,
      Number(opts.scaleMin ?? 0),
      Number(opts.scaleMax ?? 100),
      Number(opts.scaleStepSize ?? 10),
      this.scaleLabel
    );
    this.chartHelper.setXLabels(xLabels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    const { columns } = this.transformByXAxis();
    const datasets = columns.map((col) => ({
      label: col.label,
      data: col.data,
      backgroundColor: col.data.map((_, si) =>
        addAlphaToRGB(CHART_PALETTE[si % CHART_PALETTE.length], opts.filled ? 1 : 0.2)
      ),
      borderColor: col.data.map((_, si) => CHART_PALETTE[si % CHART_PALETTE.length]),
      borderWidth: Number(opts.borderWidth ?? 1),
      borderRadius: Number(opts.borderRadius ?? 0),
    }));
    // Render highest-value datasets first (behind) so smaller values stay visible on top
    datasets.sort((a, b) => Math.max(...b.data) - Math.max(...a.data));
    return datasets;
  }
}
