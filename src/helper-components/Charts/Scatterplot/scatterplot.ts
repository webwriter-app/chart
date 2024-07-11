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
} from "./drawScatterplot";
import style from "./scatterplot.style";
export interface Point {
  x: number;
  y: number;
  selected?: boolean;
  color?: string;
  label?: string;
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
    return html`<div class="scatterplot-root">
      <div class="scatterplot-wrapper">
        <div class="scatterplot-svg"></div>
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
              ${this.sharedState.scatterplotdatasets.sets.map((dataset, i) => {
                return html`<sl-button
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    this.selectedIndextoAddNote = i;
                    this.updateScatterplot();
                  }}
                >
                  Add data of ${dataset.scatter_titel}
                </sl-button>`;
              })}
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
                    this.sharedState.scatterplotdatasets.sets.forEach(
                      (dataset) => {
                        for (
                          let i = dataset.dimensional_data.length - 1;
                          i >= 0;
                          i--
                        ) {
                          if (dataset.dimensional_data[i].selected) {
                            dataset.dimensional_data.splice(i, 1);
                            dataset.labels.splice(i, 1);
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
                    this.sharedState.scatterplotdatasets.sets.forEach(
                      (dataset) => {
                        for (
                          let i = dataset.dimensional_data.length - 1;
                          i >= 0;
                          i--
                        ) {
                          if (!dataset.dimensional_data[i].selected) {
                            dataset.dimensional_data.splice(i, 1);
                            dataset.labels.splice(i, 1);
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
                  <th class="th_regression">Line</th>
                </tr>
              </thead>
              <tbody class="line-formulas"></tbody>
            </table>
          </div>
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
    </div>`;
  }
  get totalDataLength() {
    let length = 0;
    this.sharedState.scatterplotdatasets.sets.forEach(
      (dataset) => (length += dataset.dimensional_data.length)
    );
    return length;
  }
  // Get the length of the selected data points
  get selectedDataLength() {
    let length = 0;
    this.sharedState.scatterplotdatasets.sets.forEach((dataset) => {
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
    this.sharedState.scatterplotdatasets.sets.forEach((dataset) => {
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
  createScatterPlot() {
    const datasets: Point[][] = this.sharedState.scatterplotdatasets.sets.map(
      (dataset) =>
        dataset.dimensional_data.map((d: Point, i) => {
          // !IMPORTANT: Keep the refernce to the original dataset to update data when updating points directly!
          d.color = dataset.scatter_color;
          d.label = dataset.labels[i];
          d.scatter_titel = dataset.scatter_titel;
          return d;
        })
    );
    const lineDatasetsWithCenterPoint: Point[][] =
      this.sharedState.lineDatasets.sets.map((dataset) =>
        dataset.data.concat([
          {
            x: (dataset.data[0].x + dataset.data[1].x) / 2,
            y: (dataset.data[0].y + dataset.data[1].y) / 2,
          },
        ])
      );

    const axisLabels = this.sharedState.scatterplotdatasets.axisLabels;

    const root = this.shadowRoot.querySelector(".scatterplot-svg");

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
        this.sharedState.scatterplotdatasets
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
        this.sharedState.scatterplotdatasets.sets.length
    ) {
      svg.on("click", (event) => {
        addPointListeners(
          event,
          svg,
          scales,
          this.sharedState.scatterplotdatasets,
          this.selectedIndextoAddNote
        );
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
          this.sharedState.scatterplotdatasets
        );
        // Re-render
        this.updateScatterplot();
      });
    }

    // Dragging points to change their position
    //TODO: Fix the problem with yelow marks when dragging (maybe focus problem)
    //TODO: yellow marks appear after (eg. selectwith brush). The setting disappears
    if (!(this.selectNode || this.selectByClicking)) {
      addDragingPointListeners(svg, scatter, scales, () => {
        this.updateScatterplot();
      });
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
          () => {
            this.updateScatterplot();
          },
          this.selectByBrushing ? "select" : "deselect"
        );
      }
    }

    //Hide selected points
    if (this.hideSelected) {
      scatter.selectAll("circle").each(function (d: Point) {
        if (d.selected) {
          d3.select(this).style("display", "none");
        }
      });
    }
    //Hide unselected points
    if (this.hideUnselected) {
      scatter.selectAll("circle").each(function (d: Point) {
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
      .on("drag", (event, d: Point) => {
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
      .on("drag", (event, d: Point) => {
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
      .on("drag", (event, d: Point) => {
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
        .attr("x", center.x - 5)
        .attr("y", center.y - 5)
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
        .attr("x", endPointsLeft.x - 5) // Position of the rectangle
        .attr("y", endPointsLeft.y - 5)
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
        .attr("x", endPointsRight.x - 5)
        .attr("y", endPointsRight.y - 5)
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
        .attr("cx", (d: Point) => scales.x(d.x))
        .attr("cy", (d: Point) => scales.y(d.y))
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
              `svg circle[cx="${scales.x(event.x)}"][cy="${scales.y(event.y)}"]`
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
