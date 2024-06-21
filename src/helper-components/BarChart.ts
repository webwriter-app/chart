import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import style from "./barchart.style";
import Chart from "chart.js/auto";

import { addAlphaToRGB, converter } from "../functions";
import { ChartType, CompleteChartData } from "../interfaces";
import { LitElementWw } from "@webwriter/lit";

@customElement("bar-chart")
export class BarChart extends LitElementWw {
  @property({ type: "ChartData", converter })
  data: CompleteChartData = {};

  @property({ type: String })
  type: ChartType = "bar";

  @property({ type: String })
  label = "";

  @property({ type: Boolean, converter })
  filled = false;

  render() {
    console.log({ data: this.data, filled: this.filled });
    return html`<canvas id="myChart" />`;
  }

  firstUpdated() {
    const values = Object.values(this.data).map((val) => val.value);
    const backgroundColor = Object.values(this.data).map((val) =>
      addAlphaToRGB(val.color, this.filled ? 1 : 0.2)
    );
    const borderColor = Object.values(this.data).map((val) =>
      addAlphaToRGB(val.color, 1)
    );

    if (this.type === "line") {
      backgroundColor.length = 1;
      borderColor.length = 1;
    }

    let options: any = {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    if (
      this.type === "pie" ||
      this.type === "doughnut" ||
      this.type === "polarArea"
    )
      options = {};

    const canvas = (this.shadowRoot?.getElementById("myChart") ||
      null) as HTMLCanvasElement | null;
    if (!canvas) return console.error("No canvas found");
    const ctx = canvas.getContext("2d");
    if (!ctx) return console.error("No context found");
    new Chart(ctx, {
      type: this.type,
      data: {
        labels: Object.values(this.data).map((val) => val.label),
        datasets: [
          {
            label: this.label,
            data: values,
            backgroundColor,
            borderColor,
            borderWidth: 1,
          },
        ],
      },
      options,
    });
  }
  static styles = style;
}
