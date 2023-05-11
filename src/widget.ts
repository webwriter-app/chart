import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import "./helper-components/Charts/Bar";

import "./helper-components/Select";
import "./helper-components/DatasetInput";
import "./helper-components/Switch";
import "./helper-components/ChartOptions";

import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/components/switch/switch";
import "@shoelace-style/shoelace/dist/components/input/input";

import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

// Set the base path to the folder you copied Shoelace's assets to
setBasePath(
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.4.0/dist/"
);

import style from "./widget.css?inline";
import "./index.css";
import { attribute } from "./functions";
import { ChartOptions, Dataset } from "./interfaces";

const avaliableCharts: string[] = ["Bar", "Doughnut"];

@customElement("ww-chart")
export class WwChart extends LitElement {
  @property({ type: Boolean }) filled = false;

  @property()
  selectedChart = "Bar";

  @property()
  datasets: Dataset[] = [
    {
      label: "My First Dataset",
      labels: ["Red", "Blue", "Free", "Green", "Purple", "Orange"],
      data: [12, 19, 8, 5, 20, 13],
      colors: [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "rgb(255, 159, 64)",
      ],
    },
  ];

  @property()
  title = "My fancy chart";

  @property()
  options: ChartOptions = {
    borderRadius: 0,
    borderWidth: 1,
    horizontal: false,
    filled: false,
    dynamicSize: true,
    scaleMin: 0,
    scaleMax: 100,
  };

  render() {
    return html`<div id="main">
      <div id="preview-area">
        <bar-chart
          datasets="${attribute(this.datasets)}"
          style="display: flex; widht: 100%; height: 100%;"
          label=${this.title}
          options="${attribute(this.options)}"
        />
      </div>
      <aside id="options-panel">
        <div>
          <h2>OPTIONS</h2>
          <wwci-select
            value="${this.selectedChart}"
            label="Chart"
            options="${attribute(avaliableCharts)}"
            @wwci-change="${this.updateSelectedChart}"
          >
          </wwci-select>
          <sl-input
            label="Title"
            value=${this.title}
            @sl-input=${(e: any) => {
              this.title = e.target.value;
            }}
          ></sl-input>
          <wwci-chart-options
            options=${attribute(this.options)}
            @wwci-chart-options=${(e: CustomEvent) => {
              this.options = e.detail.value;
            }}
          ></wwci-chart-options>
        </div>
      </aside>

      <div id="data-panel">
        <wwci-dataset-input
          dimensions_fixed="${attribute(false)}"
          add_datasets="${attribute(true)}"
          datasets=${attribute(this.datasets)}
          @wwci-change="${this.updateData}"
        >
        </wwci-dataset-input>
      </div>
    </div>`;
  }

  updateData(e: CustomEvent) {
    this.datasets = e.detail.value;
    console.log({ datasets: this.datasets });
  }

  updateSelectedChart(e: CustomEvent) {
    this.selectedChart = e.detail.value;
  }

  changeFill() {
    this.filled = !this.filled;
  }

  static styles = unsafeCSS(style);
}

declare global {
  interface HTMLElementTagNameMap {
    "ww-chart": WwChart;
  }
}
