import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import {
  addAlphaToRGB,
  convertHexToRGB,
  converter,
  isColorHex,
} from "../../functions";

import { getContext } from "./functions";
import { ChartOptions, Dataset } from "../../interfaces";

@customElement("bar-chart")
export class BarChart extends LitElement {
  @property({ type: Array, converter })
  datasets: Dataset[] = [];

  @property({ type: String })
  label = "";

  @property({ type: Object, converter })
  options: ChartOptions = {};

  @state()
  chart: Chart | undefined = undefined;

  render() {
    return html`<canvas id="chart-canvas"></canvas>`;
  }

  updated(): void {
    if (!this.chart) return;
    if (this.chart.options.plugins?.title)
      this.chart.options.plugins.title.text = this.label;

    this.chart.options.scales = {
      y: {
        beginAtZero: this.options.dynamicSize,
        min: this.options.dynamicSize ? undefined : this.options.scaleMin,
        max: this.options.dynamicSize ? undefined : this.options.scaleMax,
      },
    };
    this.chart.data.labels = this.getLables();

    const datasets = this.prepareDataset();
    this.chart.data.datasets.forEach((dataset, i) => {
      console.log({ ds: datasets[i] });
      dataset.label = datasets[i].label;
      dataset.data = datasets[i].data;
      dataset.backgroundColor = datasets[i].backgroundColor;
      dataset.borderColor = datasets[i].borderColor;
      dataset.borderWidth = datasets[i].borderWidth;
      console.log({ ds: datasets[i] });
      //@ts-ignore
      dataset.borderRadius = datasets[i].borderRadius;
      //@ts-ignore
      dataset.borderSkipped = datasets[i].borderSkipped;
    });
    this.chart.update();
  }

  firstUpdated() {
    console.log(this.getLables());
    const datasets = this.prepareDataset();
    const ctx = getContext(this);
    this.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: this.getLables(),
        datasets: datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: this.options.dynamicSize,
            min: this.options.dynamicSize ? undefined : this.options.scaleMin,
            max: this.options.dynamicSize ? undefined : this.options.scaleMax,
          },
        },
        plugins: {
          title: {
            display: this.label !== "",
            text: this.label,
          },
        },
      },
    });
  }

  getLables(): string[] {
    return [...new Set(this.datasets.map((dataset) => dataset.labels).flat())];
  }

  prepareDataset() {
    const result = this.datasets.map((dataset) => {
      const colors = dataset.colors.map((c) =>
        isColorHex(c) ? convertHexToRGB(c) : c
      );
      console.log({ options: this.options });
      return {
        label: dataset.label,
        data: [...dataset.data],
        backgroundColor: colors.map((c: any) =>
          addAlphaToRGB(c, this.options.filled ? 1 : 0.2)
        ),
        borderColor: colors.map((c: any) => addAlphaToRGB(c, 1)),
        borderWidth: this.options.borderWidth || 1,
        borderRadius: this.options.borderRadius || 0,
        borderSkipped: false,
      };
    });
    console.log(result);
    return result;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bar-chart": BarChart;
  }
}
