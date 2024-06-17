import { LitElement, PropertyValueMap, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "./helper-components/Select";
import "./helper-components/DatasetInput/DatasetInput";
import "./helper-components/Switch";
import "./helper-components/ChartOptions";
import "./helper-components/TeacherOptions";
import "./helper-components/ChartSettings";
import "./helper-components/ScatterplotDatasetInput/ScatterplotDatasetInput";

import "@shoelace-style/shoelace/dist/themes/light.css";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

setBasePath(
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.4.0/dist/"
);

import style from "./widget.style";
import "./index.css";

import {
  ChartType,
  getChart,
  getOptionsDefinition,
} from "./helper-components/Charts/imports";

import { SharedTestStateMixin } from "./state";

@customElement("webwriter-chart")
export class WwChart extends SharedTestStateMixin(LitElement) {
  //TODO: extends (SharedTestStateMixin(LitElementWw) as unknown as LitElementWw & ReturnType<SharedTestStateMixin>)
  /**WebWriter API: If true, render the component such that easy printing is possible. */
  @property({ type: Boolean, attribute: true, reflect: true })
  printable: boolean;

  /**WebWriter API: If true, allow user interaction to change the component. */
  @property({ type: Boolean, attribute: true, reflect: true })
  editable: boolean;

  /**WebWriter API: If true, emit DOM events enriched with xAPI statements. */
  @property({ type: Boolean, attribute: true, reflect: true })
  analyzable: boolean;

  @property({ type: Boolean, attribute: true, reflect: true })
  showChart: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  showData: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  showOptions: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  showTeacherOptions: boolean;
  // TODO: Convert to image
  // TODO: printable option (delete?)
  // TODO: Focus on the chart element when it is clicked
  //TODO: Button show Data and show Chart wechseln when clicked
  /*@click=${() => {
    this.requestUpdate();
    this.chartElement.focus();
  }}*/
  //@query("wwci-dataset-input") private datasetInput!: Select;
  //@query("#chart") private chartElement!: HTMLElement;

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
    //this.addEventListener("click", (ev) => this.focus());
    this.initializeDefaultOptions();
  }

  initializeDefaultOptions() {
    this.editable = true;
    this.showChart = true;
    this.showData = false;
    this.showOptions = false;
    this.showTeacherOptions = false;
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
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  changeShowData() {
    this.showData = !this.showData;
  }
  changeShowOption() {
    this.showOptions = !this.showOptions;
  }
  changeShowTeacherOptions() {
    this.showTeacherOptions = !this.showTeacherOptions;
  }

  render() {
    this.sharedState.editable = this.editable;
    this.sharedState.printable = this.printable;

    this.sharedState.chart.optionDefinition = getOptionsDefinition(
      this.sharedState.chart.selectedType
    );

    return html`<div id="settings" part="options">
        <h2>Setting</h2>
        <div id="settings-panel">
          <sl-checkbox
            .checked=${this.editable}
            @sl-change=${(e: any) => {
              this.editable = e.target.checked;
              this.sharedState.editable = e.target.checked;
            }}
            >Editable</sl-checkbox
          >
          <wwci-chart-settings style="display: contents;"></wwci-chart-settings>
        </div>
      </div>
      <div
        id="main"
        class=${this.sharedState.printable ||
        (!this.sharedState.editable &&
          !this.sharedState.teacherOptions.showOptions)
          ? "print"
          : ""}
      >
        <div id="button-group">
          <sl-button
            @click=${() => {
              this.showChart = true;
              this.showData = false;
              this.showOptions = false;
              this.showTeacherOptions = false;
            }}
            >Show Chart</sl-button
          >
          <sl-button
            @click=${() => {
              this.changeShowOption();
              this.showData = false;
              this.showTeacherOptions = false;
            }}
            ?disabled=${this.editable
              ? false
              : !this.sharedState.teacherOptions.showOptions}
            >Chart Options</sl-button
          >
          <sl-button
            @click=${() => {
              this.changeShowData();
              this.showOptions = false;
              this.showTeacherOptions = false;
            }}
            ?disabled=${this.editable
              ? false
              : !this.sharedState.teacherOptions.showData}
            >Show Data</sl-button
          >
          <sl-button
            @click=${() => {
              this.changeShowTeacherOptions();
              this.showOptions = false;
              this.showData = false;
            }}
            ?disabled=${!this.editable}
            >Teacher Options</sl-button
          >
        </div>
        ${this.showData &&
        (this.sharedState.editable || this.sharedState.teacherOptions.showData)
          ? html` <div id="data-panel">
              ${this.sharedState.chart.selectedType === "Scatterplot"
                ? html`<wwci-datasetscatterplot-input></wwci-datasetscatterplot-input>`
                : html`<wwci-dataset-input></wwci-dataset-input>`}
            </div>`
          : this.showOptions &&
            (this.sharedState.editable ||
              (this.sharedState.teacherOptions.showOptions &&
                !this.sharedState.printable))
          ? html`
              <div id="options-panel">
                <h2 style="grid-column: 1/ span 4;">OPTIONS:</h2>
                <wwci-chart-options
                  style="display: contents;"
                ></wwci-chart-options>

                <div
                  style="grid-column: 1/span 4; display: grid; grid-template-columns: 1fr 1fr;  grid-column-gap: 1rem;"
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
                </div>
              </div>
            `
          : this.showTeacherOptions && this.sharedState.editable
          ? html`<div id="teacher-options-panel">
              <wwci-teacher-options
                style="display: contents;"
              ></wwci-teacher-options>
            </div>`
          : html` <div id="display-chart">
              ${getChart(
                this.sharedState.chart.selectedType,
                this.sharedState.chart.datasets,
                this.sharedState.chart.title,
                this.sharedState.chart.options,
                this.sharedState.teacherOptions
              )}
            </div>`}
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

  static styles = style;
  public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-switch": SlSwitch,
      "sl-input": SlInput,
      "sl-checkbox": SlCheckbox,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "webwriter-chart": WwChart;
  }
}
