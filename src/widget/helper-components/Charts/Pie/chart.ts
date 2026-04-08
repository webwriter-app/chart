import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";
import { addAlphaToRGB } from "../../../utils";

declare global {
  interface HTMLElementTagNameMap {
    "pie-chart": PieChart;
  }
}

@customElement("pie-chart")
export class PieChart extends GenericChart<typeof OptionDefinition> {
@state()
  accessor chartHelper: ChartHelper<Chart<"pie", number[], string>> | undefined;

connectedCallback() {
    super.connectedCallback();
    this.sharedState.chart.optionDefinition = OptionDefinition;
    this.sharedState.chart.options = Object.entries(OptionDefinition).reduce(
      (acc, [key, value]) => {
        acc[key] = this.sharedState.chart.options[key] ?? value.default;
        return acc;
      },
      {} as any
    ) as ChartOptions<OptionDefinition>;

    this.requestUpdate();
  }

firstUpdated() {
    const datasets = this.prepareDataset();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: this.getChartLabels(),
        datasets: datasets,
      },
      options: {},
    });

    this.chartHelper = ChartHelper.create("pie", chart);
    this.chartHelper.setTitle(this.label);

    this.chartHelper.update();

    // Add pointer cursor to legend items to indicate interactivity
    const applyLegendCursor = () => {
      const legendItems = document.querySelectorAll('.chartjs-legend li');
      legendItems.forEach(item => {
        (item as HTMLElement).style.cursor = 'pointer';
      });
    };
    applyLegendCursor();
    setTimeout(applyLegendCursor, 100);
    setTimeout(applyLegendCursor, 300);
  }

private isSingleCategoryView(): boolean {
    return this.datasets.labels.length === 1 && this.datasets.sets.length > 1;
  }

private getChartLabels(): string[] {
    if (this.isSingleCategoryView()) {
      return this.datasets.sets.map((dataset) => dataset.name);
    }
    return this.datasets.labels;
  }

updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);

    this.chartHelper.setXLabels(this.getChartLabels());
    updateData(datasets, this.chartHelper.chart.data.datasets);

    this.chartHelper.update();
  }

prepareDataset(): {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
    borderRadius: number;
  }[] {
    if (this.isSingleCategoryView()) {
      const filled = this.sharedState.chart.options.filled ? 1 : 0.2;
      const data = this.datasets.sets.map((dataset) => Number(dataset.data[0] ?? 0));
      const baseColors = this.datasets.sets.map(
        (dataset) => dataset.colors[0] ?? dataset.color
      );

      return [
        {
          label: this.datasets.labels[0] ?? "Value",
          data,
          backgroundColor: baseColors.map((color) => addAlphaToRGB(color, filled)),
          borderColor: baseColors,
          borderWidth: Number(this.sharedState.chart.options.borderWidth ?? 1),
          borderRadius: Number(this.sharedState.chart.options.borderRadius ?? 0),
        },
      ];
    }

    const result = this.datasets.sets.map((dataset) => {
      return {
        label: dataset.name,
        data: dataset.data,
        backgroundColor: dataset.colors.map((color) =>
          addAlphaToRGB(color, this.sharedState.chart.options.filled ? 1 : 0.2)
        ),
        borderColor: dataset.colors,
        borderWidth: Number(this.sharedState.chart.options.borderWidth ?? 1),
        borderRadius: Number(this.sharedState.chart.options.borderRadius ?? 0),
      };
    });
    return result;
  }
}