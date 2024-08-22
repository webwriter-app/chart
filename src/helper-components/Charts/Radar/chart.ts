import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { addAlphaToRGB } from "../../../functions";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";

@customElement("radar-chart")
export class RadarChart extends GenericChart<typeof OptionDefinition> {
  constructor() {
    super(OptionDefinition);
  }

  @state()
  accessor chartHelper:
    | ChartHelper<Chart<"radar", number[], string>>
    | undefined;

  //TODO: This is exactly the same as in Doughnut.ts
  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(this.options.smoothTheLine);

    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(datasets, this.chartHelper.chart.data.datasets);

    this.chartHelper.update();
  }
  //TODO: besides the "radar", its exactly the same as in Doughnut.ts
  firstUpdated() {
    const datasets = this.prepareDataset();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: this.datasets.labels,
        datasets: datasets,
      },
    });

    this.chartHelper = new ChartHelper("radar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(this.options.smoothTheLine);

    this.chartHelper.update();
  }

  prepareDataset(): {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string;
    pointBorderColor: string;
    borderWidth: number;
    pointRadius: number;
  }[] {
    const result = this.datasets.sets.map((dataset) => {
      return {
        label: dataset.name,
        data: dataset.data,
        backgroundColor: this.options.fill
          ? dataset.colors.map(() => dataset.color)
          : dataset.colors.map(() => addAlphaToRGB(dataset.color, 0.2)),

        pointBackgroundColor: this.options.pointColors
          ? dataset.colors
          : dataset.colors.map(() => dataset.color),

        borderColor: dataset.color,

        borderWidth: this.options.borderWidth ?? 1,

        pointBorderColor: "transparent",
        pointRadius: this.options.pointRadius,
      };
    });
    return result;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "radar-chart": RadarChart;
  }
}
