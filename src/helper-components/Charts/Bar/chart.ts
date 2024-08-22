import { customElement, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import { ChartHelper, getContext, updateData } from "../functions";
import { GenericChart } from "../GenericChart";
import { OptionDefinition } from "./definition";
import { addAlphaToRGB } from "../../../functions";

@customElement("bar-chart")
export class BarChart extends GenericChart<typeof OptionDefinition> {
  constructor() {
    super(OptionDefinition);
  }

  @state()
  accessor chartHelper: ChartHelper<Chart<"bar", number[], string>> | undefined;

  updated(): void {
    if (!this.chartHelper) return;

    const datasets = this.prepareDataset();

    this.chartHelper.setTitle(this.label);

    this.chartHelper.setYScales(
      this.options.dynamicSize,
      this.options.scaleMin,
      this.options.scaleMax,
      this.options.scaleStepSize
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
    });

    this.chartHelper = new ChartHelper("bar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setYScales(
      this.options.dynamicSize,
      this.options.scaleMin,
      this.options.scaleMax,
      this.options.scaleStepSize
    );
    this.chartHelper.setHideExactValues(this.hide_excat_values);

    //@ts-ignore
    window.chart = this.chartHelper;

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
        backgroundColor: this.options.individualColors
          ? dataset.colors.map((color) =>
              addAlphaToRGB(color, this.options.filled ? 1 : 0.2)
            )
          : dataset.colors.map(() =>
              addAlphaToRGB(dataset.color, this.options.filled ? 1 : 0.2)
            ),
        borderColor: this.options.individualColors
          ? dataset.colors.map((color) => color)
          : dataset.colors.map(() => dataset.color),
        borderWidth: this.options.borderWidth ?? 1,
        borderRadius: this.options.borderRadius ?? 0,
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
