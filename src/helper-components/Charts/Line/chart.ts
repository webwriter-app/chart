import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { fillArray } from "../../../functions";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";

@customElement("line-chart")
export class LineChart extends GenericChart<typeof OptionDefinition> {
  constructor() {
    super(OptionDefinition);
  }

  @state()
  chartHelper: ChartHelper<Chart<"line", number[], string>> | undefined;

  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(this.options.smoothTheLine);
    this.chartHelper.setYScales(
      this.options.dynamicSize,
      this.options.scaleMin,
      this.options.scaleMax,
      this.options.scaleStepSize
    );
    this.chartHelper.setXLabels(this.datasets.labels);
    updateData(datasets, this.chartHelper.chart.data.datasets);

    this.chartHelper.update();
  }

  firstUpdated() {
    const datasets = this.prepareDataset();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.datasets.labels,
        datasets: datasets,
      },
    });

    //@ts-ignore
    this.chartHelper = new ChartHelper("line", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(this.options.smoothTheLine);
    this.chartHelper.setYScales(
      this.options.dynamicSize,
      this.options.scaleMin,
      this.options.scaleMax,
      this.options.scaleStepSize
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
        backgroundColor: this.options.pointColors
          ? dataset.colors
          : fillArray(dataset.colors.length, dataset.color),
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
    "line-chart": LineChart;
  }
}
