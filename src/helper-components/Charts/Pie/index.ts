import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import Chart from "chart.js/auto";

import style from "./index.css?inline";
import { converter } from "../../../functions";
import { CompleteChartData } from "../../../interfaces";
import {
  getBackgroundColor,
  getBorderColor,
  getContext,
  getData,
  getLabels,
} from "../functions";

@customElement("pie-chart")
export class PieChart extends LitElement {
  @property({ type: "ChartData", converter })
  data: CompleteChartData = {};

  @property({ type: String, converter })
  lable = "";

  @property({ type: Boolean, converter })
  filled = false;

  @state()
  chart: Chart<"pie", number[], string> | undefined = undefined;

  render() {
    return html`<canvas id="chart-canvas" />`;
  }

  updated(): void {
    if (!this.chart) return;
    this.chart.data.labels = getLabels(this.data);
    this.chart.data.datasets.forEach((dataset) => {
      dataset.label = this.lable;
      dataset.data = getData(this.data);
      dataset.backgroundColor = getBackgroundColor(this.data, this.filled);
      dataset.borderColor = getBorderColor(this.data);
    });
    this.chart.update();
  }

  firstUpdated() {
    const ctx = getContext(this);
    this.chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: getLabels(this.data),
        datasets: [
          {
            label: this.lable,
            data: getData(this.data),
            backgroundColor: getBackgroundColor(this.data, this.filled),
            borderColor: getBorderColor(this.data),
            borderWidth: 1,
          },
        ],
      },
    });
  }

  static styles = unsafeCSS(style);
}

declare global {
  interface HTMLElementTagNameMap {
    "pie-chart": PieChart;
  }
}
