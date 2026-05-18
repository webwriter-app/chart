// Pie and Doughnut are identical except for the Chart.js type string.
// CircularChart holds all shared logic; the two subclasses just declare the type.
import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { ChartHelper, getContext, updateData } from "./chart-helpers";
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
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: this.chartJsType,
      data: { labels: this.getChartLabels(), datasets: this.prepareDataset() },
      options: {},
    });
    this.chartHelper = ChartHelper.create(this.chartJsType, chart) as any;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setXLabels(this.getChartLabels());
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private isSingleCategoryView(): boolean {
    return this.datasets.labels?.length === 1 && this.datasets.sets?.length > 1;
  }

  private getChartLabels(): string[] {
    if (this.isSingleCategoryView()) {
      return this.datasets.sets?.map((d) => d.name) ?? [];
    }
    return this.datasets.labels;
  }

  private prepareDataset() {
    const filled = this.sharedState.chart.options.filled ? 1 : 0.2;
    const borderWidth = Number(this.sharedState.chart.options.borderWidth ?? 1);
    const borderRadius = Number(this.sharedState.chart.options.borderRadius ?? 0);

    if (this.isSingleCategoryView()) {
      const data = this.datasets.sets.map((d) => Number(d.data[0] ?? 0));
      const baseColors = this.datasets.sets.map((d) => d.colors[0] ?? d.color);
      return [{
        label: this.datasets.labels[0] ?? "Value",
        data,
        backgroundColor: baseColors.map((c) => addAlphaToRGB(c, filled)),
        borderColor: baseColors,
        borderWidth,
        borderRadius,
      }];
    }

    return this.datasets.sets.map((dataset) => ({
      label: dataset.name,
      data: dataset.data,
      backgroundColor: dataset.colors.map((c) => addAlphaToRGB(c, filled)),
      borderColor: dataset.colors,
      borderWidth,
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
