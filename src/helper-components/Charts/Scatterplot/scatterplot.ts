import { html } from "lit";
import * as d3 from "d3";
import { customElement, property } from "lit/decorators.js";
import { SharedTestStateMixin } from "../../../state";
import { OptionDefinition, Definition } from "./definition";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import { LitElementWw } from "@webwriter/lit";
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
} from "./drawScatterplot";
import style from "./scatterplot.style";
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
export class ScatterplotChart extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  static styles = style;

  @property({ type: Object })
  options = OptionDefinition;
  @property({ type: Object })
  definition = Definition;
  @property({ type: Boolean })
  addNode = false;
  @property({ type: Boolean })
  selectNode = false;
  @property({ type: Boolean })
  selectByClicking = false;
  @property({ type: Boolean })
  selectByBrushing = false;
  @property({ type: Number })
  selectedIndextoAddNote = 0;
  @property({ type: Boolean })
  deselectByBrushing = false;
  @property({ type: Boolean })
  editShowing = false;
  @property({ type: Boolean })
  hideSelected = false;
  @property({ type: Boolean })
  hideUnselected = false;
  @property({ type: Boolean })
  deleteSelected = false;
  @property({ type: Boolean })
  deleteUnselected = false;
  @property({ type: Boolean })
  showAll = true;
  @property({ type: Boolean })
  extraOptions = false;
  @property({ type: Boolean })
  drawLine = false;
  @property({ type: Boolean })
  filterOn = false;

  constructor(optionsDefinition = OptionDefinition) {
    super();
    this.options = optionsDefinition;
    this.sharedState.chart.options = Object.entries(optionsDefinition).reduce(
      (acc, [key, value]) => {
        acc[key] = this.sharedState.chart.options[key] ?? value.default;
        return acc;
      },
      {} as any
    ) as ChartOptions<OptionDefinition>;
  }

  render() {
    const firstSelectedDataset =
      this.sharedState.scatterDatasets.sets[
        this.sharedState.scatterDatasets.selected.dataset_indexes[0]
      ];
    return html`<div class="scatterplot-root">
      <div class="scatterplot-wrapper">
        <div class="scatterplot-svg"></div>
        ${this.sharedState.scatterDatasets.selected.dataset_indexes.length >
          1 &&
        (!this.sharedState.scatterDatasets.selected.axis.x ||
          !this.sharedState.scatterDatasets.selected.axis.y)
          ? html`<div class="no-axis">Please select x and y axis</div>`
          : html``}
        ${this.sharedState.scatterDatasets.selected.dataset_indexes.length ===
          1 &&
        !this.sharedState.scatterDatasets.selected.axis.x &&
        !this.sharedState.scatterDatasets.selected.axis.y
          ? html`<div class="no-axis">Please select x or y axis</div>`
          : html``}
        ${this.sharedState.scatterDatasets.selected.dataset_indexes.length === 0
          ? html`<div class="no-axis">Please select one or more datasets</div>`
          : html``}
        <div class="button-container">
          <sl-popup placement="bottom" strategy="fixed" .active=${this.addNode}>
            <sl-button
              slot="anchor"
              variant="default"
              size="small"
              circle
              id="add-point-button"
              @click=${(e) => {
                this.addNode = true;
                e.target.focus();
              }}
              .disabled=${this.options.animation}
              @blur=${() => (this.addNode = false)}
            >
              <sl-icon name="file-bar-graph" label="Data"></sl-icon>
            </sl-button>
            <div class="popup-content">
              ${this.sharedState.scatterDatasets.selected.dataset_indexes.map(
                (dataset_index, i) => {
                  const dataset =
                    this.sharedState.scatterDatasets.sets[dataset_index];
                  return html`<sl-button
                    @mousedown=${(e: MouseEvent) => {
                      if (e.button !== 0) return;
                      this.selectedIndextoAddNote = i;
                      this.updateScatterplot();
                    }}
                  >
                    Add data of ${dataset.name}
                  </sl-button>`;
                }
              )}
            </div>
          </sl-popup>

          <sl-popup
            placement="bottom"
            strategy="fixed"
            .active=${this.selectNode}
          >
            <sl-button
              slot="anchor"
              variant="default"
              size="small"
              circle
              id="select-point-button"
              .disabled=${this.totalDataLength === 0 || this.options.animation}
              @click=${(e) => {
                this.selectNode = true;
                e.target.focus();
              }}
              @blur=${() => (this.selectNode = false)}
            >
              <sl-icon name="hand-index" label="Selection"></sl-icon>
            </sl-button>
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
          >
            <sl-button
              slot="anchor"
              variant="default"
              size="small"
              circle
              id="edit-button"
              .disabled=${this.totalDataLength === 0 || this.options.animation}
              @click=${(e) => {
                this.editShowing = true;
                e.target.focus();
              }}
              @blur=${() => (this.editShowing = false)}
            >
              <sl-icon name="eye" label="View"></sl-icon>
            </sl-button>
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
                    this.sharedState.scatterDatasets.sets.forEach((dataset) => {
                      for (
                        let i = dataset.dimensional_data.length - 1;
                        i >= 0;
                        i--
                      ) {
                        if (dataset.dimensional_data[i].selected) {
                          dataset.dimensional_data.splice(i, 1);
                          dataset.ids.splice(i, 1);
                        }
                      }
                    });
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
                    this.sharedState.scatterDatasets.sets.forEach((dataset) => {
                      for (
                        let i = dataset.dimensional_data.length - 1;
                        i >= 0;
                        i--
                      ) {
                        if (!dataset.dimensional_data[i].selected) {
                          dataset.dimensional_data.splice(i, 1);
                          dataset.ids.splice(i, 1);
                        }
                      }
                    });
                  }
                  this.updateScatterplot();
                }}
                >Delete Unselected</sl-menu-item
              >
            </div>
          </sl-popup>

          <sl-popup
            placement="bottom"
            strategy="fixed"
            .active=${this.extraOptions}
          >
            <sl-button
              slot="anchor"
              variant="default"
              size="small"
              circle
              id="add-point-button"
              @click=${(e) => {
                this.extraOptions = true;
                e.target.focus();
              }}
              .disabled=${this.options.animation}
              @blur=${() => (this.extraOptions = false)}
            >
              <sl-icon name="pencil" label="Draw"></sl-icon>
            </sl-button>
            <div class="popup-content">
              <sl-button
                @mousedown=${(e: MouseEvent) => {
                  if (e.button !== 0) return;
                  this.drawLine = true;
                  this.updateScatterplot();
                }}
              >
                Draw Line
              </sl-button>
            </div>
          </sl-popup>
          <sl-popup
            placement="bottom"
            strategy="fixed"
            .active=${this.filterOn}
          >
            <sl-button
              slot="anchor"
              variant="default"
              size="small"
              circle
              id="filter-button"
              @click=${(e) => {
                this.filterOn = true;
                e.target.focus();
              }}
              .disabled=${this.options.animation ||
              this.sharedState.scatterDatasets.selected.dataset_indexes
                .length === 0}
              @blur=${() => (this.filterOn = false)}
            >
              <sl-icon name="filter" label="Filter"></sl-icon>
            </sl-button>
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
                          firstSelectedDataset.filter.label === label ? -1 : i;
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
                          firstSelectedDataset.dimensional_data.forEach((d) => {
                            d.color = firstSelectedDataset.color;
                          });
                        }
                        this.updateScatterplot();
                      }}
                      .checked=${firstSelectedDataset.filter.label === label}
                    >
                      ${label}
                    </sl-menu-item>
                  `
              )}
            </div>
          </sl-popup>
          <div class="table-wrapper">
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
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th class="th_line">Line</th>
                </tr>
              </thead>
              <tbody class="line-formulas"></tbody>
            </table>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th class="th_color">Color</th>
                  <th class="th_range">
                    ${firstSelectedDataset?.filter?.label &&
                    firstSelectedDataset.filter.type === "number"
                      ? firstSelectedDataset.filter.label
                      : "Label"}
                  </th>
                </tr>
              </thead>
              <tbody class="color-formulas"></tbody>
            </table>
          </div>
          ${this.options.animation
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
            : html``}
        </div>
      </div>
    </div>`;
  }
  get totalDataLength() {
    let length = 0;
    this.sharedState.scatterDatasets.sets.forEach(
      (dataset) => (length += dataset.dimensional_data.length)
    );
    return length;
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
    this.selectedIndextoAddNote = 0;
    this.hideSelected = false;
    this.hideUnselected = false;
    this.deleteSelected = false;
    this.deleteUnselected = false;
    this.showAll = true;
    this.editShowing = false;
    this.extraOptions = false;
    this.drawLine = false;
    this.filterOn = false;
    this.createScatterPlot();
    // TODO: remove event listener on unmount
    document.addEventListener("keypress", (e) => {
      switch (e.key) {
        case "Backspace":
        case "Delete":
      }
    });
  }
  //updatePlot for new animation time
  // TODO: Fix the focus problem
  // TODO: Add name for scatterplot, maybe use the text feld?
  // TODO: Name for each dataset unter the scatterplot
  // TODO: Table for statistics: r, regression folrmula, mean, etc.
  // TODO: Fix buttons convert and download image
  // TODO: Given x and calculate y (geogbra)
  // TODO: Temporary delete some dataset
  // TODO: Delete outliers to study the rest
  // TODO: Show all regression line when cut
  // TODO: see friendly error message and user drag, delete, add points from automa (WR)
  // TODO: Fix edit button
  // TODO: dymanic and manuell scaling for x and y axis
  // TODO: Feedback for choose the right point
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
  }
  // !IMPORTANT: TODO: Fix the drag behavior out of scatterplot area ?
  createScatterPlot() {
    /*const datasets: Point[][] = this.sharedState.scatterplotdatasets.sets.map(
      (dataset) =>
        dataset.dimensional_data.map((d: Point, i) => {
          // !IMPORTANT: Keep the refernce to the original dataset to update data when updating points directly!
          d.color = dataset.scatter_color;
          d.label = dataset.labels[i];
          d.scatter_titel = dataset.scatter_titel;
          return d;
          export interface Point {
            x: number;
            y: number;
            selected?: boolean;
            color?: string;
            label?: string;
            scatter_titel?: string;
          }
        })
    );*/
    const selectedDatasets = this.sharedState.scatterDatasets.sets.filter(
      (_, i) =>
        this.sharedState.scatterDatasets.selected.dataset_indexes.includes(i)
    );
    const x_axis_type =
      this.sharedState.scatterDatasets.selected.axis.x === undefined
        ? "none"
        : selectedDatasets[0].typeOfEachData[
            selectedDatasets[0].labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.x
            )
          ];
    const y_axis_type =
      this.sharedState.scatterDatasets.selected.axis.y === undefined
        ? "none"
        : selectedDatasets[0].typeOfEachData[
            selectedDatasets[0].labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.y
            )
          ];

    const root = this.shadowRoot.querySelector(".scatterplot-svg");
    if (x_axis_type === "number" && y_axis_type === "number") {
      const axisLabels = {
        x: this.sharedState.scatterDatasets.selected.axis.x,
        y: this.sharedState.scatterDatasets.selected.axis.y,
      };
      const datasets: PointOnlyNumbers[][] =
        this.sharedState.scatterDatasets.selected.dataset_indexes.map(
          (dataset_index) => {
            const set = this.sharedState.scatterDatasets.sets[dataset_index];
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
                color: set.color,
                id: set.ids[i],
                scatter_titel: set.name,
              };
              // !IMPORTANT: Keep the reference to the original dataset to update data when updating points directly!
              return d;
            });
          }
        );
      const lineDatasetsWithCenterPoint: PointOnlyNumbers[][] =
        this.sharedState.lineDatasets.sets.map((dataset) =>
          dataset.data.concat([
            {
              x: (dataset.data[0].x + dataset.data[1].x) / 2,
              y: (dataset.data[0].y + dataset.data[1].y) / 2,
            },
          ])
        );

      const { svg, scales, scatter, dimensions, tooltip } = drawScatterplot(
        root,
        datasets,
        axisLabels,
        {
          hoverTooltip: this.options.hoverTooltip,
          showOutliers: this.options.showOutliers,
        } as any
      );

      let animationTime = Number(this.definition.animationTime);
      // Handle recht click to remove point
      svg.on("contextmenu", (event) => {
        deletePointListeners(
          event,
          svg,
          datasets,
          scales,
          this.sharedState.scatterDatasets
        );
        //Re-render
        this.updateScatterplot();
      });

      // Handle adding a new point
      if (
        this.addNode &&
        this.selectedIndextoAddNote !== null &&
        this.selectedIndextoAddNote !== undefined &&
        this.selectedIndextoAddNote >= 0 &&
        this.selectedIndextoAddNote <
          this.sharedState.scatterDatasets.selected.dataset_indexes.length
      ) {
        svg.on("click", (event) => {
          addPointListeners(
            event,
            svg,
            scales,
            this.sharedState.scatterDatasets,
            this.selectedIndextoAddNote
          );
          this.addNode = false;
          this.updateScatterplot();
        });
      }

      // Clicking for selecting points
      if (
        this.selectNode &&
        this.selectByClicking &&
        !this.selectByBrushing &&
        !this.deselectByBrushing
      ) {
        svg.on("click", (event) => {
          selectPointByClickingListeners(
            event,
            svg,
            datasets,
            scales,
            this.sharedState.scatterDatasets
          );
          // Re-render
          this.selectByClicking = false;
          this.updateScatterplot();
        });
      }

      // Dragging points to change their position
      //TODO: Fix the problem with yelow marks when dragging (maybe focus problem)
      //TODO: yellow marks appear after (eg. selectwith brush). The setting disappears
      if (!(this.selectNode || this.selectByClicking)) {
        addDragingPointListeners(
          svg,
          scatter,
          scales,
          this.sharedState.scatterDatasets,
          () => {
            this.updateScatterplot();
          }
        );
      }

      // Handle brushing to select points (Select all points if they have the same coordinates)
      // Handle deselecting points by brushing (deselect all points if they have the same coordinates)
      if (this.selectNode && !this.selectByClicking) {
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

      // Draw a line in scatter plot
      if (this.extraOptions && this.drawLine) {
        // change cursor to pencil
        //TODO: Fix the cursor problem
        //svg.style("cursor", pencilCursor);
        addDrawLineListeners(svg, scales, (line) => {
          this.sharedState.lineDatasets.sets.push({ data: line });
          this.updateScatterplot();
          // change cursor back to default
          //svg.style("cursor", "default");
        });
      }

      //TODO: Limit the line to the scatterplot area
      // Handle dragging lines to new positions
      // Define the drag behavior for the center point of the line to move the entire line up down
      // Define the drag behavior for the center point
      let index_center = -1;
      const dragCenter = d3
        .drag()
        .on("start", (event) => {
          d3.select(event.sourceEvent.target).classed("selected-rect", true);
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
        .on("end", (event) => {
          d3.select(event.sourceEvent.target).classed("selected-rect", false);
          this.updateScatterplot();
        });
      let index_right = -1;
      // Define the drag behavior for the end points of the line to rotate the line
      const dragEndPointsRight = d3
        .drag()
        .on("start", (event, _) => {
          d3.select(event.sourceEvent.target).classed("selected-rect", true);
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
          this.updateScatterplot();
        });
      let index_left = -1;
      const dragEndPointsLeft = d3
        .drag()
        .on("start", (event, _) => {
          d3.select(event.sourceEvent.target).classed("selected-rect", true);
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
        svg
          .append("rect")
          .datum([endPointsLeft, endPointsRight])
          .attr("class", `center-point-${i}`)
          .attr("x", center.x - 7)
          .attr("y", center.y - 7)
          .attr("width", 10) // Width of the rectangle
          .attr("height", 10) // Height of the rectangle
          .attr("fill", "white") // Fill color of the rectangle
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .call(dragCenter)
          .on("contextmenu", (event) => {
            deleteLineListeners(
              event,
              svg,
              lineDatasetsWithCenterPoint,
              scales,
              this.sharedState.lineDatasets
            );
          });

        // Append the end point left
        const end_point_left = svg
          .append("rect")
          .datum([endPointsLeft, endPointsRight])
          .attr("class", `end-point-left-${i}`)
          .attr("x", endPointsLeft.x - 7) // Position of the rectangle
          .attr("y", endPointsLeft.y - 7)
          .attr("width", 10) // Width of the rectangle
          .attr("height", 10) // Height of the rectangle
          .attr("fill", "white") // Fill color of the rectangle
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .on("contextmenu", (event) => {
            deleteLineListeners(
              event,
              svg,
              lineDatasetsWithCenterPoint,
              scales,
              this.sharedState.lineDatasets
            );
          });

        // Append the end point right
        const end_point_right = svg
          .append("rect")
          .datum([endPointsLeft, endPointsRight])
          .attr("class", `end-point-right-${i}`)
          .attr("x", endPointsRight.x - 7)
          .attr("y", endPointsRight.y - 7)
          .attr("width", 10) // Width of the rectangle
          .attr("height", 10) // Height of the rectangle
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .on("contextmenu", (event) => {
            deleteLineListeners(
              event,
              svg,
              lineDatasetsWithCenterPoint,
              scales,
              this.sharedState.lineDatasets
            );
          });
        end_point_left.call(dragEndPointsLeft);
        end_point_right.call(dragEndPointsRight);
      });
      // For line formulas
      const lineFormulaRoot = this.shadowRoot.querySelector(".line-formulas");
      [...lineFormulaRoot.children].forEach((child) => child.remove());
      this.sharedState.lineDatasets.sets.forEach((dataset) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        tr.appendChild(td);
        const lineSpan = document.createElement("span");
        td.appendChild(lineSpan);
        lineFormulaRoot.appendChild(tr);
        const lineFormula = `y = ${(
          (dataset.data[1].y - dataset.data[0].y) /
          (dataset.data[1].x - dataset.data[0].x)
        ).toFixed(2)}x + ${(
          dataset.data[0].y -
          ((dataset.data[1].y - dataset.data[0].y) /
            (dataset.data[1].x - dataset.data[0].x)) *
            dataset.data[0].x
        ).toFixed(2)}`;
        lineSpan.innerText = lineFormula;
      });
      // For scatter plot with regression
      const regressionFormulaRoot = this.shadowRoot.querySelector(
        ".regression-formulas"
      );
      [...regressionFormulaRoot.children].forEach((child) => child.remove());
      datasets.forEach((dataset) => {
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

        if (this.sharedState.regressionType !== "none") {
          // calculate the regression line for each dataset and display in the scatter plot
          const result = addRegressionLine(
            svg,
            scales,
            dataset,
            this.sharedState.regressionType
          );
          const regressionFormula = result.regressionFormula;
          const regressionError = result.regressionError;
          //  show the formula of the regression line on the top left corner
          if (regressionFormula !== "") {
            regressionSpan.innerText = regressionFormula;
            if (regressionError) {
              regressionSpan.style.background = "#d45c5c";
              regressionSpan.style.color = "white";
            } else regressionSpan.style.color = dataset[0]?.color ?? "#69b3a2";
          }
        }

        if (this.options.showCorrelation) {
          // calculate the correlation coefficient for each dataset
          const correlation = calculateCorrelation(dataset);
          correlationSpan.innerText = (
            Math.round(correlation * 100) / 100
          ).toLocaleString();
          correlationSpan.style.color = dataset[0]?.color ?? "#69b3a2";
        }
      });

      // Animate the scatter plot
      // For each point appears with a tooltip
      //TODO: See the papers about teaching scatterplot for the animation
      //TODO: Fix the regression line?
      if (this.options.animation) {
        scatter
          .selectAll("circle")
          .classed("selected", false)
          .style("opacity", 0)
          .attr("cx", (d: PointOnlyNumbers) => scales.x(d.x))
          .attr("cy", (d: PointOnlyNumbers) => scales.y(d.y))
          .transition()
          .delay((_, i: number) => i * animationTime) // Important: d can be deleted
          .duration(300)
          .style("opacity", 0.5)
          .on("start", (event: { x: number; y: number; i: number }) => {
            setTimeout(() => {
              const coords = {
                x: 0,
                y: 0,
              };

              const circle = this.shadowRoot.querySelector(
                `svg circle[cx="${scales.x(event.x)}"][cy="${scales.y(
                  event.y
                )}"]`
              ) as SVGCircleElement;

              if (circle) {
                // get the position of the circle on the page
                const rect = circle.getBoundingClientRect();
                coords.x = rect.x + rect.width / 2;
                coords.y = rect.y + rect.height / 2;
              }

              tooltip
                .style("opacity", 1)
                .html(
                  axisLabels.x +
                    ": " +
                    event.x +
                    " " +
                    axisLabels.y +
                    ": " +
                    event.y
                )
                .style("left", coords.x + 10 + "px")
                .style("top", coords.y + 10 + "px");

              setTimeout(() => {
                tooltip.style("opacity", 0);
              }, animationTime / 2); // Show the tooltip for 1000ms
            }, event.i * animationTime); // This ensures the tooltip appears after the transition delay
          });
      }
      // Add grid
      if (this.options.showGrid) {
        addGridListeners(svg, scales, dimensions);
      }
    } else if (selectedDatasets.length === 1) {
      const selectedDataset = selectedDatasets[0];
      const axisLabels = {
        x: this.sharedState.scatterDatasets.selected.axis.x,
        y: this.sharedState.scatterDatasets.selected.axis.y,
      };
      let datasets: Point[] = [];
      let singeledatasets: OneDimentionalPoint[] = [];
      let datasets_copy: {
        x: number | string;
        y: number | string;
      }[] = [];
      selectedDataset.dimensional_data.map((dimensional_data) => {
        const d = {
          x: dimensional_data.data[
            selectedDataset.labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.x
            )
          ],
          y: dimensional_data.data[
            selectedDataset.labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.y
            )
          ],
          /*selected: dimensional_data.selected,
          color: selectedDataset.color,
          id: selectedDataset.ids[i],
          scatter_titel: selectedDataset.name,*/
        };
        // !IMPORTANT: Keep the reference to the original dataset to update data when updating points directly!
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
                ? dimensional_data.data[
                    selectedDataset.labels.indexOf(
                      this.sharedState.scatterDatasets.selected.axis.y
                    )
                  ]
                : dimensional_data.data[
                    selectedDataset.labels.indexOf(
                      this.sharedState.scatterDatasets.selected.axis.x
                    )
                  ],
            /*
          selected: dimensional_data.selected,
          color: selectedDataset.color,
          id: selectedDataset.ids[i],
          scatter_titel: selectedDataset.name,*/
          };
          // !IMPORTANT: Keep the reference to the original dataset to update data when updating points directly!
          return d;
        }
      );

      // set the dimensions and margins of the graph
      const margin = { top: 10, right: 30, bottom: 50, left: 70 },
        width = 550 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
      // append the svg object to the body of the page
      const svg = d3
        .select(root)
        .append("svg")
        .attr(
          "viewBox",
          `0 0 ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
          }`
        )
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      // Add Gridlines
      const addGrid = (axis, scale, dimension, transform, offset) => {
        const grid = svg
          .append("g")
          .attr("class", "grid")
          .attr("transform", transform)
          .call(
            axis(scale)
              .tickSize(-dimension)
              .tickFormat(() => "")
              .tickSizeOuter(0)
          );

        grid
          .selectAll(".tick line")
          .attr("transform", `translate(${offset})`)
          .attr("stroke", "lightgrey");
        grid.selectAll(".domain").remove();
      };
      let data_for_x_axis_copy: { x: number | string; y: number | string }[];

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
      //TODO: max for number values
      // Add X axis
      let x;
      if (x_axis_type !== "none" && data_for_x_axis_copy.length > 0) {
        x =
          x_axis_type === "number"
            ? d3
                .scaleLinear()
                .domain([
                  0,
                  d3.max(data_for_x_axis_copy, (d) => Number(d.x)) as number,
                ])
                .range([0, width])
            : d3
                .scaleBand()
                .domain(data_for_x_axis_copy.map((d) => d.x as string))
                .range([0, width])
                .align(0)
                .paddingOuter(0)
                .paddingInner(0);
        if (x_axis_type === "number") {
          svg
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        } else {
          let axis_x = svg
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
          if (y_axis_type !== "none") {
            if (x_axis_type === "string" && y_axis_type === "number") {
              axis_x
                .selectAll(".tick text")
                .attr("transform", `translate(${-x.bandwidth() / 2}, 0)`);
              svg.selectAll(".tick line").remove();
            }
          }
        }
        svg
          .append("text")
          .attr("class", "x label")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", height + 40)
          .attr("style", "text-align: center;")
          .text(axisLabels.x);
        // Add Gridlines
        if (!(x_axis_type === "number")) {
          addGrid(
            d3.axisBottom,
            x,
            height,
            `translate(0, ${height})`,
            `${-x.bandwidth() / 2}, 0`
          );
        }
      }
      let data_for_y_axis_copy: { x: number | string; y: number | string }[];
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
      // Add Y axis
      let y;
      if (!(y_axis_type === "none") && data_for_y_axis_copy.length > 0) {
        y =
          y_axis_type === "number"
            ? d3
                .scaleLinear()
                .domain([
                  0,
                  d3.max(data_for_y_axis_copy, (d) => Number(d.y)) as number,
                ])
                .range([height, 0])
            : d3
                .scaleBand()
                .domain(data_for_y_axis_copy.map((d) => d.y as string))
                .range([height, 0])
                .padding(0)
                .paddingOuter(0);
        if (y_axis_type === "number") {
          svg.append("g").call(d3.axisLeft(y));
        } else {
          let axis_y = svg.append("g").call(d3.axisLeft(y));

          if (y_axis_type === "string" && x_axis_type === "number") {
            axis_y
              .selectAll(".tick text")
              .attr("transform", `translate( 0, ${y.bandwidth() / 2})`);
            svg.selectAll(".tick line").remove();
          }
        }
        svg
          .append("text")
          .attr("class", "y label")
          .attr("text-anchor", "middle")
          .attr("x", -((height + margin.bottom) / 2)) // to my x axis
          .attr("y", -40) // to my y axis
          .attr("transform", "rotate(-90)")
          .text(axisLabels.y);
        // Add Gridlines
        if (!(y_axis_type === "number")) {
          addGrid(d3.axisLeft, y, width, null, `0, ${y.bandwidth() / 2}`);
        }
      }

      if (!(x_axis_type === "none") && !(y_axis_type === "none")) {
        if (y_axis_type === "string" && x_axis_type === "string") {
          addGrid(d3.axisLeft, y, width, null, `0, ${y.bandwidth() / 2}`);
          addGrid(
            d3.axisBottom,
            x,
            height,
            `translate(0, ${height})`,
            `${-x.bandwidth() / 2}, 0`
          );
        }
      }

      svg.selectAll(".domain, .tick line").attr("stroke", "lightgrey");
      // Check if x or y is a string and if an offset needs to be applied
      selectedDataset.dimensional_data.forEach((dataset) => {
        const color = dataset.color ? dataset.color : selectedDataset.color;
        let offset = 0;
        const selected = dataset.selected;
        if (!(x_axis_type === "none") && !(y_axis_type === "none")) {
          const x =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.x
              )
            ];
          const y =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.y
              )
            ];
          // Check if x or y is a string and if an offset needs to be applied
          if (x_axis_type === "string" && y_axis_type === "number") {
            offset = calculateOffset(datasets, "x", x, y);
          } else if (y_axis_type === "string" && x_axis_type === "number") {
            offset = calculateOffset(datasets, "y", y, x);
          } else if (y_axis_type === "string" && x_axis_type === "string") {
            offset = calculateOffset(datasets, "y", y, x);
          }
          datasets.push({ x, y, selected, offset, color });
        } else if (x_axis_type === "none" && !(y_axis_type === "none")) {
          const y =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.y
              )
            ];
          offset = calculateOffset(singeledatasets, "x_none", null, y);
          singeledatasets.push({ p: y, selected, offset, color });
        } else if (!(x_axis_type === "none") && y_axis_type === "none") {
          const x =
            dataset.data[
              selectedDataset.labels.indexOf(
                this.sharedState.scatterDatasets.selected.axis.x
              )
            ];
          offset = calculateOffset(singeledatasets, "y_none", null, x);
          singeledatasets.push({ p: x, selected, offset, color });
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
            ? x.bandwidth()
            : string_axis === "y"
            ? y.bandwidth()
            : string_axis === "x_none"
            ? width
            : height; // Assuming x is a scale object with a bandwidth method

        let distance = defaultDistance; // Set initial distance to the default

        if (count * defaultDistance > bandwidth) {
          // If the total width of points exceeds the bandwidth, reduce the distance
          distance =
            defaultDistance -
            (count * defaultDistance - bandwidth + 12) / count;
        }

        return distance;
      }
      const scatter = svg;

      const scales = {
        x_num: d3
          .scaleLinear()
          .domain([
            0,
            d3.max(data_for_x_axis_copy, (d) => Number(d.x)) as number,
          ])
          .range([0, width]),
        y_num: d3
          .scaleLinear()
          .domain([
            0,
            d3.max(data_for_y_axis_copy, (d) => Number(d.y)) as number,
          ])
          .range([height, 0]),
        x_brand: d3
          .scaleBand()
          .domain(data_for_x_axis_copy.map((d) => d.x as string))
          .range([0, width]),
        y_brand: d3
          .scaleBand()
          .domain(data_for_y_axis_copy.map((d) => d.y as string))
          .range([height, 0]),
        y_none: d3.scaleLinear().domain([0, height]).range([height, 0]),
        x_none: d3.scaleLinear().domain([0, width]).range([0, width]),
      };
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
      // if one of the axis is string and there are multiple value of the other axis, those values are the same, then the circles will be on top of each other
      if (!(x_axis_type === "none") && !(y_axis_type === "none")) {
        datasets.forEach((d: Point, i) => {
          scatter
            .append("circle")
            .attr("class", `dataset-${i}`)
            .attr(
              "cx",
              x_axis_type === "number"
                ? scales.x_num(d.x as number)
                : y_axis_type === "number"
                ? scales.x_brand(d.x as string) + 6 + d.offset
                : scales.x_brand(d.x as string) + x.bandwidth() / 2
            ) // 6 is the radius of the circle
            .attr(
              "cy",
              y_axis_type === "number"
                ? scales.y_num(d.y as number)
                : scales.y_brand(d.y as string) - 6 - d.offset + y.bandwidth()
            )
            .attr("r", 6)
            .style("fill", d.color ?? "#417ca1")
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .classed("selected", d.selected ?? false);
        });
      }
      if (x_axis_type === "none" && y_axis_type === "number") {
        singeledatasets.forEach((d: OneDimentionalNumberPoint, i) => {
          console.log("Single datasets" + d.p);
          scatter
            .append("circle")
            .attr("class", `single-y-${i}`)
            .attr("cx", 6 + d.offset)
            .attr("cy", scales.y_num(d.p as number))
            .attr("r", 6)
            .style("fill", d.color ?? "#417ca1")
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .classed("selected", d.selected ?? false);
        });
      }
      if (x_axis_type === "none" && y_axis_type === "string") {
        singeledatasets.forEach((d: OneDimentionalPoint, i) => {
          scatter
            .append("circle")
            .attr("class", `single-string-y-${i}`)
            .attr("cx", 6 + d.offset)
            .attr("cy", scales.y_brand(d.p as string) + y.bandwidth() / 2)
            .attr("r", 6)
            .style("fill", d.color ?? "#417ca1")
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .classed("selected", d.selected ?? false);
        });
      }

      if (x_axis_type === "number" && y_axis_type === "none") {
        singeledatasets.forEach((d: OneDimentionalNumberPoint, i) => {
          scatter
            .append("circle")
            .attr("class", `single-x-${i}`)
            .attr("cx", scales.x_num(d.p as number))
            .attr("cy", -6 + height - d.offset)
            .attr("r", 6)
            .style("fill", d.color ?? "#417ca1")
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .classed("selected", d.selected ?? false);
        });
      }
      if (x_axis_type === "string" && y_axis_type === "none") {
        singeledatasets.forEach((d: OneDimentionalPoint, i) => {
          scatter
            .append("circle")
            .attr("class", `single-string-x-${i}`)
            .attr("cx", scales.x_brand(d.p as string) + x.bandwidth() / 2)
            .attr("cy", -6 + height - d.offset)
            .attr("r", 6)
            .style("fill", d.color ?? "#417ca1")
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .classed("selected", d.selected ?? false);
        });
      }
      // Dragging points to change their position along the axis
      if (!(this.selectNode || this.selectByClicking)) {
        let minDistance = 0.3;
        let minDistance_band = Infinity;
        let index = -1;
        let newX = 0;
        let newY = 0;
        let count = 0;
        let index_set: number[] = [];
        // TODO: Fix the dragging and add for y-axis
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
                                y.bandwidth() +
                                datasets[index_set[i]].offset +
                                6)
                          ) < minDistance_band
                        : Math.abs(
                            oldX -
                              (listofstringsforlabels_x_axis.indexOf(
                                datasets[index_set[i]].x as string
                              ) *
                                x.bandwidth() +
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
                                  y.bandwidth() +
                                  datasets[index_set[i]].offset +
                                  6)
                            )
                          : Math.abs(
                              oldX -
                                (listofstringsforlabels_x_axis.indexOf(
                                  datasets[index_set[i]].x as string
                                ) *
                                  x.bandwidth() +
                                  datasets[index_set[i]].offset +
                                  6)
                            );
                    }
                  }
                }
              }
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
                          ? -6 + height
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
                          ? scales.x_brand(d.x as string) + 6
                          : i === index && axis === "xy_xnum_ystr"
                          ? scales.x_num(newX)
                          : d3.select(this).attr("cx")
                      )
                      .attr(
                        "cy",
                        i === index && axis === "xy_xnum_ystr"
                          ? scales.y_brand(d.y as string) - 6 + y.bandwidth()
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
              const mean = d3.mean(updatedSingledataset, (d) => Number(d.p));
              // Update the visual postion of the mean line
              svg
                .select(`.mean-line-${axis}`)
                .attr("x1", axis === "x" ? scales.x_num(mean) : 0)
                .attr("y1", axis === "y" ? scales.y_num(mean) : 0)
                .attr("x2", axis === "x" ? scales.x_num(mean) : width)
                .attr("y2", axis === "y" ? scales.y_num(mean) : height);
            })
            .on("end", (_) => {
              count = 0;
              // Update the data of the circle (this is true)
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
                console.log("XANh");
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
            });
        };

        singeledatasets.forEach((_, i) => {
          svg.select(`.single-x-${i}`).call(drag("x"));
          svg.select(`.single-y-${i}`).call(drag("y"));
        });
        datasets.forEach((_, i) => {
          x_axis_type === "number" && y_axis_type === "string"
            ? svg.select(`.dataset-${i}`).call(drag("xy_xnum_ystr"))
            : svg.select(`.dataset-${i}`).call(drag("xy_xstr_ynum"));
        });
      }
      // Brushing for select or deselect points
      const select_deselect =
        this.selectByBrushing === true
          ? "select"
          : this.deselectByBrushing === true
          ? "deselect"
          : undefined;
      // Flag to track if brushing is enabled
      if (this.selectNode && !this.selectByClicking) {
        if (this.selectByBrushing || this.deselectByBrushing) {
          let brushingEnabled = true;
          const brush = d3
            .brush()
            .extent([
              [0, 0],
              [width, height],
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
                      : scales.x_brand(d.x as string) + 6 + d.offset;
                  const cy =
                    y_axis_type === "number"
                      ? scales.y_num(d.y as number)
                      : scales.y_brand(d.y as string) -
                        6 -
                        d.offset +
                        y.bandwidth();
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
                      : scales.x_brand(d.p as string) + x.bandwidth() / 2;
                  const cy =
                    y_axis_type === "none"
                      ? -6 + height - d.offset
                      : y_axis_type === "number"
                      ? scales.y_num(d.p as number)
                      : scales.y_brand(d.p as string) + y.bandwidth() / 2;
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
                      : scales.x_brand(d.x as string) + 6 + d.offset;
                  const cy =
                    y_axis_type === "number"
                      ? scales.y_num(d.y as number)
                      : scales.y_brand(d.y as string) -
                        6 -
                        d.offset +
                        y.bandwidth();
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
                      : scales.x_brand(d.p as string) + x.bandwidth() / 2;
                  const cy =
                    y_axis_type === "none"
                      ? -6 + height - d.offset
                      : y_axis_type === "number"
                      ? scales.y_num(d.p as number)
                      : scales.y_brand(d.p as string) + y.bandwidth() / 2;
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
      }
      // Select by clicking
      // Clicking for selecting points
      if (
        this.selectNode &&
        this.selectByClicking &&
        !this.selectByBrushing &&
        !this.deselectByBrushing
      ) {
        let minDistance = 0.3;
        let minDistance_band = Infinity;
        let index = -1;
        let count = 0;
        let index_set: number[] = [];
        const clicked = (
          axis: "x" | "y" | "xy_xnum_ystr" | "xy_xstr_ynum",
          event: MouseEvent
        ) => {
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
                            y.bandwidth() +
                            datasets[index_set[i]].offset +
                            6)
                      ) < minDistance_band
                    : Math.abs(
                        oldX -
                          (listofstringsforlabels_x_axis.indexOf(
                            datasets[index_set[i]].x as string
                          ) *
                            x.bandwidth() +
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
                              y.bandwidth() +
                              datasets[index_set[i]].offset +
                              6)
                        )
                      : Math.abs(
                          oldX -
                            (listofstringsforlabels_x_axis.indexOf(
                              datasets[index_set[i]].x as string
                            ) *
                              x.bandwidth() +
                              datasets[index_set[i]].offset +
                              6)
                        );
                }
              }
            }
          }
          // Update the nearest point to be selected
          if (index !== -1) {
            selectedDataset.dimensional_data[index].selected = true;
          }
          this.selectByClicking = false;
          this.updateScatterplot();
        };
        // Click event listener
        singeledatasets.forEach((_, i) => {
          svg
            .select(`.single-x-${i}`)
            .on("click", (event) => clicked("x", event));
          svg
            .select(`.single-y-${i}`)
            .on("click", (event) => clicked("y", event));
        });
        datasets.forEach((_, i) => {
          x_axis_type === "number" && y_axis_type === "string"
            ? svg
                .select(`.dataset-${i}`)
                .on("click", (event) => clicked("xy_xnum_ystr", event))
            : svg
                .select(`.dataset-${i}`)
                .on("click", (event) => clicked("xy_xstr_ynum", event));
        });
      }
      //Hide selected points
      if (this.hideSelected) {
        singeledatasets.forEach((d: OneDimentionalPoint, i) => {
          if (d.selected) {
            scatter.select(`.single-x-${i}`).style("display", "none");
            scatter.select(`.single-y-${i}`).style("display", "none");
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
        singeledatasets.forEach((d: OneDimentionalPoint, i) => {
          scatter.select(`.single-x-${i}`).style("display", "block");
          scatter.select(`.single-y-${i}`).style("display", "block");
        });
        datasets.forEach((d: Point, i) => {
          scatter.select(`.dataset-${i}`).style("display", "block");
        });
      }

      // Draw line for mean of x or y data
      //TODO: When hide, the mean line should be updated
      //TODO: Pos. of the tooltip and the mean line

      if (x_axis_type === "number" || y_axis_type === "number") {
        const meanLine = (axis: "x" | "y") => {
          const data =
            axis === "x" ? data_for_x_axis_copy : data_for_y_axis_copy;
          const mean = d3.mean(data, (d) => Number(axis === "x" ? d.x : d.y));
          // line with tooltip
          const tooltip = d3
            .select(root)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px");
          if (x_axis_type === "none" || y_axis_type === "none") {
            svg
              .append("line")
              .attr("x1", axis === "x" ? scales.x_num(mean) : 0)
              .attr("y1", axis === "y" ? scales.y_num(mean) : 0)
              .attr("x2", axis === "x" ? scales.x_num(mean) : width)
              .attr("y2", axis === "y" ? scales.y_num(mean) : height)
              .attr("stroke", "black")
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", "4")
              .attr("class", `mean-line-${axis}`);
            /*.on("mouseover", (event, d) => {
                tooltip
                  .style("opacity", 1)
                  .html(
                    `${
                      axis === "x" ? axisLabels.x : axisLabels.y
                    } + mean: ${mean.toFixed(2)}`
                  )
                  .style("left", `${event.pageX - 100}px`)
                  .style("top", `${event.pageY - 100}px`);
              })
              .on("mouseleave", () => {
                tooltip.transition().duration(200).style("opacity", 0);
              });*/
          } else {
            if (axis === "x") {
              listofstringsforlabels_y_axis.map((l, i) => {
                const mean_i = d3.mean(
                  datasets_copy.filter((d) => d.y === l),
                  (d) => Number(d.x)
                );
                svg
                  .append("line")
                  .attr("x1", scales.x_num(mean_i))
                  .attr("y1", height - i * y.bandwidth())
                  .attr("x2", scales.x_num(mean_i))
                  .attr("y2", height - (i + 1) * y.bandwidth())
                  .attr("stroke", "black")
                  .attr("stroke-width", 2)
                  .attr("stroke-dasharray", "4")
                  .attr("class", `mean-line-${axis}-${i}`);
                /*.on("mouseover", (event, d) => {
                    tooltip
                      .style("opacity", 1)
                      .html(`${axisLabels.x} + mean: ${mean_i.toFixed(2)}`)
                      .style("left", `${event.pageX - 100}px`)
                      .style("top", `${event.pageY - 100}px`);
                  })
                  .on("mouseleave", () => {
                    tooltip.transition().duration(200).style("opacity", 0);
                  });*/
              });
            } else {
              listofstringsforlabels_x_axis.map((l, i) => {
                const mean_i = d3.mean(
                  datasets_copy.filter((d) => d.x === l),
                  (d) => Number(d.y)
                );
                svg
                  .append("line")
                  .attr("x1", i * x.bandwidth())
                  .attr("y1", scales.y_num(mean_i))
                  .attr("x2", (i + 1) * x.bandwidth())
                  .attr("y2", scales.y_num(mean_i))
                  .attr("stroke", "black")
                  .attr("stroke-width", 2)
                  .attr("stroke-dasharray", "4")
                  .attr("class", `mean-line-${axis}-${i}`);
                /*
                  .on("mouseover", (event, d) => {
                    tooltip
                      .style("opacity", 1)
                      .html(`${axisLabels.y} + mean: ${mean_i.toFixed(2)}`)
                      .style("left", `${event.pageX - 100}px`)
                      .style("top", `${event.pageY - 100}px`);
                  })
                  .on("mouseleave", () => {
                    tooltip.transition().duration(200).style("opacity", 0);
                  });*/
              });
            }
          }
        };

        if (x_axis_type === "number") {
          meanLine("x");
        }
        if (y_axis_type === "number") {
          meanLine("y");
        }
      }
      // Select the color table body
      const colorFormulaRoot = this.shadowRoot.querySelector(".color-formulas");
      if (
        selectedDataset.filter.label &&
        selectedDataset.filter.type !== "none"
      ) {
        [...colorFormulaRoot.children].forEach((child) => child.remove());
        if (selectedDataset.filter.type === "number") {
          selectedDataset.filter.rangesandcolors.forEach((rangeandcolor, i) => {
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
          });
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
  public static get scopedElements() {
    return {
      "sl-range": SlRange,
      "sl-button": SlButton,
      "sl-icon": SlIcon,
      "sl-popup": SlPopup,
      "sl-menu": SlMenu,
      "sl-menu-item": SlMenuItem,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scatterplot-chart": ScatterplotChart;
  }
}
