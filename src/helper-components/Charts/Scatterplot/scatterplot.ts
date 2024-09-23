import { html, PropertyValues } from "lit";
import * as d3 from "d3";
import { customElement, property } from "lit/decorators.js";
import { OptionDefinition, Definition } from "./definition";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import IconFileBarGraph from "bootstrap-icons/icons/file-bar-graph.svg";
import IconHandIndex from "bootstrap-icons/icons/hand-index.svg";
import IconEye from "bootstrap-icons/icons/eye.svg";
import IconPencil from "bootstrap-icons/icons/pencil.svg";
import IconFilter from "bootstrap-icons/icons/filter.svg";
import {
  addBrushingListeners,
  addDragingPointListeners,
  addDrawLineListeners,
  addGridListeners,
  addPointListeners,
  addRegressionLine,
  calculateCorrelation,
  calculateForRotation,
  deleteLineListeners,
  deletePointListeners,
  drawScatterplot,
  findIndexForLine,
  selectPointByClickingListeners,
  updateLineAndPoints,
  updateColorForFilter,
  drawScatterplot_singleDataset,
  drawScatterplot_singleDataset2,
  customFormatForBigNumber,
  roundNumber,
  clampLabel,
  clampLabelForXAxis,
} from "./drawScatterplot";
import style from "./scatterplot.style";
import StateComponent from "../../../stateComponent";
export interface PointOnlyNumbers {
  x: number;
  y: number;
  selected?: boolean;
  color?: string;
  id?: number;
  scatter_titel?: string;
}
export interface Point {
  x: number | string;
  y: number | string;
  selected?: boolean;
  offset?: number;
  color?: string;
  id?: number;
  scatter_titel?: string;
}
export interface OneDimentionalPoint {
  p: number | string;
  selected?: boolean;
  offset?: number;
  color?: string;
  id?: number;
  scatter_titel?: string;
}
export interface OneDimentionalNumberPoint {
  p: number;
  selected?: boolean;
  offset?: number;
  color?: string;
  id?: number;
  scatter_titel?: string;
}

@customElement("scatterplot-chart")
export class ScatterplotChart extends StateComponent {
  static styles = style;

  @property({ type: Object, attribute: true, reflect: true })
  accessor definition = Definition;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor addNode: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor selectNode: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor selectByClicking: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor selectByBrushing: boolean;
  @property({ type: Number, attribute: true, reflect: true })
  accessor selectedIndextoAddNode: number;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor deselectByBrushing: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor editShowing: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor hideSelected: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor hideUnselected: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor deleteSelected: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor deleteUnselected: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showAll: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor drawLine: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor filterOn: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor hoverCursorChange: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor isDragging: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor animation: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showGrid: boolean;
  @property({ type: String, attribute: true, reflect: true })
  accessor showRegressionLine: string;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showCorrelation: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor hoverTooltip: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showOutliers: boolean;
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showMean: boolean;

  connectedCallback() {
    super.connectedCallback();
    this.sharedState.chart.optionDefinition = OptionDefinition;
    this.sharedState.chart.options = Object.entries(OptionDefinition).reduce(
      (acc, [key, value]) => {
        acc[key] = this.sharedState.chart.options[key] ?? value.default;
        return acc;
      },
      {} as any
    ) as ChartOptions<OptionDefinition>;
  }

  // Lifecycle method that gets called after the component is updated
  protected updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);

    // Check if sharedState or any other relevant properties have changed
    if (
      _changedProperties.has("animation") ||
      _changedProperties.has("showGrid") ||
      _changedProperties.has("showCorrelation") ||
      _changedProperties.has("showOutliers") ||
      _changedProperties.has("showMean") ||
      _changedProperties.has("showRegressionLine") ||
      _changedProperties.has("hoverTooltip") ||
      _changedProperties.get("sharedState")?.scatterDatasets.title !==
        this.sharedState.scatterDatasets.title
    ) {
      if (!this.isDragging) {
        // Add a condition if the line is not dragged
        this.updateScatterplot();
      }
    }
  }

  render() {
    this.animation = this.sharedState.chart.options.animation as boolean;
    this.hoverTooltip = this.sharedState.chart.options.hoverTooltip as boolean;
    this.showGrid = this.sharedState.chart.options.showGrid as boolean;
    this.showCorrelation = this.sharedState.chart.options
      .showCorrelation as boolean;
    this.showOutliers = this.sharedState.chart.options.showOutliers as boolean;
    this.showMean = this.sharedState.chart.options.showMean as boolean;
    this.showRegressionLine = this.sharedState.regressionType;
    const firstSelectedDataset =
      this.sharedState.scatterDatasets.sets.length > 0
        ? this.sharedState.scatterDatasets.sets[
            this.sharedState.scatterDatasets.selected.dataset_indexes[0]
          ]
        : undefined;

    const x_axis_type =
      this.sharedState.scatterDatasets.selected.axis.x === "None"
        ? "none"
        : firstSelectedDataset?.typeOfEachData[
            firstSelectedDataset?.labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.x
            )
          ];
    const y_axis_type =
      this.sharedState.scatterDatasets.selected.axis.y === "None"
        ? "none"
        : firstSelectedDataset?.typeOfEachData[
            firstSelectedDataset?.labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.y
            )
          ];
    const lineTableVisible =
      this.sharedState.lineDatasets.sets.length > 0 &&
      x_axis_type === "number" &&
      y_axis_type === "number";
    const regressionTableVisible =
      (this.sharedState.regressionType !== "none" ||
        this.sharedState.chart.options.showCorrelation) &&
      x_axis_type === "number" &&
      y_axis_type === "number" &&
      this.sharedState.scatterDatasets.sets.length !== 0 &&
      this.selectedDatasets_length !== 0 &&
      this.totalDataLength !== 0;
    const filterTableVisible =
      this.sharedState.scatterDatasets.selected.dataset_indexes.length === 1 &&
      firstSelectedDataset?.filter?.label !== "" &&
      firstSelectedDataset?.filter?.type !== "none" &&
      firstSelectedDataset?.filter?.index_in_labels !== -1;
    // If the animation is on, deactivate the addNode,  selectByClicking, selectByBrushing, deselectByBrushing,  drawLine
    if (this.animation) {
      this.selectedIndextoAddNode = undefined;
      this.selectByClicking = false;
      this.selectByBrushing = false;
      this.deselectByBrushing = false;
      this.drawLine = false;
      this.hoverCursorChange = true;
    }
    return html`<div class="scatterplot-root">
      <div class="scatterplot-wrapper">
        <div class="scatterplot-svg"></div>
        <div class="right-side">
          <div class="button-container">
            <sl-popup
              placement="bottom"
              strategy="fixed"
              .active="${this.addNode}"
              distance="7"
            >
              <span slot="anchor">
                <sl-tooltip
                  hoist
                  placement="top-center"
                  content=${
                    this.sharedState.chart.options.animation
                      ? "To use this option, you must first disable the animation"
                      : this.sharedState.scatterDatasets.sets.length === 0
                      ? "To use this option, you must first add dataset"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length === 0
                      ? "To use this option, you must select at least one dataset"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length === 1 &&
                        this.sharedState.lineDatasets.sets.length === 0
                      ? "To use this option, you must first add at least one data point to the selected dataset table"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length > 1 &&
                        this.sharedState.lineDatasets.sets.length === 0
                      ? "To use this option, you must first add at least one data point to the selected dataset tables"
                      : x_axis_type !== "number" || y_axis_type !== "number"
                      ? "The x and y axis must be numbers to use this option"
                      : "Add a new data point"
                  }
                >
                  <sl-button
                    variant=${
                      this.selectedIndextoAddNode >= 0 ? "primary" : "default"
                    }
                    size="small"
                    circle
                    id="add-point-button"
                    @click=${(e) => {
                      if (
                        this.drawLine ||
                        this.selectByClicking ||
                        this.selectByBrushing ||
                        this.deselectByBrushing
                      ) {
                        this.drawLine = false;
                        this.selectByClicking = false;
                        this.selectByBrushing = false;
                        this.deselectByBrushing = false;
                        this.updateScatterplot();
                      }

                      if (this.selectedIndextoAddNode >= 0) {
                        this.selectedIndextoAddNode = undefined;
                        this.addNode = false;
                        this.hoverCursorChange = true;
                        this.updateScatterplot();
                      } else {
                        this.addNode = !this.addNode;
                      }
                      e.target.focus();
                    }}
                    .disabled=${
                      this.sharedState.chart.options.animation ||
                      (this.totalDataLength === 0 &&
                        this.sharedState.lineDatasets.sets.length === 0) ||
                      x_axis_type !== "number" ||
                      y_axis_type !== "number"
                    }
                    @blur=${() => (this.addNode = false)}
                  >
                    <sl-icon src=${IconFileBarGraph} label="Data"></sl-icon>
                  </sl-button>
                </sl-tooltip>
              </span>
              <div class="popup-content">
                ${
                  this.sharedState.scatterDatasets.sets.length !== 0
                    ? this.sharedState.scatterDatasets.selected.dataset_indexes.map(
                        (dataset_index, i) => {
                          const dataset =
                            this.sharedState.scatterDatasets.sets[
                              dataset_index
                            ];
                          return html`
                            <sl-menu-item
                              type="checkbox"
                              @mousedown=${(e: MouseEvent) => {
                                if (e.button !== 0) return;

                                if (this.selectedIndextoAddNode === i) {
                                  this.selectedIndextoAddNode = undefined;
                                } else {
                                  this.selectedIndextoAddNode = i;
                                  this.hoverCursorChange = false;
                                  this.updateScatterplot();
                                }
                              }}
                              .checked=${this.selectedIndextoAddNode === i}
                            >
                              Add a new data point of "${dataset.name}"
                            </sl-menu-item>
                          `;
                        }
                      )
                    : html``
                }
              </div>
            </sl-popup>

            <sl-popup
              placement="bottom"
              strategy="fixed"
              .active=${this.selectNode}
              distance="7"
            >
              <span slot="anchor">
                <sl-tooltip
                  hoist
                  placement="top-center"
                  content=${
                    this.sharedState.chart.options.animation
                      ? "To use this option, you must first disable the animation"
                      : this.sharedState.scatterDatasets.sets.length === 0
                      ? "To use this option, you must first add dataset"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length === 0
                      ? "To use this option, you must select at least one dataset"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length === 1
                      ? "To use this option, you must first add at least one data point to the selected dataset table"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length > 1
                      ? "To use this option, you must first add at least one data point to the selected dataset tables"
                      : x_axis_type === "none" &&
                        y_axis_type === "none" &&
                        this.selectedDatasets_length === 1
                      ? "To use this option, you must first select the x or y axis"
                      : (x_axis_type !== "number" ||
                          y_axis_type !== "number") &&
                        this.selectedDatasets_length > 1
                      ? "The x and y axis must be numbers to use this option"
                      : "Select data points"
                  }
                    : 
                    "(De)select data points"}
                >
                  <sl-button
                    variant=${
                      this.selectByBrushing ||
                      this.selectByClicking ||
                      this.deselectByBrushing
                        ? "primary"
                        : "default"
                    }
                    size="small"
                    circle
                    id="select-point-button"
                    .disabled=${
                      this.totalDataLength === 0 ||
                      this.sharedState.chart.options.animation ||
                      (x_axis_type === "none" &&
                        y_axis_type === "none" &&
                        this.selectedDatasets_length === 1) ||
                      ((x_axis_type !== "number" || y_axis_type !== "number") &&
                        this.selectedDatasets_length > 1)
                    }
                    @click=${(e) => {
                      if (this.selectedIndextoAddNode >= 0 || this.drawLine) {
                        this.selectedIndextoAddNode = undefined;
                        this.drawLine = false;
                        this.updateScatterplot();
                      }

                      if (
                        this.selectByBrushing ||
                        this.selectByClicking ||
                        this.deselectByBrushing
                      ) {
                        this.selectByClicking = false;
                        this.selectByBrushing = false;
                        this.deselectByBrushing = false;
                        this.selectNode = false;
                        this.updateScatterplot();
                      } else {
                        this.selectNode = !this.selectNode;
                      }
                      e.target.focus();
                    }}
                    @blur=${() => (this.selectNode = false)}
                  >
                    <sl-icon src=${IconHandIndex} label="Selection"></sl-icon>
                  </sl-button>
                </sl-tooltip>
              </span>
              <div class="popup-content">
                <sl-button
                  id="select-by-clicking"
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.selectByClicking = true;
                    this.selectByBrushing = false;
                    this.deselectByBrushing = false;
                    this.deleteSelected = false;
                    this.deleteUnselected = false;
                    this.hideSelected = false;
                    this.hideUnselected = false;
                    this.showAll = false;
                    this.hoverCursorChange = false;
                    this.updateScatterplot();
                  }}
                >
                  (De)select By Clicking
                </sl-button>
                <sl-button
                  id="select-by-brushing"
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.selectByBrushing = true;
                    this.selectByClicking = false;
                    this.deselectByBrushing = false;
                    this.deleteSelected = false;
                    this.deleteUnselected = false;
                    this.hideSelected = false;
                    this.hideUnselected = false;
                    this.showAll = false;
                    this.updateScatterplot();
                  }}
                >
                  Select By Brushing
                </sl-button>
                <sl-button
                  id="deselect-by-brushing"
                  .disabled=${this.selectedDataLength === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.deselectByBrushing = true;
                    this.selectByBrushing = false;
                    this.selectByClicking = false;
                    this.deleteSelected = false;
                    this.deleteUnselected = false;
                    this.hideSelected = false;
                    this.hideUnselected = false;
                    this.showAll = false;
                    this.updateScatterplot();
                  }}
                >
                  Deselect By Brushing
                </sl-button>
              </div>
            </sl-popup>

            <sl-popup
              placement="bottom"
              strategy="fixed"
              .active=${this.editShowing}
              distance="7"
            >
              <span slot="anchor">
                <sl-tooltip
                  hoist
                  placement=${
                    this.totalDataLength === 0 ||
                    this.sharedState.chart.options.animation ||
                    (x_axis_type === "none" &&
                      y_axis_type === "none" &&
                      this.selectedDatasets_length === 1) ||
                    ((x_axis_type !== "number" || y_axis_type !== "number") &&
                      this.selectedDatasets_length > 1)
                      ? "top-end"
                      : "top-center"
                  }
                  content=${
                    this.sharedState.chart.options.animation
                      ? "To use this option, you must first disable the animation"
                      : this.sharedState.scatterDatasets.sets.length === 0
                      ? "To use this option, you must first add dataset"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length === 0
                      ? "To use this option, you must select at least one dataset"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length === 1
                      ? "To use this option, you must first add at least one data point to the selected dataset table"
                      : this.totalDataLength === 0 &&
                        this.selectedDatasets_length > 1
                      ? "To use this option, you must first add at least one data point to the selected dataset tables"
                      : x_axis_type === "none" &&
                        y_axis_type === "none" &&
                        this.selectedDatasets_length === 1
                      ? "To use this option, you must first select the x or y axis"
                      : (x_axis_type !== "number" ||
                          y_axis_type !== "number") &&
                        this.selectedDatasets_length > 1
                      ? "The x and y axis must be numbers to use this option"
                      : "Show data points"
                  }
                >
                  <sl-button
                    variant="default"
                    size="small"
                    circle
                    id="edit-button"
                    .disabled=${
                      this.totalDataLength === 0 ||
                      this.sharedState.chart.options.animation ||
                      (x_axis_type === "none" &&
                        y_axis_type === "none" &&
                        this.selectedDatasets_length === 1) ||
                      ((x_axis_type !== "number" || y_axis_type !== "number") &&
                        this.selectedDatasets_length > 1)
                    }
                    @click=${(e) => {
                      if (
                        this.selectedIndextoAddNode >= 0 ||
                        this.selectByClicking ||
                        this.selectByBrushing ||
                        this.deselectByBrushing ||
                        this.drawLine
                      ) {
                        this.selectedIndextoAddNode = undefined;
                        this.selectByClicking = false;
                        this.selectByBrushing = false;
                        this.deselectByBrushing = false;
                        this.drawLine = false;
                        this.updateScatterplot();
                      }

                      this.editShowing = !this.editShowing;
                      e.target.focus();
                    }}
                    @blur=${() => (this.editShowing = false)}
                  >
                    <sl-icon src=${IconEye} label="View"></sl-icon>
                  </sl-button>
                </sl-tooltip>
              </span>
              <div class="popup-content">
                <sl-menu-item
                  type="checkbox"
                  ?checked=${this.hideSelected}
                  .disabled=${this.selectedDataLength === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.hideSelected = !this.hideSelected;
                    this.hideSelected ? (this.showAll = false) : null;
                    !this.hideSelected && !this.hideUnselected
                      ? (this.showAll = true)
                      : null;
                    this.updateScatterplot();
                  }}
                  >Hide Selected</sl-menu-item
                >
                <sl-menu-item
                  type="checkbox"
                  ?checked=${this.hideUnselected}
                  .disabled=${this.unselectedDataLength === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.hideUnselected = !this.hideUnselected;
                    this.hideUnselected ? (this.showAll = false) : null;
                    !this.hideSelected && !this.hideUnselected
                      ? (this.showAll = true)
                      : null;
                    this.updateScatterplot();
                  }}
                  >Hide Unselected</sl-menu-item
                >
                <sl-menu-item
                  type="checkbox"
                  ?checked=${this.showAll}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.showAll = !this.showAll;
                    if (this.showAll) {
                      this.hideSelected = false;
                      this.hideUnselected = false;
                    }
                    this.updateScatterplot();
                  }}
                  >Show All</sl-menu-item
                >
                <sl-menu-item
                  type="checkbox"
                  ?checked=${this.deleteSelected}
                  .disabled=${this.selectedDataLength === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.deleteSelected = !this.deleteSelected;
                    if (this.deleteSelected) {
                      this.sharedState.scatterDatasets.sets.forEach(
                        (dataset, index) => {
                          for (
                            let i = dataset.dimensional_data.length - 1;
                            i >= 0;
                            i--
                          ) {
                            if (
                              this.sharedState.scatterDatasets.selected.dataset_indexes.includes(
                                index
                              )
                            ) {
                              if (dataset.dimensional_data[i].selected) {
                                dataset.dimensional_data.splice(i, 1);
                                dataset.ids.splice(i, 1);
                              }
                            }
                          }
                        }
                      );
                    }
                    this.updateScatterplot();
                  }}
                  >Delete Selected</sl-menu-item
                >
                <sl-menu-item
                  type="checkbox"
                  ?checked=${this.deleteUnselected}
                  .disabled=${this.unselectedDataLength === 0}
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.deleteUnselected = !this.deleteUnselected;
                    if (this.deleteUnselected) {
                      this.sharedState.scatterDatasets.sets.forEach(
                        (dataset, index) => {
                          for (
                            let i = dataset.dimensional_data.length - 1;
                            i >= 0;
                            i--
                          ) {
                            if (
                              this.sharedState.scatterDatasets.selected.dataset_indexes.includes(
                                index
                              )
                            ) {
                              if (!dataset.dimensional_data[i].selected) {
                                dataset.dimensional_data.splice(i, 1);
                                dataset.ids.splice(i, 1);
                              }
                            }
                          }
                        }
                      );
                    }
                    this.updateScatterplot();
                  }}
                  >Delete Unselected</sl-menu-item
                >
              </div>
            </sl-popup>
            <span slot="anchor">
              <sl-tooltip
                hoist
                placement=${
                  this.sharedState.chart.options.animation ||
                  x_axis_type !== "number" ||
                  y_axis_type !== "number" ||
                  this.totalDataLength === 0
                    ? "top-end"
                    : "top-center"
                }
                content=${
                  this.sharedState.chart.options.animation
                    ? "To use this option, you must first disable the animation"
                    : this.sharedState.scatterDatasets.sets.length === 0
                    ? "To use this option, you must first add dataset"
                    : this.totalDataLength === 0 &&
                      this.selectedDatasets_length === 0
                    ? "To use this option, you must select at least one dataset"
                    : this.totalDataLength === 0 &&
                      this.selectedDatasets_length === 1
                    ? "To use this option, you must first add at least one data point to the selected dataset table"
                    : this.totalDataLength === 0 &&
                      this.selectedDatasets_length > 1
                    ? "To use this option, you must first add at least one data point to the selected dataset tables"
                    : x_axis_type !== "number" || y_axis_type !== "number"
                    ? "The x and y axis must be numbers to use this option"
                    : "Draw a line in the scatterplot"
                }
              >
                <sl-button
                  
                  size="small"
                  circle
                  id="draw-line-button"
                  @click=${(e) => {
                    if (e.button !== 0) return;
                    this.selectedIndextoAddNode = undefined;
                    this.selectByClicking = false;
                    this.selectByBrushing = false;
                    this.deselectByBrushing = false;
                    this.hoverCursorChange = false;
                    this.drawLine = !this.drawLine;
                    this.updateScatterplot();
                  }}
                  variant=${this.drawLine ? "primary" : "default"}
                  .disabled=${
                    this.sharedState.chart.options.animation ||
                    this.totalDataLength === 0 ||
                    x_axis_type !== "number" ||
                    y_axis_type !== "number"
                  }
                >
                  <sl-icon src=${IconPencil} label="Draw"></sl-icon>
                </sl-button>
              </sl-tooltip>
            </span>
            <sl-popup
              placement="bottom"
              strategy="fixed"
              .active=${this.filterOn}
              distance="7"
            >
              <span slot="anchor">
                <sl-tooltip
                  hoist
                  placement=${
                    this.sharedState.chart.options.animation ||
                    this.selectedDatasets_length !== 1 ||
                    this.totalDataLength === 0 ||
                    (x_axis_type === "none" &&
                      y_axis_type === "none" &&
                      this.selectedDatasets_length === 1)
                      ? "top-end"
                      : "top-center"
                  }
                  content=${
                    this.sharedState.chart.options.animation
                      ? "To use this option, you must first disable the animation"
                      : this.sharedState.scatterDatasets.sets.length === 0
                      ? "To use this option, you must first add dataset"
                      : this.selectedDatasets_length !== 1
                      ? "To use this option, you must first select only one dataset"
                      : this.totalDataLength === 0
                      ? "To use this option, you must first add at least one data point to the selected dataset table"
                      : x_axis_type === "none" &&
                        y_axis_type === "none" &&
                        this.selectedDatasets_length === 1
                      ? "To use this option, you must first select the x or y axis"
                      : "Filter data points"
                  }
                >
                  <sl-button
                    variant="default"
                    size="small"
                    circle
                    id="filter-button"
                    @click=${(e) => {
                      if (
                        this.selectedIndextoAddNode >= 0 ||
                        this.selectByClicking ||
                        this.selectByBrushing ||
                        this.deselectByBrushing ||
                        this.drawLine
                      ) {
                        this.selectedIndextoAddNode = undefined;
                        this.selectByClicking = false;
                        this.selectByBrushing = false;
                        this.deselectByBrushing = false;
                        this.drawLine = false;
                      }

                      this.filterOn = !this.filterOn;
                      e.target.focus();
                    }}
                    .disabled=${
                      this.sharedState.chart.options.animation ||
                      this.selectedDatasets_length !== 1 ||
                      this.totalDataLength === 0 ||
                      (x_axis_type === "none" &&
                        y_axis_type === "none" &&
                        this.selectedDatasets_length === 1)
                    }
                    @blur=${() => (this.filterOn = false)}
                  >
                    <sl-icon src=${IconFilter} label="Filter"></sl-icon>
                  </sl-button>
                </sl-tooltip>
              </span>
              <div class="popup-content">
                ${(firstSelectedDataset?.labels ?? []).map(
                  (label, i) =>
                    html`
                      <sl-menu-item
                        type="checkbox"
                        @mousedown=${(e: MouseEvent) => {
                          if (e.button !== 0 || !firstSelectedDataset) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const index =
                            firstSelectedDataset.filter.label === label
                              ? -1
                              : i;
                          if (index !== -1) {
                            firstSelectedDataset.filter.label = label;
                            firstSelectedDataset.filter.index_in_labels = index;
                            const type =
                              firstSelectedDataset.typeOfEachData[index];
                            firstSelectedDataset.filter.type = type;
                            updateColorForFilter(i, type, firstSelectedDataset);
                          } else {
                            firstSelectedDataset.filter.label = "";
                            firstSelectedDataset.filter.index_in_labels = -1;
                            firstSelectedDataset.filter.type = "none";
                            firstSelectedDataset.dimensional_data.forEach(
                              (d) => {
                                d.color = firstSelectedDataset.color;
                              }
                            );
                          }
                          this.updateScatterplot();
                        }}
                        .checked=${firstSelectedDataset?.filter.label === label}
                      >
                        ${label}
                      </sl-menu-item>
                    `
                )}
              </div>
            </sl-popup>
          </div>

          <div
            class="table-wrapper ${
              regressionTableVisible ? "visible" : "hidden"
            }"
            style="max-height: ${
              this.sharedState.chart.options.animation &&
              regressionTableVisible &&
              !lineTableVisible &&
              !filterTableVisible
                ? "19rem"
                : regressionTableVisible &&
                  !lineTableVisible &&
                  !filterTableVisible
                ? "23rem"
                : this.sharedState.chart.options.animation &&
                  regressionTableVisible &&
                  (!lineTableVisible || !filterTableVisible)
                ? "8.5rem"
                : regressionTableVisible &&
                  (!lineTableVisible || !filterTableVisible)
                ? "11rem"
                : this.sharedState.chart.options.animation
                ? "3.8rem"
                : "4.3rem"
            };"
          >
            <table>
              <thead>
                <tr>
                  <th class="th_regression">Regression</th>
                  <th class="th_correlation">R</th>
                </tr>
              </thead>
              <tbody class="regression-formulas"></tbody>
            </table>
          </div>
          <div
            class="table-wrapper ${lineTableVisible ? "visible" : "hidden"} 
            "
            style="max-height: ${
              this.sharedState.chart.options.animation &&
              lineTableVisible &&
              !regressionTableVisible &&
              !filterTableVisible
                ? "19rem"
                : lineTableVisible &&
                  !regressionTableVisible &&
                  !filterTableVisible
                ? "23rem"
                : this.sharedState.chart.options.animation &&
                  lineTableVisible &&
                  (!regressionTableVisible || !filterTableVisible)
                ? "8rem"
                : lineTableVisible &&
                  (!regressionTableVisible || !filterTableVisible)
                ? "10.5rem"
                : this.sharedState.chart.options.animation
                ? "6.5rem"
                : "9rem"
            };"
          >
            <table>
              <thead>
                <tr>
                  <th class="th_line">Line</th>
                </tr>
              </thead>
              <tbody class="line-formulas"></tbody>
            </table>
          </div>

          <div
            class="table-wrapper ${filterTableVisible ? "visible" : "hidden"}"
            style="max-height: ${
              this.sharedState.chart.options.animation &&
              filterTableVisible &&
              !regressionTableVisible &&
              !lineTableVisible
                ? "19rem"
                : filterTableVisible &&
                  !regressionTableVisible &&
                  !lineTableVisible
                ? "23rem"
                : this.sharedState.chart.options.animation &&
                  filterTableVisible &&
                  (!regressionTableVisible || !lineTableVisible)
                ? "8.5rem"
                : filterTableVisible &&
                  (!regressionTableVisible || !lineTableVisible)
                ? "11rem"
                : this.sharedState.chart.options.animation
                ? "6.5rem"
                : "9rem"
            };"
          >
            <table>
              <thead>
                <tr>
                  <th class="th_color">Color</th>
                  <th class="th_range">
                    ${
                      firstSelectedDataset?.filter?.label &&
                      firstSelectedDataset?.filter.type === "number"
                        ? firstSelectedDataset?.filter.label
                        : "Label"
                    }
                  </th>
                </tr>
              </thead>
              <tbody class="color-formulas"></tbody>
            </table>
          </div>
          ${
            this.sharedState.chart.options.animation
              ? html`<sl-range
                  id="animationRange"
                  .value=${this.definition.animationTime}
                  @sl-change=${(e: any) => {
                    this.definition.animationTime = e.target.value;
                    this.updatePlot();
                  }}
                  min="1000"
                  max="5000"
                  step="500"
                  label="Animation Time"
                ></sl-range>`
              : html``
          }
        </div>
      </div>
    </div>`;
  }
  get totalDataLength() {
    let length = 0;
    if (this.sharedState.scatterDatasets.sets.length !== 0) {
      this.sharedState.scatterDatasets.selected.dataset_indexes.forEach(
        (dataset_index) => {
          length +=
            this.sharedState.scatterDatasets.sets[dataset_index]
              .dimensional_data.length;
        }
      );
    }
    return length;
  }

  get selectedDatasets_length() {
    return this.sharedState.scatterDatasets.selected.dataset_indexes.length;
  }

  // Get the length of the selected data points
  get selectedDataLength() {
    let length = 0;
    this.sharedState.scatterDatasets.sets.forEach((dataset) => {
      dataset.dimensional_data.forEach((point) => {
        if (point.selected) {
          length++;
        }
      });
    });
    return length;
  }
  // Get the length of the unselected data points
  get unselectedDataLength() {
    let length = 0;
    this.sharedState.scatterDatasets.sets.forEach((dataset) => {
      dataset.dimensional_data.forEach((point) => {
        if (!point.selected) {
          length++;
        }
      });
    });
    return length;
  }

  firstUpdated() {
    this.addNode = false;
    this.selectNode = false;
    this.selectByBrushing = false;
    this.selectByClicking = false;
    this.deselectByBrushing = false;
    this.selectedIndextoAddNode = undefined;
    this.hideSelected = false;
    this.hideUnselected = false;
    this.deleteSelected = false;
    this.deleteUnselected = false;
    this.showAll = true;
    this.editShowing = false;
    this.drawLine = false;
    this.filterOn = false;
    this.hoverCursorChange = true;
    this.isDragging = false;
    this.createScatterPlot();
    // TODO: remove event listener on unmount
    /*document.addEventListener("keypress", (e) => {
      switch (e.key) {
        case "Backspace":
        case "Delete":
      }
    });*/
  }
  //updatePlot for new animation time
  //TODO: Add margin right for bigger numbers and margin top
  // TODO: Add name for scatterplot, maybe use the text feld?
  // TODO: Name for each dataset unter the scatterplot
  // TODO: Table for statistics: r, regression folrmula, mean, etc.
  // TODO: Fix buttons convert and download image
  // TODO: Given x and calculate y (geogbra)
  // TODO: Show all regression line when cut
  // TODO: see friendly error message and user drag, delete, add points from automa (WR)
  // TODO: Fix edit button
  // TODO: dymanic and manuell scaling for x and y axis
  // TODO: Feedback for choose the right point
  //TODO: Maybe separate the regression and the correlation table

  updatePlot() {
    const animationRange = this.shadowRoot.querySelector(
      "#animationRange"
    ) as HTMLInputElement;
    this.definition.animationTime = Number(animationRange.value);
    // delete the old scatter plot
    const root = this.shadowRoot.querySelector(".scatterplot-root");
    d3.select(root).selectAll("svg").remove();
    // delete the left over tooltip
    d3.select(root).selectAll(".tooltip").remove();
    this.createScatterPlot(); // Redraw the scatter plot with the new animation time
    this.dispatchStateChange();
  }
  // i is index of the selected label to filter

  //Update the scatterplot after dragging a point
  updateScatterplot() {
    if (!this.hideSelected && !this.hideUnselected) {
      this.showAll = true;
    }

    const root = this.shadowRoot.querySelector(".scatterplot-root");
    d3.select(root).selectAll("svg").remove();
    d3.select(root).selectAll(".tooltip").remove();
    d3.select(root).selectAll("path.line").remove();

    this.createScatterPlot();
    this.dispatchStateChange();
  }
  // !IMPORTANT: TODO: Fix the drag behavior out of scatterplot area ?
  createScatterPlot() {
    const selectedDatasets = this.sharedState.scatterDatasets.sets.filter(
      (_, i) =>
        this.sharedState.scatterDatasets.selected.dataset_indexes
          .sort()
          .includes(i)
    );
    const x_axis_type =
      this.sharedState.scatterDatasets.sets.length === 0
        ? "noData"
        : selectedDatasets.length === 0
        ? "noSelectedDataset"
        : this.totalDataLength === 0 && selectedDatasets.length !== 0
        ? "noDataInSelectedDatasets"
        : this.sharedState.scatterDatasets.selected.axis.x === "None"
        ? "none"
        : selectedDatasets.length > 0
        ? selectedDatasets[0].typeOfEachData[
            selectedDatasets[0].labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.x
            )
          ]
        : undefined;
    const y_axis_type =
      this.sharedState.scatterDatasets.sets.length === 0
        ? "noData"
        : selectedDatasets.length === 0
        ? "noSelectedDataset"
        : this.totalDataLength === 0 && selectedDatasets.length !== 0
        ? "noDataInSelectedDatasets"
        : this.sharedState.scatterDatasets.selected.axis.y === "None"
        ? "none"
        : selectedDatasets.length > 0
        ? selectedDatasets[0].typeOfEachData[
            selectedDatasets[0].labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.y
            )
          ]
        : undefined;

    const root = this.shadowRoot.querySelector(".scatterplot-svg");
    let animationTime = Number(this.definition.animationTime);
    if (
      (x_axis_type === "number" && y_axis_type === "number") ||
      this.sharedState.scatterDatasets.selected.dataset_indexes.length > 1 ||
      (x_axis_type === "noSelectedDataset" &&
        y_axis_type === "noSelectedDataset") ||
      (x_axis_type === "noData" && y_axis_type === "noData") ||
      (x_axis_type === "noDataInSelectedDatasets" &&
        y_axis_type === "noDataInSelectedDatasets")
    ) {
      const axisLabels = {
        x: clampLabel(this.sharedState.scatterDatasets.selected.axis.x, 42),
        y: clampLabel(this.sharedState.scatterDatasets.selected.axis.y, 42),
      };
      const datasets: PointOnlyNumbers[][] =
        this.sharedState.scatterDatasets.selected.dataset_indexes.length > 0 &&
        x_axis_type !== "noData" &&
        y_axis_type !== "noData" &&
        x_axis_type !== "noSelectedDataset" &&
        y_axis_type !== "noSelectedDataset" &&
        x_axis_type !== "noDataInSelectedDatasets" &&
        y_axis_type !== "noDataInSelectedDatasets" &&
        x_axis_type !== "none" &&
        y_axis_type !== "none"
          ? this.sharedState.scatterDatasets.selected.dataset_indexes
              .sort()
              .map((dataset_index) => {
                const set =
                  this.sharedState.scatterDatasets.sets[dataset_index];
                const index_x = set.labels.indexOf(
                  this.sharedState.scatterDatasets.selected.axis.x
                );
                const index_y = set.labels.indexOf(
                  this.sharedState.scatterDatasets.selected.axis.y
                );

                return set.dimensional_data.map((dimensional_data, i) => {
                  const d: PointOnlyNumbers = {
                    x: dimensional_data.data[index_x] as number,
                    y: dimensional_data.data[index_y] as number,
                    selected: dimensional_data.selected,
                    color:
                      selectedDatasets.length === 1 && dimensional_data.color
                        ? dimensional_data.color
                        : set.color,
                    id: set.ids[i],
                    scatter_titel: set.name,
                  };
                  // !IMPORTANT: Keep the reference to the original dataset to update data when updating points directly!
                  return d;
                });
              })
          : [];
      const lineDatasetsWithCenterPoint: PointOnlyNumbers[][] =
        this.sharedState.lineDatasets.sets.length > 0
          ? this.sharedState.lineDatasets.sets.map((dataset) =>
              dataset.data.concat([
                {
                  x: (dataset.data[0].x + dataset.data[1].x) / 2,
                  y: (dataset.data[0].y + dataset.data[1].y) / 2,
                },
              ])
            )
          : [];
      let datasets_count = 0;
      if (datasets.length > 0) {
        datasets.forEach((dataset) => {
          datasets_count += dataset.length;
        });
      }

      let lineDatasets_count = 0;
      if (lineDatasetsWithCenterPoint.length > 0) {
        lineDatasetsWithCenterPoint.forEach((dataset) => {
          lineDatasets_count += dataset.length;
        });
      }
      const { svg, scales, scatter, dimensions, tooltip } = drawScatterplot(
        root,
        datasets,
        axisLabels,
        {
          x: this.sharedState.scatterDatasets.selected.axis.x,
          y: this.sharedState.scatterDatasets.selected.axis.y,
        },
        {
          hoverTooltip: this.sharedState.chart.options.hoverTooltip,
          showOutliers: this.sharedState.chart.options.showOutliers,
          hoverCursorChange: this.hoverCursorChange,
        } as any,
        this.sharedState.lineDatasets,
        datasets_count,
        lineDatasets_count,
        x_axis_type,
        x_axis_type,
        this.sharedState.scatterDatasets.title
      );
      // For scatter plot with regression
      const regressionFormulaRoot = this.shadowRoot.querySelector(
        ".regression-formulas"
      );
      [...regressionFormulaRoot.children].forEach((child) => child.remove());

      if (
        ((x_axis_type === "number" && y_axis_type === "number") ||
          (x_axis_type === "noDataInSelectedDatasets" &&
            y_axis_type === "noDataInSelectedDatasets")) &&
        (datasets_count > 0 || lineDatasets_count > 0)
      ) {
        if (
          x_axis_type === "number" &&
          y_axis_type === "number" &&
          datasets_count > 0
        ) {
          // Clicking for selecting points
          if (
            this.selectByClicking &&
            !this.selectByBrushing &&
            !this.deselectByBrushing
          ) {
            // Change cursor to a hand with a pointing finger
            svg.style("cursor", "pointer");
            datasets.forEach((_, index) => {
              svg.selectAll(`circle.dataset-${index}`).on("click", (event) => {
                selectPointByClickingListeners(
                  event,
                  svg,
                  datasets,
                  scales,
                  this.sharedState.scatterDatasets
                );
                // Re-render
                this.selectByClicking = false;
                this.hoverCursorChange = true;
                this.updateScatterplot();
              });
            });
          }

          // Handle brushing to select points (Select all points if they have the same coordinates)
          // Handle deselecting points by brushing (deselect all points if they have the same coordinates)
          if (
            (this.selectByBrushing || this.deselectByBrushing) &&
            !this.selectByClicking
          ) {
            if (this.selectByBrushing || this.deselectByBrushing) {
              addBrushingListeners(
                svg,
                scatter,
                dimensions,
                scales,
                this.sharedState.scatterDatasets,
                () => {
                  this.selectByBrushing = false;
                  this.deselectByBrushing = false;
                  this.updateScatterplot();
                },
                this.selectByBrushing ? "select" : "deselect"
              );
            }
          }
          // Draw a line in scatter plot
          if (this.drawLine) {
            // change cursor to pencil

            // Define the pencil SVG as a string
            let pencilCursorSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
</svg>
`;

            // Encode the SVG to a Base64 data URL
            let pencilCursorURL = `data:image/svg+xml;base64,${btoa(
              pencilCursorSVG
            )}`;
            svg.style("cursor", `url(${pencilCursorURL}) 0 16, auto`);

            addDrawLineListeners(svg, scales, (line) => {
              this.sharedState.lineDatasets.sets.push({ data: line });
              this.drawLine = false;
              this.hoverCursorChange = true;
              this.updateScatterplot();
            });
          }
          //Hide selected points
          if (this.hideSelected) {
            scatter.selectAll("circle").each(function (d: PointOnlyNumbers) {
              if (d.selected) {
                d3.select(this).style("display", "none");
              }
            });
          }
          //Hide unselected points
          if (this.hideUnselected) {
            scatter.selectAll("circle").each(function (d: PointOnlyNumbers) {
              if (!d.selected) {
                d3.select(this).style("display", "none");
              }
            });
          }
          // Show all points
          if (this.showAll) {
            scatter.selectAll("circle").each(function (_) {
              d3.select(this).style("display", "block");
            });
          }

          //----------------- manipulate points without condition

          if (
            !(
              this.selectByClicking ||
              this.selectedIndextoAddNode !== undefined ||
              this.drawLine ||
              this.selectByBrushing ||
              this.deselectByBrushing
            )
          ) {
            // Dragging points to change their position
            addDragingPointListeners(
              svg,
              scatter,
              scales,
              this.sharedState.scatterDatasets,
              datasets,
              () => {
                this.updateScatterplot();
                if (
                  selectedDatasets.length === 1 &&
                  (this.sharedState.scatterDatasets.selected.axis.x ===
                    selectedDatasets[0].filter.label ||
                    this.sharedState.scatterDatasets.selected.axis.y ===
                      selectedDatasets[0].filter.label) &&
                  selectedDatasets[0].filter.type === "number"
                ) {
                  updateColorForFilter(
                    this.sharedState.scatterDatasets.selected.axis.x ===
                      selectedDatasets[0].filter.label
                      ? selectedDatasets[0].labels.indexOf(axisLabels.x)
                      : selectedDatasets[0].labels.indexOf(axisLabels.y),
                    "number",
                    selectedDatasets[0]
                  );
                  this.updateScatterplot();
                }
              }
            );
            // Handle recht click to remove point
            datasets.forEach((_, index) => {
              svg
                .selectAll(`circle.dataset-${index}`)
                .on("contextmenu", (event) => {
                  deletePointListeners(
                    event,
                    svg,
                    datasets,
                    this.sharedState.scatterDatasets,
                    scales
                  );
                  //Re-render
                  this.updateScatterplot();
                });
            });
          }
          //-----------------

          // Scatterplot with regression line and correlation coefficient
          datasets.forEach((dataset, i) => {
            if (
              this.sharedState.regressionType !== "none" ||
              this.sharedState.chart.options.showCorrelation
            ) {
              const color =
                this.sharedState.scatterDatasets.sets[
                  this.sharedState.scatterDatasets.selected.dataset_indexes.sort()[
                    i
                  ]
                ].color ?? "#69b3a2";
              // calculate the regression line for each dataset and display in the scatter plot
              const result = addRegressionLine(
                svg,
                scales,
                dataset,
                this.sharedState.regressionType,
                color
              );
              const regressionFormula = result.regressionFormula;
              const correlation = calculateCorrelation(dataset);
              //  show the formula of the regression line on the top left corner
              if (
                regressionFormula !== "" ||
                (this.sharedState.chart.options.showCorrelation && correlation)
              ) {
                const tr = document.createElement("tr");
                const td1 = document.createElement("td");
                const td2 = document.createElement("td");
                tr.appendChild(td1);
                tr.appendChild(td2);
                const regressionSpan = document.createElement("span");
                td1.appendChild(regressionSpan);
                const correlationSpan = document.createElement("span");
                td2.appendChild(correlationSpan);
                regressionFormulaRoot.appendChild(tr);
                regressionSpan.innerText = regressionFormula;
                regressionSpan.style.wordBreak = "break-all";
                regressionSpan.style.color = color;
                if (this.sharedState.chart.options.showCorrelation) {
                  // calculate the correlation coefficient for each dataset

                  correlationSpan.innerText = (
                    Math.round(correlation * 100) / 100
                  ).toLocaleString();
                  correlationSpan.style.color =
                    this.sharedState.scatterDatasets.sets[i].color ?? "#69b3a2";
                }
              }
            }
          });

          // Animate the scatter plot
          // For each point appears with a tooltip
          // TODO: Consider to deactivate the draging and deleting points during the animation
          // TODO: Fix the problem when during animation the user want to choose regression line by deactivate the regression line?
          if (this.sharedState.chart.options.animation) {
            svg
              .selectAll(`.regression-line`)
              .style("opacity", 0)
              .transition()
              .delay(this.totalDataLength * animationTime + 550)
              .duration(300)
              .style("opacity", 1);
            scatter
              .selectAll("circle")
              .classed("selected", false)
              .style("opacity", 0)
              .each((d: PointOnlyNumbers, i: number) => {
                setTimeout(() => {
                  const coords = {
                    x: 0,
                    y: 0,
                  };

                  const circle = this.shadowRoot.querySelector(
                    `svg circle[cx="${scales.x(d.x)}"][cy="${scales.y(d.y)}"]`
                  ) as SVGCircleElement;

                  if (circle) {
                    const rect = circle.getBoundingClientRect();
                    coords.x = rect.x + rect.width / 2;
                    coords.y = rect.y + rect.height / 2;
                  }

                  // Draw the x-line first
                  svg
                    .append("line")
                    .attr("x1", scales.x(d.x))
                    .attr("y1", dimensions.height)
                    .attr("x2", scales.x(d.x))
                    .attr("y2", dimensions.height) // Start with y2 equal to y1
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "4")
                    .transition() // Start the transition
                    .duration(animationTime / 4) // Duration of the drawing effect in milliseconds
                    .attr("y2", scales.y(d.y)) // Animate y2 to the desired value
                    .attr("class", `line-x-${i}`);

                  // Draw the y-line after the x-line has been drawn
                  svg
                    .append("line")
                    .attr("x1", 0)
                    .attr("y1", scales.y(d.y))
                    .attr("x2", 0) // Start with x2 equal to x1
                    .attr("y2", scales.y(d.y))
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "4")
                    .transition() // Start the transition
                    .delay(animationTime / 4 + animationTime * 0.075) // Delay the start of the transition to wait for the x-line
                    .duration(animationTime / 4) // Duration of the drawing effect in milliseconds
                    .attr("x2", scales.x(d.x)) // Animate x2 to the desired value
                    .attr("class", `line-y-${i}`);

                  setTimeout(() => {
                    const d_x =
                      Math.abs(d.x) > 10 ** 7
                        ? customFormatForBigNumber(d.x, 4)
                        : roundNumber(d.x, 4);
                    const d_y =
                      Math.abs(d.y) > 10 ** 7
                        ? customFormatForBigNumber(d.y, 4)
                        : roundNumber(d.y, 4);
                    // Show the tooltip after the lines are drawn
                    tooltip
                      .style("opacity", 1)
                      .html(
                        this.sharedState.scatterDatasets.selected.axis.x +
                          ": " +
                          d_x +
                          "<br/>" +
                          this.sharedState.scatterDatasets.selected.axis.y +
                          ": " +
                          d_y
                      )
                      .style("left", coords.x + 10 + "px")
                      .style("top", coords.y + 10 + "px");

                    setTimeout(
                      () => {
                        tooltip
                          .transition()
                          .duration(animationTime > 2000 ? 100 : 0)
                          .style("opacity", 0);
                      },
                      animationTime > 2000
                        ? animationTime / 2 - animationTime * 0.15 - 400
                        : animationTime / 2 - animationTime * 0.15 - 200
                    ); // Show the tooltip for ms

                    // Fade in the circle after the lines are drawn
                    scatter
                      .select(
                        `circle[cx="${scales.x(d.x)}"][cy="${scales.y(d.y)}"]`
                      )
                      .transition()
                      .duration(300)
                      .style("opacity", 1);
                  }, animationTime / 2 + animationTime * 0.15); // Total delay for drawing both lines
                }, i * animationTime); // This ensures the entire process is delayed for each point
              });

            // After animation delete the lines
            setTimeout(() => {
              for (let i = 0; i < this.totalDataLength; i++) {
                svg.select(`.line-x-${i}`).remove();
                svg.select(`.line-y-${i}`).remove();
              }
            }, this.totalDataLength * animationTime + 500);
          }

          const colorFormulaRoot =
            this.shadowRoot.querySelector(".color-formulas");
          if (
            selectedDatasets[0].filter.label &&
            selectedDatasets[0].filter.type !== "none" &&
            selectedDatasets.length === 1
          ) {
            if (!colorFormulaRoot) {
              return; // Exit the function if the element is not found
            }
            [...colorFormulaRoot.children].forEach((child) => child.remove());

            if (selectedDatasets[0].filter.type === "number") {
              selectedDatasets[0].filter.rangesandcolors.forEach(
                (rangeandcolor, i) => {
                  const tr = document.createElement("tr");
                  const td1 = document.createElement("td");
                  const td2 = document.createElement("td");
                  tr.appendChild(td1);
                  tr.appendChild(td2);
                  const colorSpan = document.createElement("span");
                  td1.appendChild(colorSpan);
                  const rangeSpan = document.createElement("span");
                  td2.appendChild(rangeSpan);
                  colorFormulaRoot.appendChild(tr);
                  colorSpan.classList.add("color-span");
                  colorSpan.style.background = rangeandcolor.color;
                  rangeSpan.innerText =
                    i === selectedDatasets[0].filter.rangesandcolors.length - 1
                      ? `[${rangeandcolor.range.min} - ${rangeandcolor.range.max}]`
                      : `[${rangeandcolor.range.min} - ${rangeandcolor.range.max})`;
                }
              );
            }
            if (selectedDatasets[0].filter.type === "string") {
              selectedDatasets[0].filter.labelsandcolors.forEach(
                (labelandcolor) => {
                  const tr = document.createElement("tr");
                  const td1 = document.createElement("td");
                  const td2 = document.createElement("td");
                  tr.appendChild(td1);
                  tr.appendChild(td2);
                  const colorSpan = document.createElement("span");
                  td1.appendChild(colorSpan);
                  const labelSpan = document.createElement("span");
                  td2.appendChild(labelSpan);
                  colorFormulaRoot.appendChild(tr);
                  colorSpan.classList.add("color-span");
                  colorSpan.style.background = labelandcolor.color;
                  labelSpan.innerText = `${labelandcolor.label}`;
                }
              );
            }
          }
        }
        // Handle adding a new point
        if (
          this.selectedIndextoAddNode !== null &&
          this.selectedIndextoAddNode !== undefined &&
          this.selectedIndextoAddNode >= 0 &&
          this.selectedIndextoAddNode <
            this.sharedState.scatterDatasets.selected.dataset_indexes.length
        ) {
          // Change cursor to a circle with the color of the selected dataset
          let color: string;
          this.sharedState.scatterDatasets.sets.forEach((set, index) => {
            if (
              this.sharedState.scatterDatasets.selected.dataset_indexes.indexOf(
                index
              ) === this.selectedIndextoAddNode
            ) {
              color = set.color;
            }
          });

          let circleCursorSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${color}" class="bi bi-circle-fill" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7"/>
</svg>
`;
          let circleCursorURL = `data:image/svg+xml;base64,${btoa(
            circleCursorSVG
          )}`;

          // Set the cursor style to the circle with the specified color
          svg.style("cursor", `url(${circleCursorURL}) 8 8, auto`); // Centered cursor
          svg.on("click", (event) => {
            addPointListeners(
              event,
              svg,
              scales,
              this.sharedState.scatterDatasets,
              this.selectedIndextoAddNode
            );
            this.addNode = false;
            this.selectedIndextoAddNode = undefined;
            this.hoverCursorChange = true;
            this.updateScatterplot();
            if (
              selectedDatasets.length === 1 &&
              (this.sharedState.scatterDatasets.selected.axis.x ===
                selectedDatasets[0].filter.label ||
                this.sharedState.scatterDatasets.selected.axis.y ===
                  selectedDatasets[0].filter.label) &&
              selectedDatasets[0].filter.type === "number"
            ) {
              updateColorForFilter(
                this.sharedState.scatterDatasets.selected.axis.x ===
                  selectedDatasets[0].filter.label
                  ? selectedDatasets[0].labels.indexOf(axisLabels.x)
                  : selectedDatasets[0].labels.indexOf(axisLabels.y),
                "number",
                selectedDatasets[0]
              );
              this.updateScatterplot();
            }
          });
        }
        // Add grid
        if (this.sharedState.chart.options.showGrid) {
          addGridListeners(svg, scales, dimensions);
        }
        //TODO: Limit the line to the scatterplot area
        // Handle dragging lines to new positions
        // Define the drag behavior for the center point of the line to move the entire line up down
        // Define the drag behavior for the center point
        let index_center = -1;
        this.isDragging = false;
        const dragCenter = d3
          .drag()
          .on("start", (event) => {
            d3.select(event.sourceEvent.target).classed("selected-rect", true);
            this.isDragging = true;
          })
          .on("drag", (event, d: PointOnlyNumbers) => {
            // Find index i of the line
            index_center = findIndexForLine(
              scales,
              d,
              this.sharedState.lineDatasets,
              index_center
            );
            if (index_center === -1) {
              return;
            }
            const indexForEndPointsLeft = d[0].x <= d[1].x ? 0 : 1;
            const indexForEndPointsRight = d[0].x <= d[1].x ? 1 : 0;
            const [newX, newY] = d3.pointer(event, svg.node());
            const dy = newY - (d[0].y + d[1].y) / 2;
            const dx = newX - (d[0].x + d[1].x) / 2;
            d[0].y += dy;
            d[1].y += dy;
            d[0].x += dx;
            d[1].x += dx;
            // Update the visual position of the line and points
            updateLineAndPoints(
              svg,
              scales,
              d,
              index_center,
              indexForEndPointsLeft,
              indexForEndPointsRight,
              false,
              this.sharedState.lineDatasets
            );
          })
          .on("end", () => {
            this.isDragging = false;
            this.updateScatterplot();
          });
        let index_right = -1;
        // Define the drag behavior for the end points of the line to rotate the line
        const dragEndPointsRight = d3
          .drag()
          .on("start", (event, _) => {
            d3.select(event.sourceEvent.target).classed("selected-rect", true);
            this.isDragging = true;
          })
          .on("drag", (event, d: PointOnlyNumbers) => {
            // Find index i of the line
            index_right = findIndexForLine(
              scales,
              d,
              this.sharedState.lineDatasets,
              index_right
            );
            if (index_right === -1) {
              return;
            }
            // Rotate the line around the center point
            const [newX, newY] = d3.pointer(event, svg.node());
            // Calculate the new position of the line
            d = calculateForRotation(d, newX, newY);
            // Update the visual position of the line and points
            updateLineAndPoints(
              svg,
              scales,
              d,
              index_right,
              0,
              1,
              false,
              this.sharedState.lineDatasets
            );
          })
          .on("end", () => {
            this.isDragging = false;
            this.updateScatterplot();
          });
        let index_left = -1;
        const dragEndPointsLeft = d3
          .drag()
          .on("start", (event, _) => {
            d3.select(event.sourceEvent.target).classed("selected-rect", true);
            this.isDragging = true;
          })
          .on("drag", (event, d: PointOnlyNumbers) => {
            // Find index i of the line
            index_left = findIndexForLine(
              scales,
              d,
              this.sharedState.lineDatasets,
              index_left
            );
            if (index_left === -1) {
              return;
            }
            // Rotate the line around the center point
            const [newX, newY] = d3.pointer(event, svg.node());
            // Calculate the new position of the line
            d = calculateForRotation(d, newX, newY);
            // Update the visual position of the line and points
            updateLineAndPoints(
              svg,
              scales,
              d,
              index_left,
              1,
              0,
              true,
              this.sharedState.lineDatasets
            );
          })
          .on("end", () => {
            this.isDragging = false;
            this.updateScatterplot();
          });
        // TODO: Delete the line by right click

        // Append the line and points
        this.sharedState.lineDatasets.sets.forEach((dataset, i) => {
          const x1 = scales.x(dataset.data[0].x);
          const y1 = scales.y(dataset.data[0].y);
          const x2 = scales.x(dataset.data[1].x);
          const y2 = scales.y(dataset.data[1].y);

          // Define the end points of the line
          const endPointsLeft = { x: x1, y: y1 };
          const endPointsRight = { x: x2, y: y2 };

          // Append the line
          svg
            .append("line")
            .attr("class", `line-${i}`)
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 2);

          // Define the center point of the line
          const center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };

          // Append the center point
          const centerpoint = svg
            .append("rect")
            .datum([endPointsLeft, endPointsRight])
            .attr("class", `center-point-${i}`)
            .attr("x", center.x - 5)
            .attr("y", center.y - 5)
            .attr("width", 10) // Width of the rectangle
            .attr("height", 10) // Height of the rectangle
            .attr("fill", "white") // Fill color of the rectangle
            .attr("stroke", "black")
            .attr("stroke-width", 1.5);

          // Append the end point left
          const end_point_left = svg
            .append("rect")
            .datum([endPointsLeft, endPointsRight])
            .attr("class", `end-point-left-${i}`)
            .attr("x", endPointsLeft.x - 5) // Position of the rectangle
            .attr("y", endPointsLeft.y - 5) // 5 is half of the width and height of the rectangle
            .attr("width", 10) // Width of the rectangle
            .attr("height", 10) // Height of the rectangle
            .attr("fill", "white") // Fill color of the rectangle
            .attr("stroke", "black")
            .attr("stroke-width", 1.5);

          // Append the end point right
          const end_point_right = svg
            .append("rect")
            .datum([endPointsLeft, endPointsRight])
            .attr("class", `end-point-right-${i}`)
            .attr("x", endPointsRight.x - 5)
            .attr("y", endPointsRight.y - 5)
            .attr("width", 10) // Width of the rectangle
            .attr("height", 10) // Height of the rectangle
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5);

          //----------- manipulate the line without condition
          if (
            !(
              this.selectByClicking ||
              this.selectedIndextoAddNode !== undefined ||
              this.drawLine ||
              this.selectByBrushing ||
              this.deselectByBrushing
            )
          ) {
            // delete line by right click on line
            svg.select(`.line-${i}`).on("contextmenu", (_) => {
              this.sharedState.lineDatasets.sets.splice(i, 1);
              this.updateScatterplot();
            });
            // Delete line by right click on center point
            svg
              .select(`.center-point-${i}`)
              .on("contextmenu", (event) => {
                deleteLineListeners(
                  event,
                  svg,
                  lineDatasetsWithCenterPoint,
                  scales,
                  this.sharedState.lineDatasets
                );
                this.updateScatterplot();
              })
              .on("mouseover", () => {
                if (this.hoverCursorChange) {
                  svg.style("cursor", "move");
                }
              })
              .on("mouseleave", () => {
                svg.style("cursor", "default");
              });
            // delete line by right click on end point left
            svg
              .select(`.end-point-left-${i}`)
              .on("contextmenu", (event) => {
                deleteLineListeners(
                  event,
                  svg,
                  lineDatasetsWithCenterPoint,
                  scales,
                  this.sharedState.lineDatasets
                );
                this.updateScatterplot();
              })
              .on("mouseover", () => {
                if (this.hoverCursorChange) {
                  svg.style("cursor", "move");
                }
              })
              .on("mouseleave", () => {
                svg.style("cursor", "default");
              });
            // delete line by right click on end point right
            svg
              .select(`.end-point-right-${i}`)
              .on("contextmenu", (event) => {
                deleteLineListeners(
                  event,
                  svg,
                  lineDatasetsWithCenterPoint,
                  scales,
                  this.sharedState.lineDatasets
                );
                this.updateScatterplot();
              })
              .on("mouseover", () => {
                if (this.hoverCursorChange) {
                  svg.style("cursor", "move");
                }
              })
              .on("mouseleave", () => {
                svg.style("cursor", "default");
              });

            // Dragging line
            centerpoint.call(dragCenter);
            end_point_left.call(dragEndPointsLeft);
            end_point_right.call(dragEndPointsRight);
          }

          //-----------
          if (this.sharedState.chart.options.animation) {
            svg
              .select(`.line-${i}`)
              .style("opacity", 0)
              .transition()
              .delay(this.totalDataLength * animationTime + 850 + 300 * (i + 1))
              .duration(300)
              .style("opacity", 1);
            svg
              .select(`.center-point-${i}`)
              .style("opacity", 0)
              .transition()
              .delay(this.totalDataLength * animationTime + 850 + 300 * (i + 1))
              .duration(300)
              .style("opacity", 1);
            svg
              .select(`.end-point-left-${i}`)
              .style("opacity", 0)
              .transition()
              .delay(this.totalDataLength * animationTime + 850 + 300 * (i + 1))
              .duration(300)
              .style("opacity", 1);
            svg
              .select(`.end-point-right-${i}`)
              .style("opacity", 0)
              .transition()
              .delay(this.totalDataLength * animationTime + 850 + 300 * (i + 1))
              .duration(300)
              .style("opacity", 1);
          }
        });
        // For line formulas
        const lineFormulaRoot = this.shadowRoot.querySelector(".line-formulas");
        lineFormulaRoot.children
          ? [...lineFormulaRoot.children].forEach((child) => child.remove())
          : null;
        this.sharedState.lineDatasets.sets.forEach((dataset) => {
          const tr = document.createElement("tr");
          const td = document.createElement("td");
          tr.appendChild(td);
          const lineSpan = document.createElement("span");
          td.appendChild(lineSpan);
          lineFormulaRoot.appendChild(tr);
          const a =
            (dataset.data[1].y - dataset.data[0].y) /
            (dataset.data[1].x - dataset.data[0].x);
          const b =
            dataset.data[0].y -
            ((dataset.data[1].y - dataset.data[0].y) /
              (dataset.data[1].x - dataset.data[0].x)) *
              dataset.data[0].x;
          const lineFormula = `y = ${
            Math.abs(a) > 10 ** 7
              ? customFormatForBigNumber(a, 4)
              : roundNumber(a, 4)
          }x + ${
            Math.abs(b) > 10 ** 7
              ? customFormatForBigNumber(b, 4)
              : roundNumber(b, 4)
          }`;
          lineSpan.innerText = lineFormula;
        });
      }
    } else if (selectedDatasets.length === 1) {
      //-----------------------------------------------
      const selectedDataset = selectedDatasets[0];
      const axisLabels = {
        x: clampLabel(this.sharedState.scatterDatasets.selected.axis.x, 42),
        y: clampLabel(this.sharedState.scatterDatasets.selected.axis.y, 42),
      };
      let datasets: Point[] = [];
      let singeledatasets: OneDimentionalPoint[] = [];
      let datasets_copy: {
        x: number | string;
        y: number | string;
      }[] = [];
      const count_labels_in_x_axis = selectedDataset.dimensional_data.length;
      selectedDataset.dimensional_data.map((dimensional_data) => {
        const d = {
          x: (() => {
            const value =
              dimensional_data.data[
                selectedDataset.labels.indexOf(
                  this.sharedState.scatterDatasets.selected.axis.x
                )
              ];
            if (typeof value === "string")
              return clampLabelForXAxis(value, count_labels_in_x_axis);
            return value;
          })(),
          y: (() => {
            const value =
              dimensional_data.data[
                selectedDataset.labels.indexOf(
                  this.sharedState.scatterDatasets.selected.axis.y
                )
              ];
            if (typeof value === "string") return clampLabel(value);
            return value;
          })(),
        };
        return datasets_copy.push(d);
      });
      let singeledatasets_copy: {
        p: number | string;
      }[] = [];
      singeledatasets_copy = selectedDataset.dimensional_data.map(
        (dimensional_data) => {
          const d = {
            p:
              x_axis_type === "none"
                ? (() => {
                    const value =
                      dimensional_data.data[
                        selectedDataset.labels.indexOf(
                          this.sharedState.scatterDatasets.selected.axis.y
                        )
                      ];
                    if (typeof value === "string") return clampLabel(value);
                    return value;
                  })()
                : (() => {
                    const value =
                      dimensional_data.data[
                        selectedDataset.labels.indexOf(
                          this.sharedState.scatterDatasets.selected.axis.x
                        )
                      ];
                    if (typeof value === "string")
                      return clampLabelForXAxis(value, count_labels_in_x_axis);
                    return value;
                  })(),
          };
          return d;
        }
      );

      let data_for_x_axis_copy: { x: number | string; y: number | string }[];
      let data_for_y_axis_copy: { x: number | string; y: number | string }[];

      !(x_axis_type === "none") && !(y_axis_type === "none")
        ? (data_for_x_axis_copy = datasets_copy)
        : !(x_axis_type === "none")
        ? (data_for_x_axis_copy = singeledatasets_copy.map((d) => ({
            x: d.p,
            y: "",
          })))
        : (data_for_x_axis_copy = singeledatasets_copy.map((d) => ({
            x: "",
            y: d.p,
          })));
      !(x_axis_type === "none") && !(y_axis_type === "none")
        ? (data_for_y_axis_copy = datasets_copy)
        : !(y_axis_type === "none")
        ? (data_for_y_axis_copy = singeledatasets_copy.map((d) => ({
            x: "",
            y: d.p,
          })))
        : (data_for_y_axis_copy = singeledatasets_copy.map((d) => ({
            x: d.p,
            y: "",
          })));

      const { svg, scales, dimensions, bandwidth_result } =
        drawScatterplot_singleDataset(
          root,
          data_for_x_axis_copy,
          data_for_y_axis_copy,
          x_axis_type,
          y_axis_type,
          axisLabels,
          this.sharedState.scatterDatasets.title
        );

      // Check if x or y is a string and if an offset needs to be applied
      selectedDataset.dimensional_data.forEach((dataset, i) => {
        const color = dataset.color ? dataset.color : selectedDataset.color;
        const id = selectedDataset.ids[i];
        let offset = 0;
        const selected = dataset.selected;
        if (!(x_axis_type === "none") && !(y_axis_type === "none")) {
          let x =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.x
              )
            ];
          if (typeof x === "string")
            x = clampLabelForXAxis(x, count_labels_in_x_axis);
          let y =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.y
              )
            ];
          if (typeof y === "string") y = clampLabel(y);
          // Check if x or y is a string and if an offset needs to be applied
          if (x_axis_type === "string" && y_axis_type === "number") {
            offset = calculateOffset(datasets, "x", x, y);
          } else if (y_axis_type === "string" && x_axis_type === "number") {
            offset = calculateOffset(datasets, "y", y, x);
          } else if (y_axis_type === "string" && x_axis_type === "string") {
            offset = calculateOffset(datasets, "y", y, x);
          }

          datasets.push({ x, y, selected, offset, color, id });
        } else if (x_axis_type === "none" && !(y_axis_type === "none")) {
          let y =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.y
              )
            ];
          if (typeof y === "string") y = clampLabel(y);
          offset = calculateOffset(singeledatasets, "x_none", null, y);
          singeledatasets.push({ p: y, selected, offset, color, id });
        } else if (!(x_axis_type === "none") && y_axis_type === "none") {
          let x =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.x
              )
            ];
          if (typeof x === "string")
            x = clampLabelForXAxis(x, count_labels_in_x_axis);
          offset = calculateOffset(singeledatasets, "y_none", null, x);
          singeledatasets.push({ p: x, selected, offset, color, id });
        }
      });
      // Calculate the offset for the scatterplot
      function calculateOffset(
        datasets:
          | {
              x: number | string;
              y: number | string;
              offset?: number;
              color?: string;
              label?: string;
              scatter_titel?: string;
            }[]
          | {
              p: number | string;
              offset?: number;
              color?: string;
              label?: string;
              scatter_titel?: string;
            }[],
        string_axis: "x" | "y" | "x_none" | "y_none",
        this_value: string | number,
        other_value: string | number
      ): number {
        let offset = 0;
        const otherAxis =
          string_axis === "x"
            ? "y"
            : string_axis === "y"
            ? "x"
            : string_axis === "x_none"
            ? "y"
            : "x";
        const filteredData = datasets.filter((d) =>
          string_axis === "x" || string_axis === "y"
            ? d[string_axis] === this_value && d[otherAxis] === other_value
            : d["p"] === other_value
        );
        const count = filteredData.length;
        let distance = 12;
        string_axis === "x"
          ? (distance = calculateDistanceOfOffset(
              string_axis,
              this_value,
              other_value
            ))
          : string_axis === "y"
          ? (distance = calculateDistanceOfOffset(
              string_axis,
              other_value,
              this_value
            ))
          : string_axis === "x_none"
          ? (distance = calculateDistanceOfOffset(
              string_axis,
              this_value,
              other_value
            ))
          : (distance = calculateDistanceOfOffset(
              string_axis,
              other_value,
              this_value
            ));
        if (count > 0) {
          // Diameter of each point (12)
          offset = count * distance;
        }

        return offset;
      }
      function calculateDistanceOfOffset(
        string_axis: "x" | "y" | "x_none" | "y_none",
        x_value: string | number,
        y_value: string | number
      ) {
        //Diameter of each point (12)
        let defaultDistance = 12; // Default distance between points (center to center)

        const filteredData =
          string_axis === "x" || string_axis === "y"
            ? datasets_copy.filter((d) => d.x === x_value && d.y === y_value)
            : string_axis === "x_none"
            ? singeledatasets_copy.filter((d) => d.p === y_value)
            : singeledatasets_copy.filter((d) => d.p === x_value);
        const count = filteredData.length; // Number of data points
        const bandwidth =
          string_axis === "x"
            ? bandwidth_result.x_bandwidth
            : string_axis === "y"
            ? bandwidth_result.y_bandwidth
            : string_axis === "x_none"
            ? dimensions.width
            : dimensions.height; // Assuming x is a scale object with a bandwidth method

        let distance = defaultDistance; // Set initial distance to the default

        if (count * defaultDistance > bandwidth) {
          // If the total width of points exceeds the bandwidth, reduce the distance
          distance =
            defaultDistance -
            (count * defaultDistance - bandwidth + 12) / count;
        }

        return distance;
      }
      const { scatter, tooltip } = drawScatterplot_singleDataset2(
        root,
        svg,
        x_axis_type,
        y_axis_type,
        datasets,
        singeledatasets,
        scales,
        dimensions,
        bandwidth_result,
        {
          hoverCursorChange: this.hoverCursorChange,
          hoverTooltip: this.sharedState.chart.options.hoverTooltip,
        } as any,
        {
          x: this.sharedState.scatterDatasets.selected.axis.x,
          y: this.sharedState.scatterDatasets.selected.axis.y,
        }
      );

      const listofstringsforlabels_x_axis: string[] = [];
      if (x_axis_type === "string") {
        datasets_copy.forEach((d) => {
          if (!listofstringsforlabels_x_axis.includes(d.x as string)) {
            listofstringsforlabels_x_axis.push(d.x as string);
          }
        });
      }
      const listofstringsforlabels_y_axis: string[] = [];
      if (y_axis_type === "string") {
        datasets_copy.forEach((d) => {
          if (!listofstringsforlabels_y_axis.includes(d.y as string)) {
            listofstringsforlabels_y_axis.push(d.y as string);
          }
        });
      }
      if (
        (x_axis_type !== "none" &&
          y_axis_type !== "none" &&
          datasets.length > 0) ||
        (((x_axis_type === "none" && y_axis_type !== "none") ||
          (y_axis_type === "none" && x_axis_type !== "none")) &&
          singeledatasets.length > 0)
      ) {
        // Brushing for select or deselect points
        const select_deselect =
          this.selectByBrushing === true
            ? "select"
            : this.deselectByBrushing === true
            ? "deselect"
            : undefined;
        // Flag to track if brushing is enabled
        if (
          (this.selectByBrushing || this.deselectByBrushing) &&
          !this.selectByClicking
        ) {
          let brushingEnabled = true;
          const brush = d3
            .brush()
            .extent([
              [0, 0],
              [dimensions.width, dimensions.height],
            ])
            .on("start brush", (event) => {
              if (!brushingEnabled) return; // Exit if brushing is disabled
              const selection = event.selection;
              if (selection) {
                const x0 = selection[0][0],
                  x1 = selection[1][0],
                  y0 = selection[0][1],
                  y1 = selection[1][1];
                datasets.forEach((d: Point, i) => {
                  // Reset
                  scatter
                    .select(`.dataset-${i}`)
                    .classed("selected", d.selected);
                  // Determine the cx and cy based on the type of axis (number or string)
                  const cx =
                    x_axis_type === "number"
                      ? scales.x_num(d.x as number)
                      : y_axis_type === "number"
                      ? scales.x_band(d.x as string) + 6 + d.offset
                      : scales.x_band(d.x as string) +
                        bandwidth_result.x_bandwidth / 2;

                  const cy =
                    y_axis_type === "number"
                      ? scales.y_num(d.y as number)
                      : scales.y_band(d.y as string) -
                        6 -
                        d.offset +
                        bandwidth_result.y_bandwidth;
                  //console.log("Point" + i + "p" + "Cx" + cx + "Cy" + cy);
                  //console.log("X0 " + x0 + "X1 " + x1 + "Y0 " + y0 + "Y1 " + y1);
                  const boolean = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;

                  if (boolean) {
                    scatter
                      .select(`.dataset-${i}`)
                      .classed("selected", select_deselect === "select");
                  }
                });
                singeledatasets.forEach((d: OneDimentionalPoint, i) => {
                  // Reset

                  if (x_axis_type === "none" && y_axis_type === "number") {
                    scatter
                      .select(`.single-y-${i}`)
                      .classed("selected", d.selected);
                  } else if (
                    x_axis_type === "number" &&
                    y_axis_type === "none"
                  ) {
                    scatter
                      .select(`.single-x-${i}`)
                      .classed("selected", d.selected);
                  } else if (
                    x_axis_type === "none" &&
                    y_axis_type === "string"
                  ) {
                    scatter
                      .select(`.single-string-y-${i}`)
                      .classed("selected", d.selected);
                  } else if (
                    x_axis_type === "string" &&
                    y_axis_type === "none"
                  ) {
                    scatter
                      .select(`.single-string-x-${i}`)
                      .classed("selected", d.selected);
                  }

                  const cx =
                    x_axis_type === "none"
                      ? 6 + d.offset
                      : x_axis_type === "number"
                      ? scales.x_num(d.p as number)
                      : scales.x_band(d.p as string) +
                        bandwidth_result.x_bandwidth / 2;
                  const cy =
                    y_axis_type === "none"
                      ? -6 + dimensions.height - d.offset
                      : y_axis_type === "number"
                      ? scales.y_num(d.p as number)
                      : scales.y_band(d.p as string) +
                        bandwidth_result.y_bandwidth / 2;
                  const boolean = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                  if (boolean) {
                    if (x_axis_type === "none" && y_axis_type === "number") {
                      scatter
                        .select(`.single-y-${i}`)
                        .classed("selected", select_deselect === "select");
                    } else if (
                      x_axis_type === "number" &&
                      y_axis_type === "none"
                    ) {
                      scatter
                        .select(`.single-x-${i}`)
                        .classed("selected", select_deselect === "select");
                    } else if (
                      x_axis_type === "none" &&
                      y_axis_type === "string"
                    ) {
                      scatter
                        .select(`.single-string-y-${i}`)
                        .classed("selected", select_deselect === "select");
                    } else if (
                      x_axis_type === "string" &&
                      y_axis_type === "none"
                    ) {
                      scatter
                        .select(`.single-string-x-${i}`)
                        .classed("selected", select_deselect === "select");
                    }
                  }
                });
              }
            })
            .on("end", (event) => {
              if (!brushingEnabled) return; // Exit if brushing is disabled
              const selection = event.selection;
              // Set the selected points to the shared state
              if (selection) {
                datasets.forEach((d: Point, i) => {
                  const cx =
                    x_axis_type === "number"
                      ? scales.x_num(d.x as number)
                      : y_axis_type === "number"
                      ? scales.x_band(d.x as string) + 6 + d.offset
                      : scales.x_band(d.x as string) +
                        bandwidth_result.x_bandwidth / 2;
                  const cy =
                    y_axis_type === "number"
                      ? scales.y_num(d.y as number)
                      : scales.y_band(d.y as string) -
                        6 -
                        d.offset +
                        bandwidth_result.y_bandwidth;
                  const boolean =
                    selection[0][0] <= cx &&
                    cx <= selection[1][0] &&
                    selection[0][1] <= cy &&
                    cy <= selection[1][1];
                  if (boolean) {
                    selectedDataset.dimensional_data[i].selected =
                      select_deselect === "select";
                  }
                });
                singeledatasets.forEach((d: OneDimentionalPoint, i) => {
                  const cx =
                    x_axis_type === "none"
                      ? 6 + d.offset
                      : x_axis_type === "number"
                      ? scales.x_num(d.p as number)
                      : scales.x_band(d.p as string) +
                        bandwidth_result.x_bandwidth / 2;
                  const cy =
                    y_axis_type === "none"
                      ? -6 + dimensions.height - d.offset
                      : y_axis_type === "number"
                      ? scales.y_num(d.p as number)
                      : scales.y_band(d.p as string) +
                        bandwidth_result.y_bandwidth / 2;
                  const boolean =
                    selection[0][0] <= cx &&
                    cx <= selection[1][0] &&
                    selection[0][1] <= cy &&
                    cy <= selection[1][1];
                  if (boolean) {
                    selectedDataset.dimensional_data[i].selected =
                      select_deselect === "select";
                  }
                });
              }
              brushingEnabled = false; // Disable brushing after the first brush
              // delete the brush
              svg.call(brush.move, null); // Clear the brush selection
              svg.on(".brush", null); // Remove brush event listeners
              svg.selectAll(".overlay").remove(); // Remove any overlay elements created by brushing
              this.selectByBrushing = false;
              this.deselectByBrushing = false;
              this.updateScatterplot();
            });
          svg.call(brush);
        }
        // Select by clicking
        // Clicking for selecting points
        if (
          this.selectByClicking &&
          !this.selectByBrushing &&
          !this.deselectByBrushing
        ) {
          // Change cursor to a hand with a pointing finger
          svg.style("cursor", "pointer");
          let minDistance = Infinity;
          let minDistance_band = Infinity;
          let index = -1;
          let count = 0;
          let index_set: number[] = [];
          const clicked = (
            axis:
              | "x_num"
              | "y_num"
              | "xy_xnum_ystr"
              | "xy_xstr_ynum"
              | "x_string"
              | "y_string"
              | "xy_xstr_ystr",
            event: MouseEvent
          ) => {
            const [clickX, clickY] = d3.pointer(event, svg.node());
            const oldX =
              axis === "x_num" || axis === "xy_xnum_ystr"
                ? scales.x_num.invert(clickX)
                : scales.x_none.invert(clickX);
            const oldY =
              axis === "y_num" || axis === "xy_xstr_ynum"
                ? scales.y_num.invert(clickY)
                : scales.y_none.invert(clickY);
            if (axis === "x_num" || axis === "y_num") {
              for (let i = 0; i < singeledatasets.length; i++) {
                if (
                  Math.abs(
                    (singeledatasets[i].p as number) -
                      (axis === "x_num" ? oldX : oldY)
                  ) < minDistance
                ) {
                  index = i;
                  minDistance = Math.abs(
                    (singeledatasets[i].p as number) -
                      (axis === "x_num" ? oldX : oldY)
                  );
                }
              }
              for (let i = 0; i < singeledatasets.length; i++) {
                if (
                  Math.abs(
                    (singeledatasets[i].p as number) -
                      (axis === "x_num" ? oldX : oldY)
                  ) === minDistance
                ) {
                  index_set.push(i);
                  count++;
                }
              }
              if (count > 1) {
                for (let i = 0; i < index_set.length; i++) {
                  if (
                    Math.abs(
                      (axis === "x_num" ? oldY : oldX) -
                        (singeledatasets[index_set[i]].offset + 6)
                    ) < minDistance_band
                  ) {
                    index = index_set[i];
                    minDistance_band = Math.abs(
                      (axis === "x_num" ? oldY : oldX) -
                        (singeledatasets[index_set[i]].offset + 6)
                    );
                  }
                }
              }
            } else if (axis === "xy_xnum_ystr" || axis === "xy_xstr_ynum") {
              for (let i = 0; i < datasets.length; i++) {
                if (
                  axis === "xy_xnum_ystr"
                    ? Math.abs((datasets[i].x as number) - oldX) < minDistance
                    : Math.abs((datasets[i].y as number) - oldY) < minDistance
                ) {
                  index = i;
                  minDistance =
                    axis === "xy_xnum_ystr"
                      ? Math.abs((datasets[i].x as number) - oldX)
                      : Math.abs((datasets[i].y as number) - oldY);
                }
              }
              for (let i = 0; i < datasets.length; i++) {
                if (
                  axis === "xy_xnum_ystr"
                    ? Math.abs((datasets[i].x as number) - oldX) === minDistance
                    : Math.abs((datasets[i].y as number) - oldY) === minDistance
                ) {
                  index_set.push(i);
                  count++;
                }
              }
              if (count > 1) {
                for (let i = 0; i < index_set.length; i++) {
                  if (
                    axis === "xy_xnum_ystr"
                      ? Math.abs(
                          oldY -
                            (listofstringsforlabels_y_axis.indexOf(
                              datasets[index_set[i]].y as string
                            ) *
                              bandwidth_result.y_bandwidth +
                              datasets[index_set[i]].offset +
                              6)
                        ) < minDistance_band
                      : Math.abs(
                          oldX -
                            (listofstringsforlabels_x_axis.indexOf(
                              datasets[index_set[i]].x as string
                            ) *
                              bandwidth_result.x_bandwidth +
                              datasets[index_set[i]].offset +
                              6)
                        ) < minDistance_band
                  ) {
                    index = index_set[i];
                    minDistance_band =
                      axis === "xy_xnum_ystr"
                        ? Math.abs(
                            oldY -
                              (listofstringsforlabels_y_axis.indexOf(
                                datasets[index_set[i]].y as string
                              ) *
                                bandwidth_result.y_bandwidth +
                                datasets[index_set[i]].offset +
                                6)
                          )
                        : Math.abs(
                            oldX -
                              (listofstringsforlabels_x_axis.indexOf(
                                datasets[index_set[i]].x as string
                              ) *
                                bandwidth_result.x_bandwidth +
                                datasets[index_set[i]].offset +
                                6)
                          );
                  }
                }
              }
            } else if (axis === "x_string" || axis === "y_string") {
              for (let i = 0; i < singeledatasets.length; i++) {
                if (
                  axis === "y_string"
                    ? Math.abs(
                        oldY -
                          (listofstringsforlabels_y_axis.indexOf(
                            singeledatasets[i].p as string
                          ) +
                            1 / 2) *
                            bandwidth_result.y_bandwidth
                      ) < minDistance_band
                    : Math.abs(
                        oldX -
                          (listofstringsforlabels_x_axis.indexOf(
                            singeledatasets[i].p as string
                          ) +
                            1 / 2) *
                            bandwidth_result.x_bandwidth
                      ) < minDistance_band
                ) {
                  index = i;
                  minDistance_band =
                    axis === "y_string"
                      ? Math.abs(
                          oldY -
                            (listofstringsforlabels_y_axis.indexOf(
                              singeledatasets[i].p as string
                            ) +
                              1 / 2) *
                              bandwidth_result.y_bandwidth
                        )
                      : Math.abs(
                          oldX -
                            (listofstringsforlabels_x_axis.indexOf(
                              singeledatasets[i].p as string
                            ) +
                              1 / 2) *
                              bandwidth_result.x_bandwidth
                        );
                }
              }
              for (let i = 0; i < singeledatasets.length; i++) {
                if (
                  axis === "y_string"
                    ? Math.abs(
                        oldY -
                          (listofstringsforlabels_y_axis.indexOf(
                            singeledatasets[i].p as string
                          ) +
                            1 / 2) *
                            bandwidth_result.y_bandwidth
                      ) === minDistance_band
                    : Math.abs(
                        oldX -
                          (listofstringsforlabels_x_axis.indexOf(
                            singeledatasets[i].p as string
                          ) +
                            1 / 2) *
                            bandwidth_result.x_bandwidth
                      ) === minDistance_band
                ) {
                  index_set.push(i);
                  count++;
                }
              }
              if (count > 1) {
                for (let i = 0; i < index_set.length; i++) {
                  if (
                    Math.abs(
                      (axis === "x_string" ? oldY : oldX) -
                        (singeledatasets[index_set[i]].offset + 6)
                    ) < minDistance
                  ) {
                    index = index_set[i];
                    minDistance = Math.abs(
                      (axis === "x_string" ? oldY : oldX) -
                        (singeledatasets[index_set[i]].offset + 6)
                    );
                  }
                }
              }
            } else if (axis === "xy_xstr_ystr") {
              for (let i = 0; i < datasets.length; i++) {
                if (
                  Math.abs(
                    oldX -
                      (listofstringsforlabels_x_axis.indexOf(
                        datasets[i].x as string
                      ) +
                        1 / 2) *
                        bandwidth_result.x_bandwidth
                  ) < minDistance
                ) {
                  index = i;
                  minDistance = Math.abs(
                    oldX -
                      (listofstringsforlabels_x_axis.indexOf(
                        datasets[i].x as string
                      ) +
                        1 / 2) *
                        bandwidth_result.x_bandwidth
                  );
                }
              }
              for (let i = 0; i < datasets.length; i++) {
                if (
                  Math.abs(
                    oldX -
                      (listofstringsforlabels_x_axis.indexOf(
                        datasets[i].x as string
                      ) +
                        1 / 2) *
                        bandwidth_result.x_bandwidth
                  ) === minDistance
                ) {
                  index_set.push(i);
                  count++;
                }
              }
              if (count > 1) {
                for (let i = 0; i < index_set.length; i++) {
                  if (
                    Math.abs(
                      oldY -
                        (listofstringsforlabels_y_axis.indexOf(
                          datasets[index_set[i]].y as string
                        ) *
                          bandwidth_result.y_bandwidth +
                          datasets[index_set[i]].offset +
                          6)
                    ) < minDistance_band
                  ) {
                    index = index_set[i];
                    minDistance_band = Math.abs(
                      oldY -
                        (listofstringsforlabels_y_axis.indexOf(
                          datasets[index_set[i]].y as string
                        ) *
                          bandwidth_result.y_bandwidth +
                          datasets[index_set[i]].offset +
                          6)
                    );
                  }
                }
              }
            }
            // Update the nearest point to be selected
            if (index !== -1) {
              selectedDataset.dimensional_data[index].selected =
                !selectedDataset.dimensional_data[index].selected;
            }
            this.selectByClicking = false;
            this.hoverCursorChange = true;
            this.updateScatterplot();
          };
          // Click event listener
          singeledatasets.forEach((_, i) => {
            svg
              .select(`.single-x-${i}`)
              .on("click", (event) => clicked("x_num", event));
            svg
              .select(`.single-y-${i}`)
              .on("click", (event) => clicked("y_num", event));
            svg
              .select(`.single-string-x-${i}`)
              .on("click", (event) => clicked("x_string", event));
            svg
              .select(`.single-string-y-${i}`)
              .on("click", (event) => clicked("y_string", event));
          });
          datasets.forEach((_, i) => {
            x_axis_type === "number" && y_axis_type === "string"
              ? svg
                  .select(`.dataset-${i}`)
                  .on("click", (event) => clicked("xy_xnum_ystr", event))
              : x_axis_type === "string" && y_axis_type === "number"
              ? svg
                  .select(`.dataset-${i}`)
                  .on("click", (event) => clicked("xy_xstr_ynum", event))
              : x_axis_type === "string" && y_axis_type === "string"
              ? svg
                  .select(`.dataset-${i}`)
                  .on("click", (event) => clicked("xy_xstr_ystr", event))
              : null;
          });
        }
        //Hide selected points
        if (this.hideSelected) {
          singeledatasets.forEach((d: OneDimentionalPoint, i) => {
            if (d.selected) {
              scatter.select(`.single-x-${i}`).style("display", "none");
              scatter.select(`.single-y-${i}`).style("display", "none");
              scatter.select(`.single-string-x-${i}`).style("display", "none");
              scatter.select(`.single-string-y-${i}`).style("display", "none");
            }
          });
          datasets.forEach((d: Point, i) => {
            if (d.selected) {
              scatter.select(`.dataset-${i}`).style("display", "none");
            }
          });
        }
        //Hide unselected points
        if (this.hideUnselected) {
          singeledatasets.forEach((d: OneDimentionalPoint, i) => {
            if (!d.selected) {
              scatter.select(`.single-x-${i}`).style("display", "none");
              scatter.select(`.single-y-${i}`).style("display", "none");
              scatter.select(`.single-string-x-${i}`).style("display", "none");
              scatter.select(`.single-string-y-${i}`).style("display", "none");
            }
          });
          datasets.forEach((d: Point, i) => {
            if (!d.selected) {
              scatter.select(`.dataset-${i}`).style("display", "none");
            }
          });
        }
        // Show all points
        if (this.showAll) {
          singeledatasets.forEach((_, i) => {
            scatter.select(`.single-x-${i}`).style("display", "block");
            scatter.select(`.single-y-${i}`).style("display", "block");
            scatter.select(`.single-string-x-${i}`).style("display", "block");
            scatter.select(`.single-string-y-${i}`).style("display", "block");
          });
          datasets.forEach((_, i) => {
            scatter.select(`.dataset-${i}`).style("display", "block");
          });
        }

        // Draw line for mean of x or y data
        //TODO: Pos. of the tooltip and the mean line
        if (
          (x_axis_type === "number" || y_axis_type === "number") &&
          this.sharedState.chart.options.showMean
        ) {
          const meanLine = (
            axis: "x" | "y" | "xy_xnum_ystr" | "xy_xstr_ynum"
          ) => {
            const data =
              axis === "x" || axis === "xy_xnum_ystr"
                ? data_for_x_axis_copy
                : data_for_y_axis_copy;
            const mean = d3.mean(data, (d) =>
              Number(axis === "x" || axis === "xy_xnum_ystr" ? d.x : d.y)
            );
            if (axis === "x" || axis === "y") {
              svg
                .append("line")
                .attr("class", `mean-line-${axis}`)
                .attr("x1", axis === "x" ? scales.x_num(mean) : 0)
                .attr("y1", axis === "y" ? scales.y_num(mean) : 0)
                .attr(
                  "x2",
                  axis === "x" ? scales.x_num(mean) : dimensions.width
                )
                .attr(
                  "y2",
                  axis === "y" ? scales.y_num(mean) : dimensions.height
                )
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4")
                .style("opacity", 1);
              //Make the mean line label on the left side of the line
              svg
                .append("text")
                .attr("class", "line label")
                .text(
                  `m = ${
                    Math.abs(mean) > 10 ** 3
                      ? customFormatForBigNumber(mean, 2)
                      : roundNumber(mean, 2)
                  }`
                )
                .attr("fill", "red");
              if (axis === "x") {
                svg
                  .select(".line.label")
                  .attr("text-anchor", "start")
                  .attr("x", scales.x_num(mean) + 5)
                  .attr("y", 10);
              } else {
                svg
                  .select(".line.label")
                  .attr("text-anchor", "end")
                  .attr("x", dimensions.width)
                  .attr("y", scales.y_num(mean) - 5);
              }
              if (this.sharedState.chart.options.animation) {
                svg
                  .select(`.mean-line-${axis}`)
                  .style("opacity", 0)
                  .transition()
                  .delay(singeledatasets.length * animationTime + 150)
                  .duration(300)
                  .style("opacity", 1);
                svg
                  .select(".line.label")
                  .style("opacity", 0)
                  .transition()
                  .delay(singeledatasets.length * animationTime + 200)
                  .duration(300)
                  .style("opacity", 1);
              }
            } else {
              if (axis === "xy_xnum_ystr") {
                listofstringsforlabels_y_axis.map((l, i) => {
                  const mean_i = d3.mean(
                    datasets_copy.filter((d) => d.y === l),
                    (d) => Number(d.x)
                  );
                  svg
                    .append("line")
                    .attr("x1", scales.x_num(mean_i))
                    .attr(
                      "y1",
                      dimensions.height - i * bandwidth_result.y_bandwidth
                    )
                    .attr("x2", scales.x_num(mean_i))
                    .attr(
                      "y2",
                      dimensions.height - (i + 1) * bandwidth_result.y_bandwidth
                    )
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "4")
                    .attr("class", `mean-line-${axis}-${i}`);
                  svg
                    .append("text")
                    .attr("class", `line-label-${i}`)
                    .attr("text-anchor", "end")
                    .attr("x", scales.x_num(mean_i) - 5)
                    .attr(
                      "y",
                      dimensions.height -
                        (i + 1) * bandwidth_result.y_bandwidth +
                        10
                    )
                    .text(
                      `m = ${
                        Math.abs(mean_i) > 10 ** 3
                          ? customFormatForBigNumber(mean_i, 2)
                          : roundNumber(mean_i, 2)
                      }`
                    )
                    .attr("fill", "red");
                  if (this.sharedState.chart.options.animation) {
                    svg
                      .select(`.mean-line-${axis}-${i}`)
                      .style("opacity", 0)
                      .transition()
                      .delay(datasets.length * animationTime + 150 * (i + 1))
                      .duration(300)
                      .style("opacity", 1);
                    svg
                      .select(`.line-label-${i}`)
                      .style("opacity", 0)
                      .transition()
                      .delay(datasets.length * animationTime + 150 * (i + 1))
                      .duration(300)
                      .style("opacity", 1);
                  }
                });
              } else {
                listofstringsforlabels_x_axis.map((l, i) => {
                  const mean_i = d3.mean(
                    datasets_copy.filter((d) => d.x === l),
                    (d) => Number(d.y)
                  );
                  svg
                    .append("line")
                    .attr("x1", i * bandwidth_result.x_bandwidth)
                    .attr("y1", scales.y_num(mean_i))
                    .attr("x2", (i + 1) * bandwidth_result.x_bandwidth)
                    .attr("y2", scales.y_num(mean_i))
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "4")
                    .attr("class", `mean-line-${axis}-${i}`);
                  svg
                    .append("text")
                    .attr("class", `line-label-${i}`)
                    .attr("text-anchor", "end")
                    .attr("x", (i + 1) * bandwidth_result.x_bandwidth)
                    .attr("y", scales.y_num(mean_i) - 5)
                    .text(
                      `m = ${
                        Math.abs(mean_i) > 10 ** 3
                          ? customFormatForBigNumber(mean_i, 2)
                          : roundNumber(mean_i, 2)
                      }`
                    )
                    .attr("fill", "red");
                  if (this.sharedState.chart.options.animation) {
                    svg
                      .select(`.mean-line-${axis}-${i}`)
                      .style("opacity", 0)
                      .transition()
                      .delay(datasets.length * animationTime + 150 * (i + 1))
                      .duration(300)
                      .style("opacity", 1);
                    svg
                      .select(`.line-label-${i}`)
                      .style("opacity", 0)
                      .transition()
                      .delay(datasets.length * animationTime + 150 * (i + 1))
                      .duration(300)
                      .style("opacity", 1);
                  }
                });
              }
            }
          };

          if (x_axis_type === "number" && y_axis_type === "none") {
            meanLine("x");
          }
          if (y_axis_type === "number" && x_axis_type === "none") {
            meanLine("y");
          }
          if (x_axis_type === "number" && y_axis_type === "string") {
            meanLine("xy_xnum_ystr");
          }
          if (y_axis_type === "number" && x_axis_type === "string") {
            meanLine("xy_xstr_ynum");
          }
        }

        // Dragging points to change their position along the axis
        if (
          !(
            this.selectByClicking ||
            this.selectByBrushing ||
            this.deselectByBrushing
          )
        ) {
          let minDistance = Infinity;
          let minDistance_band = Infinity;
          let index = -1;
          let newX = 0;
          let newY = 0;
          let count = 0;
          let index_set: number[] = [];
          const drag = (axis: "x" | "y" | "xy_xnum_ystr" | "xy_xstr_ynum") => {
            return d3
              .drag()
              .on("start", (event) => {
                const [clickX, clickY] = d3.pointer(event, svg.node());
                const oldX =
                  axis === "x" || axis === "xy_xnum_ystr"
                    ? scales.x_num.invert(clickX)
                    : scales.x_none.invert(clickX);
                const oldY =
                  axis === "x" || axis === "xy_xnum_ystr"
                    ? scales.y_none.invert(clickY)
                    : scales.y_num.invert(clickY);
                if (axis === "x" || axis === "y") {
                  for (let i = 0; i < singeledatasets.length; i++) {
                    if (
                      Math.abs(
                        (singeledatasets[i].p as number) -
                          (axis === "x" ? oldX : oldY)
                      ) < minDistance
                    ) {
                      index = i;
                      minDistance = Math.abs(
                        (singeledatasets[i].p as number) -
                          (axis === "x" ? oldX : oldY)
                      );
                    }
                  }
                  for (let i = 0; i < singeledatasets.length; i++) {
                    if (
                      Math.abs(
                        (singeledatasets[i].p as number) -
                          (axis === "x" ? oldX : oldY)
                      ) === minDistance
                    ) {
                      index_set.push(i);
                      count++;
                    }
                  }
                  if (count > 1) {
                    for (let i = 0; i < index_set.length; i++) {
                      if (
                        Math.abs(
                          (axis === "x" ? oldY : oldX) -
                            (singeledatasets[index_set[i]].offset + 6)
                        ) < minDistance_band
                      ) {
                        index = index_set[i];
                        minDistance_band = Math.abs(
                          (axis === "x" ? oldY : oldX) -
                            (singeledatasets[index_set[i]].offset + 6)
                        );
                      }
                    }
                  }
                } else {
                  for (let i = 0; i < datasets.length; i++) {
                    if (
                      axis === "xy_xnum_ystr"
                        ? Math.abs((datasets[i].x as number) - oldX) <
                          minDistance
                        : Math.abs((datasets[i].y as number) - oldY) <
                          minDistance
                    ) {
                      index = i;
                      minDistance =
                        axis === "xy_xnum_ystr"
                          ? Math.abs((datasets[i].x as number) - oldX)
                          : Math.abs((datasets[i].y as number) - oldY);
                    }
                  }
                  for (let i = 0; i < datasets.length; i++) {
                    if (
                      axis === "xy_xnum_ystr"
                        ? Math.abs((datasets[i].x as number) - oldX) ===
                          minDistance
                        : Math.abs((datasets[i].y as number) - oldY) ===
                          minDistance
                    ) {
                      index_set.push(i);
                      count++;
                    }
                  }
                  if (count > 1) {
                    for (let i = 0; i < index_set.length; i++) {
                      if (
                        axis === "xy_xnum_ystr"
                          ? Math.abs(
                              oldY -
                                (listofstringsforlabels_y_axis.indexOf(
                                  datasets[index_set[i]].y as string
                                ) *
                                  bandwidth_result.y_bandwidth +
                                  datasets[index_set[i]].offset +
                                  6)
                            ) < minDistance_band
                          : Math.abs(
                              oldX -
                                (listofstringsforlabels_x_axis.indexOf(
                                  datasets[index_set[i]].x as string
                                ) *
                                  bandwidth_result.x_bandwidth +
                                  datasets[index_set[i]].offset +
                                  6)
                            ) < minDistance_band
                      ) {
                        index = index_set[i];
                        minDistance_band =
                          axis === "xy_xnum_ystr"
                            ? Math.abs(
                                oldY -
                                  (listofstringsforlabels_y_axis.indexOf(
                                    datasets[index_set[i]].y as string
                                  ) *
                                    bandwidth_result.y_bandwidth +
                                    datasets[index_set[i]].offset +
                                    6)
                              )
                            : Math.abs(
                                oldX -
                                  (listofstringsforlabels_x_axis.indexOf(
                                    datasets[index_set[i]].x as string
                                  ) *
                                    bandwidth_result.x_bandwidth +
                                    datasets[index_set[i]].offset +
                                    6)
                              );
                      }
                    }
                  }
                }
                if (index !== -1) {
                  svg
                    .select(
                      axis === "xy_xnum_ystr" || axis === "xy_xstr_ynum"
                        ? `.dataset-${index}`
                        : axis === "x"
                        ? `.single-x-${index}`
                        : axis === "y"
                        ? `.single-y-${index}`
                        : null
                    )
                    .classed("selected", true);
                }
              })
              .on("drag", (event) => {
                const [clickX, clickY] = d3.pointer(event, svg.node());
                newX = scales.x_num.invert(clickX);
                newY = scales.y_num.invert(clickY);
                // Update the visual position of the circle
                singeledatasets.forEach((_, i) => {
                  svg
                    .select(
                      axis === "x"
                        ? `.single-x-${i}`
                        : axis === "y"
                        ? `.single-y-${i}`
                        : null
                    )
                    .each(function () {
                      d3.select(this)
                        .attr(
                          "cx",
                          i === index && axis === "x"
                            ? scales.x_num(newX)
                            : i === index && axis === "y"
                            ? 6
                            : d3.select(this).attr("cx")
                        )
                        .attr(
                          "cy",
                          i === index && axis === "y"
                            ? scales.y_num(newY)
                            : i === index && axis === "x"
                            ? -6 + dimensions.height
                            : d3.select(this).attr("cy")
                        );
                    });
                });
                datasets.forEach((d, i) => {
                  svg
                    .select(
                      axis === "xy_xnum_ystr" || axis === "xy_xstr_ynum"
                        ? `.dataset-${i}`
                        : null
                    )
                    .each(function () {
                      d3.select(this)
                        .attr(
                          "cx",
                          i === index && axis === "xy_xstr_ynum"
                            ? scales.x_band(d.x as string) + 6
                            : i === index && axis === "xy_xnum_ystr"
                            ? scales.x_num(newX)
                            : d3.select(this).attr("cx")
                        )
                        .attr(
                          "cy",
                          i === index && axis === "xy_xnum_ystr"
                            ? scales.y_band(d.y as string) -
                                6 +
                                bandwidth_result.y_bandwidth
                            : i === index && axis === "xy_xstr_ynum"
                            ? scales.y_num(newY)
                            : d3.select(this).attr("cy")
                        );
                    });
                });
                const updatedSingledataset = singeledatasets.map((d, i) => {
                  if (index === i) {
                    return {
                      ...d,
                      p: axis === "x" ? newX : newY,
                    };
                  }
                  return d;
                });
                const updatedDataset = datasets.map((d, i) => {
                  if (index === i) {
                    return {
                      ...d,
                      x: axis === "xy_xnum_ystr" ? newX : d.x,
                      y: axis === "xy_xstr_ynum" ? newY : d.y,
                    };
                  }
                  return d;
                });
                if (
                  (x_axis_type === "number" || y_axis_type === "number") &&
                  this.sharedState.chart.options.showMean
                ) {
                  if (axis === "x" || axis === "y") {
                    const mean_singledataset = d3.mean(
                      updatedSingledataset,
                      (d) => Number(d.p)
                    );
                    // Update the visual postion of the mean line
                    svg
                      .select(`.mean-line-${axis}`)
                      .attr(
                        "x1",
                        axis === "x" ? scales.x_num(mean_singledataset) : 0
                      )
                      .attr(
                        "y1",
                        axis === "y" ? scales.y_num(mean_singledataset) : 0
                      )
                      .attr(
                        "x2",
                        axis === "x"
                          ? scales.x_num(mean_singledataset)
                          : dimensions.width
                      )
                      .attr(
                        "y2",
                        axis === "y"
                          ? scales.y_num(mean_singledataset)
                          : dimensions.height
                      );
                    // Update the visual postion of the mean label
                    if (axis === "x") {
                      svg
                        .select(".line.label")
                        .text(
                          `m = ${
                            Math.abs(mean_singledataset) > 10 ** 3
                              ? customFormatForBigNumber(mean_singledataset, 2)
                              : roundNumber(mean_singledataset, 2)
                          }`
                        )
                        .attr("text-anchor", "start")
                        .attr("x", scales.x_num(mean_singledataset) + 5)
                        .attr("y", 10);
                    } else {
                      svg
                        .select(".line.label")
                        .text(
                          `m = ${
                            Math.abs(mean_singledataset) > 10 ** 3
                              ? customFormatForBigNumber(mean_singledataset, 2)
                              : roundNumber(mean_singledataset, 2)
                          }`
                        )
                        .attr("text-anchor", "end")
                        .attr("x", dimensions.width)
                        .attr("y", scales.y_num(mean_singledataset) - 5);
                    }
                  } else if (axis === "xy_xnum_ystr") {
                    listofstringsforlabels_y_axis.map((l, i) => {
                      if ((datasets[index].y as string) === l) {
                        const mean_i = d3.mean(
                          updatedDataset.filter((d) => d.y === l),
                          (d) => Number(d.x)
                        );
                        svg
                          .select(`.mean-line-${axis}-${i}`)
                          .attr("x1", scales.x_num(mean_i))
                          .attr(
                            "y1",
                            dimensions.height - i * bandwidth_result.y_bandwidth
                          )
                          .attr("x2", scales.x_num(mean_i))
                          .attr(
                            "y2",
                            dimensions.height -
                              (i + 1) * bandwidth_result.y_bandwidth
                          );
                        // Update the visual postion of the mean label
                        svg
                          .select(`.line-label-${i}`)
                          .attr("x", scales.x_num(mean_i) - 5)
                          .attr(
                            "y",
                            dimensions.height -
                              (i + 1) * bandwidth_result.y_bandwidth +
                              10
                          )
                          .text(
                            `m = ${
                              Math.abs(mean_i) > 10 ** 3
                                ? customFormatForBigNumber(mean_i, 2)
                                : roundNumber(mean_i, 2)
                            }`
                          );
                      }
                    });
                  } else if (axis === "xy_xstr_ynum") {
                    listofstringsforlabels_x_axis.map((l, i) => {
                      if ((datasets[index].x as string) === l) {
                        const mean_i = d3.mean(
                          updatedDataset.filter((d) => d.x === l),
                          (d) => Number(d.y)
                        );
                        svg
                          .select(`.mean-line-${axis}-${i}`)
                          .attr("x1", i * bandwidth_result.x_bandwidth)
                          .attr("y1", scales.y_num(mean_i))
                          .attr("x2", (i + 1) * bandwidth_result.x_bandwidth)
                          .attr("y2", scales.y_num(mean_i));
                        // Update the visual postion of the mean label
                        svg
                          .select(`.line-label-${i}`)
                          .attr("x", (i + 1) * bandwidth_result.x_bandwidth)
                          .attr("y", scales.y_num(mean_i) - 5)
                          .text(
                            `m = ${
                              Math.abs(mean_i) > 10 ** 3
                                ? customFormatForBigNumber(mean_i, 2)
                                : roundNumber(mean_i, 2)
                            }`
                          );
                      }
                    });
                  }
                }
              })
              .on("end", (_) => {
                count = 0;
                // Update the data of the circle (this is true)
                if (index !== -1) {
                  axis === "x" || axis === "xy_xnum_ystr"
                    ? (selectedDataset.dimensional_data[index].data[
                        selectedDataset.labels.indexOf(axisLabels.x)
                      ] = Number(newX) as number)
                    : (selectedDataset.dimensional_data[index].data[
                        selectedDataset.labels.indexOf(axisLabels.y)
                      ] = Number(newY) as number);
                  this.updateScatterplot();
                  if (
                    this.sharedState.scatterDatasets.selected.axis.x ===
                      selectedDataset.filter.label &&
                    selectedDataset.filter.type === "number" &&
                    (axis === "x" || axis === "xy_xnum_ystr")
                  ) {
                    updateColorForFilter(
                      selectedDataset.labels.indexOf(axisLabels.x),
                      "number",
                      selectedDataset
                    );
                    this.updateScatterplot();
                  } else if (
                    this.sharedState.scatterDatasets.selected.axis.y ===
                      selectedDataset.filter.label &&
                    selectedDataset.filter.type === "number" &&
                    (axis === "y" || axis === "xy_xstr_ynum")
                  ) {
                    updateColorForFilter(
                      selectedDataset.labels.indexOf(axisLabels.y),
                      "number",
                      selectedDataset
                    );
                    this.updateScatterplot();
                  }
                }
              });
          };

          singeledatasets.forEach((_, i) => {
            x_axis_type === "number" && y_axis_type === "none"
              ? svg.select(`.single-x-${i}`).call(drag("x"))
              : x_axis_type === "none" && y_axis_type === "number"
              ? svg.select(`.single-y-${i}`).call(drag("y"))
              : null;
          });
          datasets.forEach((_, i) => {
            x_axis_type === "number" && y_axis_type === "string"
              ? svg.select(`.dataset-${i}`).call(drag("xy_xnum_ystr"))
              : x_axis_type === "string" && y_axis_type === "number"
              ? svg.select(`.dataset-${i}`).call(drag("xy_xstr_ynum"))
              : null;
          });
        }
        // animation of the scatter plot
        if (this.sharedState.chart.options.animation) {
          if (!(x_axis_type === "none") && !(y_axis_type === "none")) {
            scatter
              .selectAll("circle")
              .classed("selected", false)
              .style("opacity", 0)
              .transition()
              .delay((_, i: number) => i * animationTime) // Important: d can be deleted
              .duration(300)
              .style("opacity", 1)
              .each((_, i: number) => {
                setTimeout(() => {
                  const coords = {
                    x: 0,
                    y: 0,
                  };
                  const circle = this.shadowRoot.querySelector(
                    `svg circle[cx="${
                      x_axis_type === "number"
                        ? scales.x_num(datasets[i].x as number)
                        : y_axis_type === "number"
                        ? scales.x_band(datasets[i].x as string) +
                          6 +
                          datasets[i].offset
                        : scales.x_band(datasets[i].x as string) +
                          bandwidth_result.x_bandwidth / 2
                    }"][cy="${
                      y_axis_type === "number"
                        ? scales.y_num(datasets[i].y as number)
                        : scales.y_band(datasets[i].y as string) -
                          6 -
                          datasets[i].offset +
                          bandwidth_result.y_bandwidth
                    }"]`
                  ) as SVGCircleElement;
                  if (circle) {
                    const rect = circle.getBoundingClientRect();
                    coords.x = rect.x + rect.width / 2;
                    coords.y = rect.y + rect.height / 2;
                  }
                  let d_x: number | string;
                  if (x_axis_type === "number") {
                    d_x =
                      (datasets[i].x as number) > 10 ** 7
                        ? customFormatForBigNumber(datasets[i].x as number, 4)
                        : roundNumber(datasets[i].x as number, 4);
                  } else {
                    d_x = datasets[i].x;
                  }

                  let d_y: number | string;
                  if (y_axis_type === "number") {
                    d_y =
                      (datasets[i].y as number) > 10 ** 5
                        ? customFormatForBigNumber(datasets[i].y as number, 4)
                        : roundNumber(datasets[i].y as number, 4);
                  } else {
                    d_y = datasets[i].y;
                  }
                  tooltip
                    .style("opacity", 1)
                    .html(
                      "ID: " +
                        datasets[i].id +
                        "<br>" +
                        this.sharedState.scatterDatasets.selected.axis.x +
                        ": " +
                        d_x +
                        " " +
                        this.sharedState.scatterDatasets.selected.axis.y +
                        ": " +
                        d_y
                    )
                    .style("left", coords.x + 10 + "px")
                    .style("top", coords.y + 10 + "px");

                  setTimeout(() => {
                    tooltip
                      .transition()
                      .duration(animationTime > 2000 ? 200 : 0)
                      .style("opacity", 0);
                  }, animationTime - 500);
                }, i * animationTime);
              });
          }
          if (x_axis_type === "none" && y_axis_type === "number") {
            scatter
              .selectAll("circle")
              .classed("selected", false)
              .style("opacity", 0)
              .transition()
              .delay((_, i: number) => i * animationTime) // Important: d can be deleted
              .duration(300)
              .style("opacity", 1)
              .each((_, i: number) => {
                setTimeout(() => {
                  const coords = {
                    x: 0,
                    y: 0,
                  };
                  const circle = this.shadowRoot.querySelector(
                    `svg circle[cx="${
                      6 + singeledatasets[i].offset
                    }"][cy="${scales.y_num(singeledatasets[i].p as number)}"]`
                  ) as SVGCircleElement;
                  if (circle) {
                    const rect = circle.getBoundingClientRect();
                    coords.x = rect.x + rect.width / 2;
                    coords.y = rect.y + rect.height / 2;
                  }
                  const p_y: number =
                    (singeledatasets[i].p as number) > 10 ** 5
                      ? customFormatForBigNumber(
                          singeledatasets[i].p as number,
                          4
                        )
                      : roundNumber(singeledatasets[i].p as number, 4);
                  tooltip
                    .style("opacity", 1)
                    .html(
                      "ID: " +
                        singeledatasets[i].id +
                        "<br>" +
                        this.sharedState.scatterDatasets.selected.axis.y +
                        ": " +
                        p_y
                    )
                    .style("left", coords.x + 10 + "px")
                    .style("top", coords.y + 10 + "px");

                  setTimeout(() => {
                    tooltip
                      .transition()
                      .duration(animationTime > 2000 ? 200 : 0)
                      .style("opacity", 0);
                  }, animationTime - 400);
                }, i * animationTime);
              });
          }
          if (x_axis_type === "none" && y_axis_type === "string") {
            scatter
              .selectAll("circle")
              .classed("selected", false)
              .style("opacity", 0)
              .transition()
              .delay((_, i: number) => i * animationTime) // Important: d can be deleted
              .duration(300)
              .style("opacity", 1)
              .each((_, i: number) => {
                setTimeout(() => {
                  const coords = {
                    x: 0,
                    y: 0,
                  };
                  const circle = this.shadowRoot.querySelector(
                    `svg circle[cx="${6 + singeledatasets[i].offset}"][cy="${
                      scales.y_band(singeledatasets[i].p as string) +
                      bandwidth_result.y_bandwidth / 2
                    }"]`
                  ) as SVGCircleElement;
                  if (circle) {
                    const rect = circle.getBoundingClientRect();
                    coords.x = rect.x + rect.width / 2;
                    coords.y = rect.y + rect.height / 2;
                  }
                  tooltip
                    .style("opacity", 1)
                    .html(
                      "ID: " +
                        singeledatasets[i].id +
                        "<br>" +
                        this.sharedState.scatterDatasets.selected.axis.y +
                        ": " +
                        singeledatasets[i].p
                    )
                    .style("left", coords.x + 10 + "px")
                    .style("top", coords.y + 10 + "px");

                  setTimeout(() => {
                    tooltip
                      .transition()
                      .duration(animationTime > 2000 ? 200 : 0)
                      .style("opacity", 0);
                  }, animationTime - 400);
                }, i * animationTime);
              });
          }
          if (x_axis_type === "number" && y_axis_type === "none") {
            scatter
              .selectAll("circle")
              .classed("selected", false)
              .style("opacity", 0)
              .transition()
              .delay((_, i: number) => i * animationTime) // Important: d can be deleted
              .duration(300)
              .style("opacity", 1)
              .each((_, i: number) => {
                setTimeout(() => {
                  const coords = {
                    x: 0,
                    y: 0,
                  };
                  const circle = this.shadowRoot.querySelector(
                    `svg circle[cx="${scales.x_num(
                      singeledatasets[i].p as number
                    )}"][cy="${
                      -6 + dimensions.height - singeledatasets[i].offset
                    }"]`
                  ) as SVGCircleElement;
                  if (circle) {
                    const rect = circle.getBoundingClientRect();
                    coords.x = rect.x + rect.width / 2;
                    coords.y = rect.y + rect.height / 2;
                  }
                  const p_x: number =
                    (singeledatasets[i].p as number) > 10 ** 7
                      ? customFormatForBigNumber(
                          singeledatasets[i].p as number,
                          4
                        )
                      : roundNumber(singeledatasets[i].p as number, 4);
                  tooltip
                    .style("opacity", 1)
                    .html(
                      "ID: " +
                        singeledatasets[i].id +
                        "<br>" +
                        this.sharedState.scatterDatasets.selected.axis.x +
                        ": " +
                        p_x
                    )
                    .style("left", coords.x + 10 + "px")
                    .style("top", coords.y + 10 + "px");

                  setTimeout(() => {
                    tooltip
                      .transition()
                      .duration(animationTime > 2000 ? 200 : 0)
                      .style("opacity", 0);
                  }, animationTime - 400);
                }, i * animationTime);
              });
          }
          if (x_axis_type === "string" && y_axis_type === "none") {
            scatter
              .selectAll("circle")
              .classed("selected", false)
              .style("opacity", 0)
              .transition()
              .delay((_, i: number) => i * animationTime) // Important: d can be deleted
              .duration(300)
              .style("opacity", 1)
              .each((_, i: number) => {
                setTimeout(() => {
                  const coords = {
                    x: 0,
                    y: 0,
                  };
                  const circle = this.shadowRoot.querySelector(
                    `svg circle[cx="${
                      scales.x_band(singeledatasets[i].p as string) +
                      bandwidth_result.x_bandwidth / 2
                    }"][cy="${
                      -6 + dimensions.height - singeledatasets[i].offset
                    }"]`
                  ) as SVGCircleElement;
                  if (circle) {
                    const rect = circle.getBoundingClientRect();
                    coords.x = rect.x + rect.width / 2;
                    coords.y = rect.y + rect.height / 2;
                  }
                  tooltip
                    .style("opacity", 1)
                    .html(
                      "ID: " +
                        singeledatasets[i].id +
                        "<br>" +
                        this.sharedState.scatterDatasets.selected.axis.x +
                        ": " +
                        singeledatasets[i].p
                    )
                    .style("left", coords.x + 10 + "px")
                    .style("top", coords.y + 10 + "px");

                  setTimeout(() => {
                    tooltip
                      .transition()
                      .duration(animationTime > 2000 ? 200 : 0)
                      .style("opacity", 0);
                  }, animationTime - 400);
                }, i * animationTime);
              });
          }
        }

        // Select the color table body
        const colorFormulaRoot =
          this.shadowRoot.querySelector(".color-formulas");
        if (
          selectedDataset.filter.label &&
          selectedDataset.filter.type !== "none"
        ) {
          [...colorFormulaRoot.children].forEach((child) => child.remove());
          if (selectedDataset.filter.type === "number") {
            selectedDataset.filter.rangesandcolors.forEach(
              (rangeandcolor, i) => {
                const tr = document.createElement("tr");
                const td1 = document.createElement("td");
                const td2 = document.createElement("td");
                tr.appendChild(td1);
                tr.appendChild(td2);
                const colorSpan = document.createElement("span");
                td1.appendChild(colorSpan);
                const rangeSpan = document.createElement("span");
                td2.appendChild(rangeSpan);
                colorFormulaRoot.appendChild(tr);
                colorSpan.classList.add("color-span");
                colorSpan.style.background = rangeandcolor.color;
                rangeSpan.innerText =
                  i === selectedDataset.filter.rangesandcolors.length - 1
                    ? `[${rangeandcolor.range.min} - ${rangeandcolor.range.max}]`
                    : `[${rangeandcolor.range.min} - ${rangeandcolor.range.max})`;
              }
            );
          }
          if (selectedDataset.filter.type === "string") {
            selectedDataset.filter.labelsandcolors.forEach((labelandcolor) => {
              const tr = document.createElement("tr");
              const td1 = document.createElement("td");
              const td2 = document.createElement("td");
              tr.appendChild(td1);
              tr.appendChild(td2);
              const colorSpan = document.createElement("span");
              td1.appendChild(colorSpan);
              const labelSpan = document.createElement("span");
              td2.appendChild(labelSpan);
              colorFormulaRoot.appendChild(tr);
              colorSpan.classList.add("color-span");
              colorSpan.style.background = labelandcolor.color;
              labelSpan.innerText = `${labelandcolor.label}`;
            });
          }
        }
      }
    }
  }
  public static get scopedElements() {
    return {
      "sl-range": SlRange,
      "sl-button": SlButton,
      "sl-icon": SlIcon,
      "sl-popup": SlPopup,
      "sl-menu": SlMenu,
      "sl-menu-item": SlMenuItem,
      "sl-tooltip": SlTooltip,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scatterplot-chart": ScatterplotChart;
  }
}
