import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";
import { addAlphaToRGB } from "../../../functions";

@customElement("pie-chart")
export class PieChart extends GenericChart<typeof OptionDefinition> {
  constructor() {
    super(OptionDefinition);
  }

  @state()
  chartHelper: ChartHelper<Chart<"pie", number[], string>> | undefined;

  //TODO: This is exactly the same as in Doughnut.ts
  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);

    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(datasets, this.chartHelper.chart.data.datasets);

    this.chartHelper.update();
  }

  //TODO: besides the "pie", its exactly the same as in Doughnut.ts
  firstUpdated() {
    const datasets = this.prepareDataset();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: this.datasets.labels,
        datasets: datasets,
      },
    });

    this.chartHelper = new ChartHelper("pie", chart);
    this.chartHelper.setTitle(this.label);

    this.chartHelper.update();
  }

  //TODO: This is exactly the same as in Doughnut.ts
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
    "pie-chart": PieChart;
  }
}
