import { PropertyValueMap, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { DatasetInput } from "./helper-components/DatasetInput/DatasetInput";
import { TeacherOptions } from "./helper-components/TeacherOptions";
import { ChartSettings } from "./helper-components/ChartSettings";
import { ScatterDatasetInput } from "./helper-components/ScatterDatasetInput/ScatterDatasetInput";
import "@shoelace-style/shoelace/dist/themes/light.css";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js";

import style from "./widget.style";
import "./index.css";

import {
  ChartType,
  getChart,
  getOptionsDefinition,
} from "./helper-components/Charts/imports";

import { SharedTestStateMixin } from "./state";
import { LitElementWw } from "@webwriter/lit";
import { BarChart } from "./helper-components/Charts/Bar/chart";
import { DoughnutChart } from "./helper-components/Charts/Doughnut/chart";
import { LineChart } from "./helper-components/Charts/Line/chart";
import { PieChart } from "./helper-components/Charts/Pie/chart";
import { PolarChart } from "./helper-components/Charts/PolarArea/chart";
import { RadarChart } from "./helper-components/Charts/Radar/chart";
import { ScatterplotChart } from "./helper-components/Charts/Scatterplot/scatterplot";
import SlTabGroup from "@shoelace-style/shoelace/dist/components/tab-group/tab-group.component.js";
import SlTab from "@shoelace-style/shoelace/dist/components/tab/tab.component.js";

@customElement("webwriter-chart")
export class WwChart extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  protected lit_sm_storage: string = "lit_sm_storage";

  /**WebWriter API: If true, render the component such that easy printing is possible. */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor printable: boolean;

  /**WebWriter API: If true, emit DOM events enriched with xAPI statements. */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor analyzable: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor editable: boolean;

  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showChart: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showData: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showTeacherOptions: boolean;
  // TODO: Convert to image
  // TODO: printable option (delete?)
  // TODO: Focus on the chart element when it is clicked
  // TODO: Button show Data and show Chart wechseln when clicked
  /*@click=${() => {
    this.requestUpdate();
    this.chartElement.focus();
  }}*/
  //@query("wwci-dataset-input") private datasetInput!: Select;
  //@query("#chart") private chartElement!: HTMLElement;
  tabIndex: number;
  connectedCallback() {
    this.tabIndex = -1;
    super.connectedCallback();
    this.getAttributeNames().forEach((n) =>
      this.setAttribute(n, this.getAttribute(n))
    );

    const storedState = this.getAttribute("lit_sm_storage");
    if (storedState) {
      try {
        this.sharedState = JSON.parse(storedState);
      } finally {
      }
    }
  }

  @property()
  accessor options: any = {};

  @state()
  accessor lastChartType: ChartType = this.sharedState.chart.selectedType;

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    //this.addEventListener("click", (ev) => this.focus());
    this.initializeDefaultOptions();
  }

  initializeDefaultOptions() {
    this.showChart = true;
    this.showData = false;
    this.showTeacherOptions = false;
    this.editable = true;
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

  changeShowData() {
    this.showData = !this.showData;
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
    /*
    <div
        part="options"
        id="settings"
        style=${this.isContentEditable ? "" : "display: none;"}
      >
        <div id="settings-wrapper">
          <h2>Setting</h2>
          <!-- <sl-checkbox
            id="Editable"
            ?checked=${this.sharedState.editable}
            @sl-change=${() => {
            this.editable = !this.editable;
            this.sharedState.editable = this.editable;
          }}
            >Editable</sl-checkbox
          > -->
          <wwci-chart-settings style="display: contents;"></wwci-chart-settings>
        </div>
      </div>
    */

    return html` <div
      id="main"
      class=${this.sharedState.printable ||
      (!this.sharedState.editable &&
        !this.sharedState.teacherOptions.showOptions)
        ? "print"
        : ""}
    >
      <!-- <div id="button-group"> -->
      <sl-tab-group>
        <sl-tab
          slot="nav"
          panel="chart"
          @click=${() => {
            this.showChart = true;
            this.showData = false;
            this.showTeacherOptions = false;
          }}
          .active=${this.showChart}
          >Show Chart</sl-tab
        >
        <sl-tab
          slot="nav"
          panel="data"
          @click=${() => {
            this.changeShowData();
            this.showTeacherOptions = false;
          }}
          >Show Data</sl-tab
        >
        <sl-tab
          slot="nav"
          panel="teacher-options"
          ?disabled=${!this.isContentEditable}
          @click=${() => {
            this.changeShowTeacherOptions();
            this.showData = false;
          }}
          >Teacher Options</sl-tab
        >
      </sl-tab-group>
      <!-- </div> -->
      ${this.showData &&
      (this.sharedState.editable || this.sharedState.teacherOptions.showData)
        ? html`<div id="data-panel">
            ${this.sharedState.chart.selectedType === "Scatterplot"
              ? html`<wwci-scatterdataset-input></wwci-scatterdataset-input>`
              : html`<wwci-dataset-input></wwci-dataset-input>`}
          </div>`
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
      "wwci-teacher-options": TeacherOptions,
      "wwci-dataset-input": DatasetInput,
      "wwci-chart-settings": ChartSettings,
      "bar-chart": BarChart,
      "doughnut-chart": DoughnutChart,
      "line-chart": LineChart,
      "pie-chart": PieChart,
      "polar-chart": PolarChart,
      "radar-chart": RadarChart,
      "scatterplot-chart": ScatterplotChart,
      "wwci-scatterdataset-input": ScatterDatasetInput,
      "sl-tab-group": SlTabGroup,
      "sl-tab": SlTab,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "webwriter-chart": WwChart;
  }
}
