// Pie and Doughnut are identical except for the Chart.js type string.
// CircularChart holds all shared logic; the two subclasses just declare the type.
import Chart from "chart.js/auto";
import { ChartHelper, CHART_PALETTE, getContext, updateData, makeCircularLegendCallbacks } from "./chart-helpers";
import { createHtmlLegendPlugin } from "./html-legend";
import { GenericChart } from "./chart-base";
import { addAlphaToRGB, chartOption } from "../../model/chart-options";

const CIRCULAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
};

type CircularChartType = "pie" | "doughnut";

export abstract class CircularChart extends GenericChart<typeof CIRCULAR_OPTIONS> {
  protected abstract readonly chartJsType: CircularChartType;

  protected getOptionDefinition() {
    return CIRCULAR_OPTIONS;
  }

  firstUpdated() {
    const { xLabels } = this.transformByXAxis();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: this.chartJsType,
      data: { labels: xLabels, datasets: this.prepareDataset() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 8 },
        plugins: { legend: makeCircularLegendCallbacks() },
      },
      plugins: [createHtmlLegendPlugin(() => this.shadowRoot?.getElementById("html-legend"))],
    });
    this.chartHelper = ChartHelper.create(this.chartJsType, chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const { xLabels } = this.transformByXAxis();
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setXLabels(xLabels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    const borderWidth = Number(opts.borderWidth ?? 1);
    const borderRadius = Number(opts.borderRadius ?? 0);
    const { columns } = this.transformByXAxis();
    return columns.map((col) => ({
      label: col.label,
      data: col.data,
      backgroundColor: col.data.map((_, si) => CHART_PALETTE[si % CHART_PALETTE.length] + "33"),
      hoverBackgroundColor: col.data.map((_, si) => addAlphaToRGB(CHART_PALETTE[si % CHART_PALETTE.length], 0.7)),
      borderColor: col.data.map((_, si) => CHART_PALETTE[si % CHART_PALETTE.length]),
      borderWidth,
      hoverBorderWidth: borderWidth + 1,
      borderRadius,
    }));
  }
}

