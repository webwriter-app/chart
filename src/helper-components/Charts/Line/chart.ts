import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { fillArray } from "../../../functions";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";

@customElement("line-chart")
export class LineChart extends GenericChart<typeof OptionDefinition> {
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
    | ChartHelper<Chart<"line", number[], string>>
    | undefined;

  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(
      this.sharedState.chart.options.smoothTheLine as boolean
    );
    this.chartHelper.setYScales(
      this.sharedState.chart.options.dynamicSize as boolean,
      this.sharedState.chart.options.scaleMin as number,
      this.sharedState.chart.options.scaleMax as number,
      this.sharedState.chart.options.scaleStepSize as number
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
      options: {},
    });

    //@ts-ignore
    this.chartHelper = ChartHelper.create("line", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(
      this.sharedState.chart.options.smoothTheLine as boolean
    );
    this.chartHelper.setYScales(
      this.sharedState.chart.options.dynamicSize as boolean,
      this.sharedState.chart.options.scaleMin as number,
      this.sharedState.chart.options.scaleMax as number,
      this.sharedState.chart.options.scaleStepSize as number
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
        backgroundColor: this.sharedState.chart.options.pointColors
          ? dataset.colors
          : fillArray(dataset.colors.length, dataset.color),
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
    "line-chart": LineChart;
  }
}
