// Pie and Doughnut are identical except for the Chart.js type string.
// CircularChart holds all shared logic; the two subclasses just declare the type.
import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { ChartHelper, CHART_PALETTE, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";
import { addAlphaToRGB, chartOption } from "../../utils";

const CIRCULAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
};

type CircularChartType = "pie" | "doughnut";

abstract class CircularChart extends GenericChart<typeof CIRCULAR_OPTIONS> {
  protected abstract readonly chartJsType: CircularChartType;

  @state()
  accessor chartHelper: ChartHelper<Chart<CircularChartType, number[], string>> | undefined;

  protected getOptionDefinition() {
    return CIRCULAR_OPTIONS;
  }

  firstUpdated() {
    const { xLabels } = this.transformByXAxis();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: this.chartJsType,
      data: { labels: xLabels, datasets: this.prepareDataset() },
      options: { responsive: true, maintainAspectRatio: false },
    });
    this.chartHelper = ChartHelper.create(this.chartJsType, chart) as any;
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
    const filled = opts.filled ? 1 : 0.2;
    const borderWidth = Number(opts.borderWidth ?? 1);
    const borderRadius = Number(opts.borderRadius ?? 0);
    const { columns } = this.transformByXAxis();
    return columns.map((col) => ({
      label: col.label,
      data: col.data,
      backgroundColor: col.data.map((_, si) =>
        addAlphaToRGB(CHART_PALETTE[si % CHART_PALETTE.length], filled)
      ),
      hoverBackgroundColor: col.data.map((_, si) => addAlphaToRGB(CHART_PALETTE[si % CHART_PALETTE.length], 0.7)),
      borderColor: col.data.map((_, si) => CHART_PALETTE[si % CHART_PALETTE.length]),
      borderWidth,
      hoverBorderWidth: borderWidth + 1,
      borderRadius,
    }));
  }
}

// ─── Pie ─────────────────────────────────────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap { "pie-chart": PieChart; }
}

@customElement("pie-chart")
export class PieChart extends CircularChart {
  protected readonly chartJsType = "pie" as const;
}

// ─── Doughnut ─────────────────────────────────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap { "doughnut-chart": DoughnutChart; }
}

@customElement("doughnut-chart")
export class DoughnutChart extends CircularChart {
  protected readonly chartJsType = "doughnut" as const;
}
