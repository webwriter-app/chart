import { LitElement, PropertyValueMap, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "./helper-components/Select";
import "./helper-components/DatasetInput/DatasetInput";
import "./helper-components/Switch";
import "./helper-components/ChartOptions";
import "./helper-components/TeacherOptions";

import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/components/switch/switch.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";

import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

setBasePath(
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.4.0/dist/"
);

import style from "./widget.css?inline";
import "./index.css";

import {
  ChartType,
  getChart,
  getOptionsDefinition,
} from "./helper-components/Charts/imports";

import { SharedTestStateMixin } from "./state";

@customElement("ww-chart")
export class WwChart extends SharedTestStateMixin(LitElement) {
  /**WebWriter API: If true, render the component such that easy printing is possible. */
  @property({ type: Boolean, attribute: true, reflect: true })
  printable: boolean;

  /**WebWriter API: If true, allow user interaction to change the component. */
  @property({ type: Boolean, attribute: true, reflect: true })
  editable: boolean;

  /**WebWriter API: If true, emit DOM events enriched with xAPI statements. */
  @property({ type: Boolean, attribute: true, reflect: true })
  analyzable: boolean;

  connectedCallback() {
    super.connectedCallback();
    this.getAttributeNames().forEach((n) =>
      this.setAttribute(n, this.getAttribute(n))
    );
  }

  @property()
  options: any = {};

  @state()
  lastChartType: ChartType = this.sharedState.chart.selectedType;

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.initializeDefaultOptions();
  }

  initializeDefaultOptions() {
    this.sharedState.chart.options = Object.entries(
      this.sharedState.chart.optionDefinition
    ).reduce((acc, [key, value]) => {
      if (acc[key] === undefined || acc[key] === null) acc[key] = value.default;
      return acc;
    }, {} as any);
    this.sharedState.chart.optionsLocked = Object.keys(
      this.sharedState.chart.optionDefinition
    ).reduce(
      (acc, key) => {
        if (acc[key] === undefined || acc[key] === null) acc[key] = false;
        return acc;
      },
      { chartType: false, title: false } as any
    );
  }

  render() {
    this.sharedState.editable = this.editable;
    this.sharedState.printable = this.printable;

    this.sharedState.chart.optionDefinition = getOptionsDefinition(
      this.sharedState.chart.selectedType
    );

    return html`<div
      id="main"
      class=${this.sharedState.printable ||
      (!this.sharedState.editable &&
        !this.sharedState.teacherOptions.showOptions)
        ? "print"
        : ""}
    >
      <div id="preview-panel" style="grid-area: preview; position: relative;">
        ${getChart(
          this.sharedState.chart.selectedType,
          this.sharedState.chart.datasets,
          this.sharedState.chart.title,
          this.sharedState.chart.options,
          this.sharedState.teacherOptions
        )}
      </div>

      <aside id="options-panel">
        ${this.editable ||
        (this.sharedState.teacherOptions.showOptions && !this.printable)
          ? html`<h2 style="grid-column: 1/span 3;">OPTIONS:</h2>
              <wwci-chart-options
                style="display: contents;"
              ></wwci-chart-options>

              <div
                style="grid-column: 1/span 3; display: grid; grid-template-columns: 1fr 1fr;  grid-column-gap: 1rem;"
              >
                <sl-button
                  @click=${() => {
                    const mainDiv = this.shadowRoot?.getElementById("main");
                    if (!mainDiv) return;
                    mainDiv.innerHTML =
                      "<img src=" +
                      this.shadowRoot
                        ?.getElementById("chart")
                        //@ts-ignore
                        ?.exportCanvasContent() +
                      ">";
                  }}
                  >convert to image</sl-button
                >
                <sl-button
                  @click=${() => {
                    const link = document.createElement("a");
                    link.href = this.shadowRoot
                      ?.getElementById("chart")
                      //@ts-ignore
                      ?.exportCanvasContent();
                    link.download = "canvas_image.png";
                    link.click();
                  }}
                  >download image</sl-button
                >
              </div>`
          : ""}
      </aside>
      ${this.editable
        ? html`<aside id="teacher-options-panel">
            <wwci-teacher-options
              style="display: contents;"
            ></wwci-teacher-options>
          </aside>`
        : html``}
      ${this.editable || this.sharedState.teacherOptions.showData
        ? html`<div id="data-panel" style="grid-area: data;">
            <wwci-dataset-input> </wwci-dataset-input>
          </div>`
        : ""}
    </div>`;
  }

  updateData(e: CustomEvent) {
    this.sharedState.chart.datasets = e.detail.value;
  }

  updateSelectedChart(e: CustomEvent) {
    this.sharedState.chart.selectedType = e.detail.value;
  }

  changeFill() {
    this.sharedState.chart.filled = !this.sharedState.chart.filled;
  }

  static styles = unsafeCSS(style);
}

declare global {
  interface HTMLElementTagNameMap {
    "ww-chart": WwChart;
  }
}
