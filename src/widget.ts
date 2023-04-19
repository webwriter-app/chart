import { LitElement, html, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import "./helper-components/BarChart";

// import Chart from "chart.js/auto";

import style from "./widget.css?inline";
import "./index.css";
import { attribute } from "./functions";
import { ChartData } from "./interfaces";

@customElement("ww-chart")
export class WwChart extends LitElement {
  render() {
    const completeData: ChartData = {
      Red: {
        value: 12,
        color: "#FF6384",
        label: "Red",
      },
      Blue: {
        value: 19,
        color: "#36A2EB",
        label: "Blue",
      },
      Free: {
        value: 8,
        color: "#FFCE56",
        label: "Free",
      },
      Green: {
        value: 5,
        color: "#4BC0C0",
        label: "Green",
      },
      Purple: {
        value: 20,
        color: "#9966FF",
        label: "Purple",
      },
      Orange: {
        value: 13,
        color: "rgb(255, 159, 64)",
        label: "Orange",
      },
    };

    return html`<bar-chart
      type="doughnut"
      data="${attribute(completeData)}"
      lable="# of Votes"
      filled="false"
    />`;
  }

  static styles = unsafeCSS(style);
}

declare global {
  interface HTMLElementTagNameMap {
    "ww-chart": WwChart;
  }
}
