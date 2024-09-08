import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { addAlphaToRGB } from "../../../functions";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";

@customElement("radar-chart")
export class RadarChart extends GenericChart<typeof OptionDefinition> {
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

  @state()
  accessor chartHelper:
    | ChartHelper<Chart<"radar", number[], string>>
    | undefined;

  //TODO: This is exactly the same as in Doughnut.ts
  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(
      this.sharedState.chart.options.smoothTheLine as boolean
    );

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
      options: {},
    });

    this.chartHelper = ChartHelper.create("radar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(
      this.sharedState.chart.options.smoothTheLine as boolean
    );

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
        backgroundColor: this.sharedState.chart.options.fill
          ? dataset.colors.map(() => dataset.color)
          : dataset.colors.map(() => addAlphaToRGB(dataset.color, 0.2)),

        pointBackgroundColor: this.sharedState.chart.options.pointColors
          ? dataset.colors
          : dataset.colors.map(() => dataset.color),

        borderColor: dataset.color,

        borderWidth: Number(this.sharedState.chart.options.borderWidth ?? 1),

        pointBorderColor: "transparent",
        pointRadius: Number(this.sharedState.chart.options.pointRadius ?? 0),
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
