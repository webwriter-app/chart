import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";
import { addAlphaToRGB } from "../../../functions";

@customElement("bar-chart")
export class BarChart extends GenericChart<typeof OptionDefinition> {
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
  accessor chartHelper: ChartHelper<Chart<"bar", number[], string>> | undefined;

  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);

    this.chartHelper.setYScales(
      this.sharedState.chart.options.dynamicSize as boolean,
      this.sharedState.chart.options.scaleMin as number,
      this.sharedState.chart.options.scaleMax as number,
      this.sharedState.chart.options.scaleStepSize as number
    );

    this.chartHelper.setHideExactValues(this.hide_excat_values);

    this.chartHelper.setXLabels(this.datasets.labels);

    updateData(datasets, this.chartHelper.chart.data.datasets);

    this.chartHelper.update();
  }

  firstUpdated() {
    const datasets = this.prepareDataset();
    const ctx = getContext(this);

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: this.datasets.labels,
        datasets: datasets,
      },
      options: {},
    });

    this.chartHelper = ChartHelper.create("bar", chart);
    if (!this.chartHelper) return;
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setYScales(
      this.sharedState.chart.options.dynamicSize as boolean,
      this.sharedState.chart.options.scaleMin as number,
      this.sharedState.chart.options.scaleMax as number,
      this.sharedState.chart.options.scaleStepSize as number
    );
    this.chartHelper.setHideExactValues(this.hide_excat_values);

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
        backgroundColor: this.sharedState.chart.options.individualColors
          ? dataset.colors.map((color) =>
              addAlphaToRGB(
                color,
                this.sharedState.chart.options.filled ? 1 : 0.2
              )
            )
          : dataset.colors.map(() =>
              addAlphaToRGB(
                dataset.color,
                this.sharedState.chart.options.filled ? 1 : 0.2
              )
            ),
        borderColor: this.sharedState.chart.options.individualColors
          ? dataset.colors.map((color) => color)
          : dataset.colors.map(() => dataset.color),
        borderWidth: Number(this.sharedState.chart.options.borderWidth ?? 1),
        borderRadius: Number(this.sharedState.chart.options.borderRadius ?? 0),
      };
    });
    return result;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bar-chart": BarChart;
  }
}
