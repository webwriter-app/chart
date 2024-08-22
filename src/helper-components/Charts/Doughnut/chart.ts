import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";
import { addAlphaToRGB } from "../../../functions";

@customElement("doughnut-chart")
export class DoughnutChart extends GenericChart<typeof OptionDefinition> {
  constructor() {
    super(OptionDefinition);
  }

  @state()
  accessor chartHelper:
    | ChartHelper<Chart<"doughnut", number[], string>>
    | undefined;

  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);

    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(datasets, this.chartHelper.chart.data.datasets);

    this.chartHelper.update();
  }

  firstUpdated() {
    const datasets = this.prepareDataset();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: this.datasets.labels,
        datasets: datasets,
      },
    });

    this.chartHelper = new ChartHelper("doughnut", chart);
    this.chartHelper.setTitle(this.label);

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
    const result = this.datasets.sets.map((dataset) => {
      return {
        label: dataset.name,
        data: dataset.data,
        backgroundColor: dataset.colors.map((color) =>
          addAlphaToRGB(color, this.options.filled ? 1 : 0.2)
        ),
        borderColor: dataset.colors,
        borderWidth: this.options.borderWidth ?? 1,
        borderRadius: this.options.borderRadius ?? 0,
      };
    });
    return result;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "doughnut-chart": DoughnutChart;
  }
}
