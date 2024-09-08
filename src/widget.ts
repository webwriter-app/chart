import { PropertyValueMap, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { DatasetInput } from "./helper-components/DatasetInput/DatasetInput";
import { Settings } from "./helper-components/Settings";
import { ScatterDatasetInput } from "./helper-components/ScatterDatasetInput/ScatterDatasetInput";
import "@shoelace-style/shoelace/dist/themes/light.css";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.component.js";

import style from "./widget.style";
import "./index.css";

import {
  ChartType,
  getChart,
  getOptionsDefinition,
} from "./helper-components/Charts/imports";

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
import { ChartState } from "./interfaces";

@customElement("webwriter-chart")
export class WwChart extends LitElementWw {
  constructor() {
    super();
    console.log("Constructor: webwriter-chart created");
  }

  @property({ type: Object, attribute: true, reflect: true })
  accessor sharedState: ChartState = {
    teacherOptions: {
      showOptions: true,
      showData: true,
      showLockedOptions: true,
      changeData: true,
      changeOptions: true,
      addRemoveData: true,
    },
    lineDatasets: {
      sets: [],
    },
    scatterDatasets: {
      sets: [],
      selected: {
        axis: {
          x: "None",
          y: "None",
        },
        dataset_indexes: [],
      },
    },

    regressionType: "none",
    chart: {
      selectedType: "Scatterplot",
      title: "My fancy Chart",
      datasets: {
        labels: ["Red", "Blue", "Free", "Green", "Purple", "Orange"],
        sets: [
          {
            name: "My First Dataset",
            color: "#ff00d0",
            colors: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "rgb(255, 159, 64)",
            ],
            data: [12, 19, 8, 5, 20, 13],
          },
        ],
      },
      options: {},
      optionsLocked: {},
      optionDefinition: {},
    },
    editable: true,
    printable: true,
  };

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

  // TODO: Convert to image
  // TODO: printable option (delete?)
  // TODO: Focus on the chart element when it is clicked
  // TODO: Button show Data and show Chart wechseln when clicked

  @state()
  accessor lastChartType: ChartType = this.sharedState.chart.selectedType;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showErrorMessage = false;

  connectedCallback(): void {
    super.connectedCallback();
    console.log("Adding event listener for wwci-state-change");
    this.addEventListener("wwci-state-change", (e: CustomEvent) => {
      console.log("Received state change event:", e.detail.state);
      this.onStateChange(e);
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log("Removing event listener for wwci-state-change");
    this.removeEventListener("wwci-state-change", this.onStateChange);
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    //this.addEventListener("click", (ev) => this.focus());
    this.initializeDefaultOptions();
    this.tabIndex = -1;
  }

  initializeDefaultOptions() {
    this.showChart = true;
    this.showData = false;
    this.editable = true;
  }

  changeShowData() {
    this.showData = !this.showData;
  }

  protected onStateChange(e: CustomEvent) {
    if (!e.detail || !e.detail.state) {
      console.log("No state to update. Detail is missing or incomplete.");
      return;
    }

    console.log("Received in onStateChange:", e.detail.state);
    this.sharedState = {
      ...this.sharedState,
      ...e.detail.state,
    };
    console.log("Updated state:", this.sharedState);

    e.stopPropagation();
    e.cancelBubble = true;
  }

  render() {
    document.addEventListener("wwci-state-change", (e: CustomEvent) => {
      console.log(
        "Global listener received wwci-state-change event",
        e.detail.state
      );
    });
    console.log("in widget chart options", this.sharedState.chart.options);
    this.sharedState.editable = this.editable;
    this.sharedState.printable = this.printable;

    this.sharedState.chart.optionDefinition = getOptionsDefinition(
      this.sharedState.chart.selectedType
    );
    return html` <div
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
          <wwci-chart-settings
            .sharedState=${this.sharedState}
            @wwci-state-change=${this.onStateChange}
            style="display: contents;"
          ></wwci-chart-settings>
        </div>
      </div>
      <div
        id="main"
        @selectstart=${(e: any) => {
          e.stopPropagation();
        }}
        @dragstart=${(e: any) => {
          e.stopPropagation();
        }}
        @click=${() =>
          this.dispatchEvent(new FocusEvent("focus", { bubbles: true }))}
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
            }}
            .active=${this.showChart}
            >Chart</sl-tab
          >
          <sl-tab
            slot="nav"
            panel="data"
            @click=${() => {
              this.changeShowData();
            }}
            >Data</sl-tab
          >
        </sl-tab-group>

        <!-- </div> -->
        ${this.showData &&
        (this.sharedState.editable || this.sharedState.teacherOptions.showData)
          ? html`<div id="data-panel">
              ${this.sharedState.chart.selectedType === "Scatterplot"
                ? html`<wwci-scatterdataset-input
                    .sharedState=${this.sharedState}
                    @wwci-state-change=${this.onStateChange}
                  ></wwci-scatterdataset-input>`
                : html`<wwci-dataset-input
                    .sharedState=${this.sharedState}
                    @wwci-state-change=${this.onStateChange}
                  ></wwci-dataset-input>`}
            </div>`
          : html`
              <div id="display-chart">
                ${getChart(
                  this.sharedState.chart.selectedType,
                  this.sharedState.chart.datasets,
                  this.sharedState.chart.title,
                  this.sharedState.chart.options,
                  this.sharedState.teacherOptions,
                  this.onStateChange,
                  this.sharedState
                )}
              </div>
            `}
      </div>`;
  }

  static styles = style;
  public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-switch": SlSwitch,
      "sl-input": SlInput,
      "sl-checkbox": SlCheckbox,
      "wwci-dataset-input": DatasetInput,
      "wwci-chart-settings": Settings,
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
      "sl-alert": SlAlert,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "webwriter-chart": WwChart;
  }
}
