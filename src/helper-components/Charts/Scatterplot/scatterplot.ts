import { html, css } from "lit";
import * as d3 from "d3";
import * as d3regression from "d3-regression";
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

@customElement("scatterplot-chart")
export class ScatterplotChart extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  static styles = css`
    :host {
      width: 100%;
    }
    .scatterplot-root {
      width: 100%;
    }
    .scatterplot-wrapper {
      display: flex;
      flex-direction: row; /* Align items in a row */
      align-items: flex-start; 
      align-items: flex-start; /* Align items to the top */
      height: 100%;
    }
    .scatterplot-svg {
      flex-grow: 1; /* Allow the SVG to take available space */
    }
    .button-container {
      margin-left: 10px; /* Optional: Add some space between the SVG and the button */
    }
    table,
    th,
    tr,
    td {
      border: 0.5px solid black;
      border-collapse: collapse;

    }
    .th_regression {
      min-width: 10rem;
    }
    .th_correlation {
      min-width: 2.5rem;
    }
    .table-wrapper {
      margin-top: 20px;
    }
    table {
      display: inline-table;
      background: white;
    }
    .regression-formulas td {
      font-size: 12px;
    }
    svg {
      border: 1px solid black;
      flex: 1 0 0
      width: 100%;
    }

    text {
      font-family: Helvetica;
      font-size: 12px;
      color: #333;
    }
    g {
      font-size: 12px;
    }
    .selected {
      opacity: 1 !important;
      stroke: black !important;
      stroke-width: 1px !important;
    }
    .selected-rect{
      opacity: 1 !important;
      stroke: red !important;
      stroke-width: 1.5px !important;
    }
    .popup-content {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      background: white;
      box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    }
    
  `;

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
          <sl-popup placement="right" strategy="fixed" .active=${this.addNode}>
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
              <sl-icon name="gear" label="Settings"></sl-icon>
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
            placement="right"
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
              <sl-icon name="gear" label="Settings"></sl-icon>
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
            placement="right"
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
              <sl-icon name="gear" label="Settings"></sl-icon>
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
            placement="right"
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
              <sl-icon name="gear" label="Settings"></sl-icon>
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
    document.addEventListener("keypress", (e) => {
      switch (e.key) {
        case "Backspace":
        case "Delete":
      }
    });
  }
  //updatePlot for new animation time
  //TODO: Fix the focus problem
  // TODO: Add name for scatterplot, maybe use the text feld?
  // TODO: Name for each dataset unter the scatterplot
  //TODO: Table for statistics: r, regression folrmula, mean, etc.
  //TODO: Fix buttons convert and download image
  //TODO: Given x and calculate y (geogbra)
  //TODO: Temporary delete some dataset
  // TODO: Delete outliers to study the rest
  //TODO: Show all regression line when cut
  //TODO: Fix pos. of Corellation when more than one dataset and regresion formula is long
  //TODO: see friendly error message and user drag, delete, add points from automa (WR)
  //TODO: Fix edit button
  //TODO: dymanic and manuell scaling for x and y axis
  //TODO: Feedback for choose the right point
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
    !this.hideSelected && !this.hideUnselected ? (this.showAll = true) : null;
    const root = this.shadowRoot.querySelector(".scatterplot-root");
    d3.select(root).selectAll("svg").remove();
    d3.select(root).selectAll(".tooltip").remove();
    d3.select(root).selectAll("path.line").remove();
    this.createScatterPlot();
  }
  createScatterPlot() {
    const datasets: {
      x: number;
      y: number;
      selected: boolean;
      color?: string;
      label?: string;
      scatter_titel?: string;
    }[][] = [];
    this.sharedState.scatterplotdatasets.sets.forEach((dataset) => {
      datasets.push(dataset.dimensional_data);
    });
    // get the max value of the dataset
    let maxX = 0;
    let maxY = 0;
    let minX = 0;
    let minY = 0;
    datasets.forEach((dataset) => {
      Math.max(...dataset.map((d) => d.x)) > maxX
        ? (maxX = Math.max(...dataset.map((d) => d.x)))
        : maxX;
      Math.max(...dataset.map((d) => d.y)) > maxY
        ? (maxY = Math.max(...dataset.map((d) => d.y)))
        : maxY;
      Math.min(...dataset.map((d) => d.x)) < minX
        ? (minX = Math.min(...dataset.map((d) => d.x)))
        : minX;
      Math.min(...dataset.map((d) => d.y)) < minY
        ? (minY = Math.min(...dataset.map((d) => d.y)))
        : minY;
    });
    // Add colors
    datasets.map((dataset, index) => {
      dataset.map(
        (d) =>
          (d.color =
            this.sharedState.scatterplotdatasets.sets[index].scatter_color)
      );
    });
    // Add labels
    datasets.map((dataset, index) => {
      dataset.map(
        (d, i) =>
          (d.label = this.sharedState.scatterplotdatasets.sets[index].labels[i])
      );
    });
    // Add scatterplot title
    datasets.map((dataset, index) => {
      dataset.map(
        (d) =>
          (d.scatter_titel =
            this.sharedState.scatterplotdatasets.sets[index].scatter_titel)
      );
    });
    let xlabel = String(this.sharedState.scatterplotdatasets.axisLabels.x);
    let ylabel = String(this.sharedState.scatterplotdatasets.axisLabels.y);
    let animationTime = Number(this.definition.animationTime);

    const roundingFactorX = 10 ** Math.floor(Math.log10(maxX));
    maxX = Math.ceil(maxX / roundingFactorX) * roundingFactorX;

    const roundingFactorY = 10 ** Math.floor(Math.log10(maxY));
    maxY = Math.ceil(maxY / roundingFactorY) * roundingFactorY;

    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 50, left: 70 },
      width = 550 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const root = this.shadowRoot.querySelector(".scatterplot-svg");
    // Add tooltip for data points
    const tooltip = d3
      .select(root)
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("position", "fixed")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

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
    // Add a transparent rectangle to capture click events
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all");

    // Add X axis
    const x = d3.scaleLinear().domain([minX, maxX]).range([0, width]);
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    svg
      .append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("style", "text-align: center;")
      .text(xlabel);
    // Add Y axis
    const y = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    svg
      .append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", -((height + margin.bottom) / 2)) // to my x axis
      .attr("y", -40) // to my y axis
      .attr("transform", "rotate(-90)")
      .text(ylabel);

    // For normal scatter plot
    let scatter = svg.append("g").attr("clip-path", "url(#clip)");
    // Draw the scatter plot
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      scatter
        .selectAll(`circle.dataset-${i}`)
        .data(datasets[i])
        .enter()
        .append("circle")
        .attr("class", `dataset-${i}`)
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", 7)
        .style("fill", (d) => d.color ?? "#417ca1")
        .style("stroke", "white")
        .style("opacity", 0.5)
        .classed("selected", (d) => d.selected)
        .on("mouseover", (_e, d) => {
          if (this.options.hoverTooltip) {
            tooltip
              .style("opacity", 1)
              .html(
                d.label +
                  "<br/>" +
                  xlabel +
                  ": " +
                  d.x +
                  " " +
                  ylabel +
                  ": " +
                  d.y
              );
          }
        })
        .on("mousemove", (e) => {
          tooltip.style("left", e.x + 10 + "px").style("top", e.y + 10 + "px");
        })
        .on("mouseleave", () => {
          tooltip.transition().duration(200).style("opacity", 0);
        });
      // Show outliers for each dataset
      if (this.options.showOutliers) {
        const datasetLabel = String(dataset[0].scatter_titel);
        // Find outliers using the IQR method
        const q1_y = d3.quantile(
          dataset.map((d) => d.y).sort(d3.ascending),
          0.25
        );
        const q3_y = d3.quantile(
          dataset.map((d) => d.y).sort(d3.ascending),
          0.75
        );
        const iqr_y = q3_y - q1_y;
        const min_y = q1_y - 1.5 * iqr_y;
        const max_y = q3_y + 1.5 * iqr_y;
        const outliers_y = dataset.filter((d) => d.y < min_y || d.y > max_y);

        const q1_x = d3.quantile(
          dataset.map((d) => d.x).sort(d3.ascending),
          0.25
        );
        const q3_x = d3.quantile(
          dataset.map((d) => d.x).sort(d3.ascending),
          0.75
        );
        const iqr_x = q3_x - q1_x;
        const min_x = q1_x - 1.5 * iqr_x;
        const max_x = q3_x + 1.5 * iqr_x;
        const outliers_x = dataset.filter((d) => d.x < min_x || d.x > max_x);

        const outliers = outliers_x.concat(outliers_y);
        scatter
          .selectAll(`circle.dataset-${i}`)
          .data(outliers, (d) => `${d.x}-${d.y}`) // Assuming x and y uniquely identify each circle
          .style("fill", "#f9080c")
          .style("opacity", 1)
          .on("mouseover", (event, d) => {
            tooltip
              .style("opacity", 1)
              .html(
                `${
                  datasetLabel ? "Outlier of " + datasetLabel : "Outlier"
                }<br>${xlabel}: ${d.x} ${ylabel}: ${d.y}`
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY + 10}px`);
          })
          .on("mouseleave", () => {
            tooltip.transition().duration(200).style("opacity", 0);
          });
      }
    }
    // Draw all line in lineDatasets
    /*
    this.sharedState.lineDatasets.sets.forEach((dataset) => {
      const line = d3
        .line()
        .x((d) => x(d.x))
        .y((d) => y(d.y));
      svg
        .append("path")
        .datum(dataset.data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 2)
        .attr("d", line);
    });*/

    // Handle recht click to remove point
    svg.on("contextmenu", (event) => {
      event.preventDefault();
      const [clickX, clickY] = d3.pointer(event, svg.node());
      // Find the closest point to the recht clicked position
      let minDistance = Infinity;
      let closestPoint: {
        x: number;
        y: number;
        selected: boolean;
        color?: string;
        label?: string;
        scatter_titel?: string;
      } = null;
      const flattenedDatasets = datasets.flat();
      for (let i = flattenedDatasets.length - 1; i >= 0; i--) {
        const point = flattenedDatasets[i];
        const distance = Math.sqrt(
          (x(point.x) - clickX) ** 2 + (y(point.y) - clickY) ** 2
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
      const threshold = 7;
      if (minDistance < threshold && closestPoint) {
        // Find the index of the scatterplot dataset
        let datasetIndex = -1;
        for (
          let i = this.sharedState.scatterplotdatasets.sets.length - 1;
          i >= 0;
          i--
        ) {
          const dataset = this.sharedState.scatterplotdatasets.sets[i];
          if (
            dataset.scatter_titel === closestPoint.scatter_titel &&
            dataset.scatter_color === closestPoint.color &&
            dataset.labels.includes(closestPoint.label) &&
            dataset.dimensional_data.some(
              (point) =>
                point.x === closestPoint.x &&
                point.y === closestPoint.y &&
                point.selected === closestPoint.selected
            )
          ) {
            datasetIndex = i;
            break; // Optional: stop at the first match from the end
          }
        }
        if (datasetIndex !== -1) {
          //Find the index of the point in the dataset
          let index = -1;
          const dimensionalData =
            this.sharedState.scatterplotdatasets.sets[datasetIndex]
              .dimensional_data;
          for (let i = dimensionalData.length - 1; i >= 0; i--) {
            const point = dimensionalData[i];
            if (
              point.x === closestPoint.x &&
              point.y === closestPoint.y &&
              point.selected === closestPoint.selected
            ) {
              index = i;
              break; // Optional: stop at the first match from the end
            }
          }
          if (index !== -1) {
            // Remove the point from the dataset
            this.sharedState.scatterplotdatasets.sets[
              datasetIndex
            ].dimensional_data.splice(index, 1);
            // Remove the label from the dataset
            this.sharedState.scatterplotdatasets.sets[
              datasetIndex
            ].labels.splice(index, 1);
          }
        }
      }
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
        const [clickX, clickY] = d3.pointer(event, svg.node());
        const newX = x.invert(clickX);
        const newY = y.invert(clickY);

        // Add the new point to the dataset
        this.sharedState.scatterplotdatasets.sets[
          this.selectedIndextoAddNote
        ].dimensional_data.push({
          x: newX,
          y: newY,
          selected: false,
        });
        this.sharedState.scatterplotdatasets.sets[
          this.selectedIndextoAddNote
        ].labels.push("new Point");
        // Re-render
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
        const [clickX, clickY] = d3.pointer(event, svg.node());

        // Find the closest point to the clicked position
        let minDistance = Infinity;
        let closestPoint: {
          x: number;
          y: number;
          selected: boolean;
          color?: string;
          label?: string;
          scatter_titel?: string;
        } = null;
        const flattenedDatasets = datasets.flat();
        for (let i = flattenedDatasets.length - 1; i >= 0; i--) {
          const point = flattenedDatasets[i];
          const distance = Math.sqrt(
            (x(point.x) - clickX) ** 2 + (y(point.y) - clickY) ** 2
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        }
        const threshold = 7;
        if (minDistance < threshold && closestPoint) {
          let datasetIndex = -1;
          // Find the index of the scatterplot dataset

          // Iterate through the array from end to beginning
          for (
            let i = this.sharedState.scatterplotdatasets.sets.length - 1;
            i >= 0;
            i--
          ) {
            const dataset = this.sharedState.scatterplotdatasets.sets[i];
            if (
              dataset.scatter_titel === closestPoint.scatter_titel &&
              dataset.scatter_color === closestPoint.color &&
              dataset.labels.includes(closestPoint.label) &&
              dataset.dimensional_data.some(
                (point) =>
                  point.x === closestPoint.x &&
                  point.y === closestPoint.y &&
                  point.selected === closestPoint.selected
              )
            ) {
              datasetIndex = i;
              break; // Optional: stop at the first match from the end
            }
          }
          if (datasetIndex !== -1) {
            // Find the index of the point in the dataset
            let index = -1;
            const dimensionalData =
              this.sharedState.scatterplotdatasets.sets[datasetIndex]
                .dimensional_data;
            for (let i = dimensionalData.length - 1; i >= 0; i--) {
              const point = dimensionalData[i];
              if (
                point.x === closestPoint.x &&
                point.y === closestPoint.y &&
                point.selected === closestPoint.selected
              ) {
                index = i;
                break; // Optional: stop at the first match from the end
              }
            }
            if (index !== -1) {
              // Check if the point is selected, if it is, remove it, if it is not, add it
              dimensionalData[index].selected
                ? (dimensionalData[index].selected = false)
                : (dimensionalData[index].selected = true);
            }
          }
        }
        // Re-render
        this.updateScatterplot();
      });
    }

    // Dragging points to change their position
    //TODO: Fix the problem with yelow marks when dragging (maybe focus problem)
    //TODO: yellow marks appear after (eg. selectwith brush). The setting disappears
    if (!(this.selectNode || this.selectByClicking)) {
      const drag = d3
        .drag()
        .on("start", (event, _) => {
          d3.select(event.sourceEvent.target).classed("selected", true);
        })
        .on("drag", (event, d) => {
          // Get new coordinates relative to the SVG container
          const [newX, newY] = d3.pointer(event, svg.node());
          // Optionally, update the data if needed
          d.x = x.invert(newX);
          d.y = y.invert(newY);

          // Update the visual position of the circle
          d3.select(event.sourceEvent.target)
            .attr("cx", x(d.x))
            .attr("cy", y(d.y));
        })
        .on("end", (event, d) => {
          const selected = d.selected;
          // Update the visual position of the circle
          d3.select(event.sourceEvent.target).classed("selected", selected);
          // Re-render
          this.updateScatterplot();
        });
      scatter.selectAll("circle").call(drag);
    }
    // Function to check if a point is brushed
    function isBrushed(brush_coords, cx, cy) {
      const x0 = brush_coords[0][0],
        x1 = brush_coords[1][0],
        y0 = brush_coords[0][1],
        y1 = brush_coords[1][1];
      return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    }

    // Handle brushing to select points (Select all points if they have the same coordinates)
    if (
      this.selectNode &&
      !this.selectByClicking &&
      this.selectByBrushing &&
      !this.deselectByBrushing
    ) {
      let brushingEnabled = true; // Flag to track if brushing is enabled

      // Initialize brush behavior
      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("start brush", updateChartForSelection)
        .on("end", (event) => {
          finalizeSelection(event);
          this.updateScatterplot();
        });

      svg.call(brush);

      function updateChartForSelection(event) {
        if (!brushingEnabled) return; // Exit if brushing is disabled
        const extent = event.selection;
        scatter.selectAll("circle").each(function (d) {
          // Reset to current selected state during brushing
          d3.select(this).classed("selected", d.selected);
          if (extent) {
            if (isBrushed(extent, x(d.x), y(d.y))) {
              // Temporarily add the selected class for brushed points
              d3.select(this).classed("selected", true);
            }
          }
        });
      }

      function finalizeSelection(event) {
        if (!brushingEnabled) return; // Exit if brushing is disabled
        const extent = event.selection;
        if (extent) {
          scatter.selectAll("circle").each(function (d) {
            if (isBrushed(extent, x(d.x), y(d.y))) {
              d.selected = true; // Definitively select the point if it is brushed
            }
            // Update the class based on final selection
            d3.select(this).classed("selected", d.selected);
          });
        }
        brushingEnabled = false; // Disable brushing after the first brush
        // delete the brush
        svg.call(brush.move, null); // Clear the brush selection
        svg.on(".brush", null); // Remove brush event listeners
        svg.selectAll(".overlay").remove(); // Remove any overlay elements created by brushing
      }
    }

    // Handle deselecting points by brushing (deselect all points if they have the same coordinates)
    if (
      this.selectNode &&
      !this.selectByClicking &&
      !this.selectByBrushing &&
      this.deselectByBrushing
    ) {
      // Brushing for deselecting points (Select all points if they have the same coordinates)
      let brushingEnabled = true;
      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("start brush", updateChartForDeselection)
        .on("end", (event) => {
          finalizeDeselection(event);
          this.updateScatterplot();
        });

      svg.call(brush);

      function updateChartForDeselection(event) {
        if (!brushingEnabled) return; // Exit if brushing is disabled
        const extent = event.selection;
        scatter.selectAll("circle").each(function (d) {
          // Reset to current selected state during brushing
          d3.select(this).classed("selected", d.selected);
          if (extent) {
            if (isBrushed(extent, x(d.x), y(d.y))) {
              // Temporarily remove the selected class for brushed points
              d3.select(this).classed("selected", false);
            }
          }
        });
      }

      function finalizeDeselection(event) {
        if (!brushingEnabled) return; // Exit if brushing is disabled
        const extent = event.selection;
        if (extent) {
          scatter.selectAll("circle").each(function (d) {
            if (isBrushed(extent, x(d.x), y(d.y))) {
              d.selected = false; // Definitively deselect the point if it is brushed
            }
            // Update the class based on final selection
            d3.select(this).classed("selected", d.selected);
          });
        }
        brushingEnabled = false; // Disable brushing after the first brush
      }
    }

    //Hide selected points
    if (this.hideSelected) {
      scatter.selectAll("circle").each(function (d) {
        if (d.selected) {
          d3.select(this).style("display", "none");
        }
      });
    }
    //Hide unselected points
    if (this.hideUnselected) {
      scatter.selectAll("circle").each(function (d) {
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
      let x1, y1, x2, y2;
      let isDrawing = false;
      let line;

      svg.on("mousedown", (event) => {
        if (!isDrawing) {
          isDrawing = true;
          [x1, y1] = d3.pointer(event, svg.node());
          [x2, y2] = [x1, y1]; // Start with both points at the mouse position

          // Append a new line on mousedown
          line = svg
            .append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .style("cursor", "move");

          svg.on("mousemove", drawLine);
          svg.on("mouseup", () => {
            saveLine();
            // Save the line data to shared state
            const data = [
              { x: x.invert(x1), y: y.invert(y1) },
              { x: x.invert(x2), y: y.invert(y2) },
            ];
            this.sharedState.lineDatasets.sets.push({ data: data });
            this.updateScatterplot();
          });
        }
      });

      function drawLine(event) {
        [x2, y2] = d3.pointer(event, svg.node());
        line.attr("x2", x2).attr("y2", y2);
      }

      function saveLine() {
        if (isDrawing) {
          isDrawing = false;
          svg.on("mousemove", null);
          svg.on("mouseup", null);
        }
      }
    }

    //TODO: Limit the line to the scatterplot area
    // Handle dragging lines to new positions
    // Define the drag behavior for the center point of the line to move the entire line up or down
    // Define the drag behavior for the center point
    const dragCenter = d3
      .drag()
      .on("start", (event, _) => {
        d3.select(event.sourceEvent.target).classed("selected-rect", true);
      })
      .on("drag", (event, d) => {
        let index = -1;
        // Find index i of the line
        for (
          let i = this.sharedState.lineDatasets.sets.length - 1;
          i >= 0;
          i--
        ) {
          const dataset = this.sharedState.lineDatasets.sets[i];
          if (
            Math.abs(dataset.data[0].x - x.invert(d[0].x)) < 0.01 &&
            Math.abs(dataset.data[0].y - y.invert(d[0].y)) < 0.01 &&
            Math.abs(dataset.data[1].x - x.invert(d[1].x)) < 0.01 &&
            Math.abs(dataset.data[1].y - y.invert(d[1].y)) < 0.01
          ) {
            index = i;
            break; // Optional: stop at the first match from the end
          }
        }
        if (index === -1) {
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
        svg
          .select(`.line-${index}`)
          .attr("x1", d[0].x)
          .attr("y1", d[0].y)
          .attr("x2", d[1].x)
          .attr("y2", d[1].y);

        svg
          .select(`.end-point-left-${index}`)
          .attr("x", d[indexForEndPointsLeft].x - 5)
          .attr("y", d[indexForEndPointsLeft].y - 5);
        svg
          .select(`.end-point-right-${index}`)
          .attr("x", d[indexForEndPointsRight].x - 5)
          .attr("y", d[indexForEndPointsRight].y - 5);

        svg
          .select(`.center-point-${index}`)
          .attr("x", (d[0].x + d[1].x) / 2 - 5)
          .attr("y", (d[0].y + d[1].y) / 2 - 5);
        // Update the coordinates of the line
        this.sharedState.lineDatasets.sets[index].data[0].x = x.invert(d[0].x);
        this.sharedState.lineDatasets.sets[index].data[0].y = y.invert(d[0].y);
        this.sharedState.lineDatasets.sets[index].data[1].x = x.invert(d[1].x);
        this.sharedState.lineDatasets.sets[index].data[1].y = y.invert(d[1].y);
      })
      .on("end", (event, _) => {
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
      .on("drag", (event, d) => {
        // Find index i of the line
        for (
          let i = this.sharedState.lineDatasets.sets.length - 1;
          i >= 0;
          i--
        ) {
          const dataset = this.sharedState.lineDatasets.sets[i];
          if (
            Math.abs(dataset.data[0].x - x.invert(d[0].x)) < 0.01 &&
            Math.abs(dataset.data[0].y - y.invert(d[0].y)) < 0.01 &&
            Math.abs(dataset.data[1].x - x.invert(d[1].x)) < 0.01 &&
            Math.abs(dataset.data[1].y - y.invert(d[1].y)) < 0.01
          ) {
            index_right = i;
            break; // Optional: stop at the first match from the end
          }
        }
        if (index_right === -1) {
          return;
        }
        // Rotate the line around the center point
        const [newX, newY] = d3.pointer(event, svg.node());

        // Calculate the center of the line segment
        const centerX = (d[0].x + d[1].x) / 2;
        const centerY = (d[0].y + d[1].y) / 2;

        // Calculate the radius and angle
        const dx = newX - centerX;
        const dy = newY - centerY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Determine the current endpoint being dragged
        const endIndex = d.x === d[0].x && d.y === d[0].y ? 0 : 1;
        const otherIndex = 1 - endIndex;

        // Update the dragged endpoint position
        d[endIndex].x = centerX + radius * Math.cos(angle);
        d[endIndex].y = centerY + radius * Math.sin(angle);

        // Update the other endpoint to maintain the length of the line
        d[otherIndex].x = centerX - radius * Math.cos(angle);
        d[otherIndex].y = centerY - radius * Math.sin(angle);

        // Update the visual position of the line and points
        svg
          .select(`.line-${index_right}`)
          .attr("x1", d[0].x)
          .attr("y1", d[0].y)
          .attr("x2", d[1].x)
          .attr("y2", d[1].y);

        svg
          .select(`.end-point-left-${index_right}`)
          .attr("x", d[0].x - 5)
          .attr("y", d[0].y - 5);
        svg
          .select(`.end-point-right-${index_right}`)
          .attr("x", d[1].x - 5)
          .attr("y", d[1].y - 5);

        svg
          .select(`.center-point-${index_right}`)
          .attr("x", (d[0].x + d[1].x) / 2 - 5)
          .attr("y", (d[0].y + d[1].y) / 2 - 5);
        // Update the coordinates of the line
        this.sharedState.lineDatasets.sets[index_right].data[0].x = x.invert(
          d[0].x
        );
        this.sharedState.lineDatasets.sets[index_right].data[0].y = y.invert(
          d[0].y
        );
        this.sharedState.lineDatasets.sets[index_right].data[1].x = x.invert(
          d[1].x
        );
        this.sharedState.lineDatasets.sets[index_right].data[1].y = y.invert(
          d[1].y
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
      .on("drag", (event, d) => {
        // Find index i of the line
        for (
          let i = this.sharedState.lineDatasets.sets.length - 1;
          i >= 0;
          i--
        ) {
          const dataset = this.sharedState.lineDatasets.sets[i];
          if (
            Math.abs(dataset.data[0].x - x.invert(d[0].x)) < 0.02 &&
            Math.abs(dataset.data[0].y - y.invert(d[0].y)) < 0.02 &&
            Math.abs(dataset.data[1].x - x.invert(d[1].x)) < 0.02 &&
            Math.abs(dataset.data[1].y - y.invert(d[1].y)) < 0.02
          ) {
            index_left = i;
            break; // Optional: stop at the first match from the end
          }
        }

        if (index_left === -1) {
          return;
        }
        // Rotate the line around the center point
        const [newX, newY] = d3.pointer(event, svg.node());

        // Calculate the center of the line segment
        const centerX = (d[0].x + d[1].x) / 2;
        const centerY = (d[0].y + d[1].y) / 2;

        // Calculate the radius and angle
        const dx = newX - centerX;
        const dy = newY - centerY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Determine the current endpoint being dragged
        const endIndex = d.x === d[0].x && d.y === d[0].y ? 0 : 1;
        const otherIndex = 1 - endIndex;

        // Update the dragged endpoint position
        d[endIndex].x = centerX + radius * Math.cos(angle);
        d[endIndex].y = centerY + radius * Math.sin(angle);

        // Update the other endpoint to maintain the length of the line
        d[otherIndex].x = centerX - radius * Math.cos(angle);
        d[otherIndex].y = centerY - radius * Math.sin(angle);

        // Update the visual position of the line and points
        svg
          .select(`.line-${index_left}`)
          .attr("x1", d[1].x)
          .attr("y1", d[1].y)
          .attr("x2", d[0].x)
          .attr("y2", d[0].y);

        svg
          .select(`.end-point-left-${index_left}`)
          .attr("x", d[1].x - 5)
          .attr("y", d[1].y - 5);
        svg
          .select(`.end-point-right-${index_left}`)
          .attr("x", d[0].x - 5)
          .attr("y", d[0].y - 5);

        svg
          .select(`.center-point-${index_left}`)
          .attr("x", (d[0].x + d[1].x) / 2 - 5)
          .attr("y", (d[0].y + d[1].y) / 2 - 5);
        // Update the coordinates of the line
        this.sharedState.lineDatasets.sets[index_left].data[0].x = x.invert(
          d[1].x
        );
        this.sharedState.lineDatasets.sets[index_left].data[0].y = y.invert(
          d[1].y
        );
        this.sharedState.lineDatasets.sets[index_left].data[1].x = x.invert(
          d[0].x
        );
        this.sharedState.lineDatasets.sets[index_left].data[1].y = y.invert(
          d[0].y
        );
      })
      .on("end", () => {
        this.updateScatterplot();
      });
    // TODO: Delete the line by right click

    // Append the line and points
    this.sharedState.lineDatasets.sets.forEach((dataset, i) => {
      const x1 = x(dataset.data[0].x);
      const y1 = y(dataset.data[0].y);
      const x2 = x(dataset.data[1].x);
      const y2 = y(dataset.data[1].y);

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
        .attr("height", 10)
        .attr("fill", "white") // Fill color of the rectangle
        .attr("stroke", "black") // Stroke color of the rectangle
        .attr("stroke-width", 1) // Stroke width (optional, adjust as needed)
        .call(dragCenter);

      // Append the end point left
      const end_point_left = svg
        .append("rect")
        .datum([endPointsLeft, endPointsRight])
        .attr("class", `end-point-left-${i}`)
        .attr("x", endPointsLeft.x - 5) // Position of the rectangle
        .attr("y", endPointsLeft.y - 5)
        .attr("width", 10) // Width of the rectangle
        .attr("height", 10)
        .attr("fill", "white") // Fill color of the rectangle
        .attr("stroke", "black") // Stroke color of the rectangle
        .attr("stroke-width", 1); // Stroke width (optional, adjust as needed)

      // Append the end point right
      const end_point_right = svg
        .append("rect")
        .datum([endPointsLeft, endPointsRight])
        .attr("class", `end-point-right-${i}`)
        .attr("x", endPointsRight.x - 5)
        .attr("y", endPointsRight.y - 5)
        .attr("width", 10) // Width of the rectangle
        .attr("height", 10)
        .attr("fill", "white") // Fill color of the rectangle
        .attr("stroke", "black") // Stroke color of the rectangle
        .attr("stroke-width", 1);
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
        let regression;
        let regressionFormula = "";
        let regressionError = false;
        switch (this.sharedState.regressionType) {
          case "none":
            break;
          case "linear":
            regression = d3regression.regressionLinear();
            break;
          case "quadratic":
            regression = d3regression.regressionQuad();
            break;
          case "exponential":
            regression = d3regression.regressionExp();
            break;
          case "polynomial":
            regression = d3regression.regressionPoly().order(3);
            break;
          case "logarithmic":
            regression = d3regression.regressionLog();
            break;
          case "power":
            regression = d3regression.regressionPow();
            break;
          case "loess":
            regression = d3regression.regressionLoess().bandwidth(0.2);
            break;
        }
        regression = regression.x((d) => d.x).y((d) => d.y);
        const line = d3
          .line()
          .x((d) => x(d[0]))
          .y((d) => y(d[1]));
        svg
          .append("path")
          .datum(regression(dataset))
          .attr("fill", "none")
          .attr("stroke", dataset[0]?.color ?? "#69b3a2")
          .attr("stroke-width", 1.5)
          .attr("d", line);

        const regressionData = regression(dataset);
        if (regressionData) {
          switch (this.sharedState.regressionType) {
            case "none":
              break;
            case "linear":
              regressionError = dataset.length < 2;
              if (regressionError)
                regressionFormula =
                  "Cannot perform linear regression: Insufficient data points.";
              else
                regressionFormula = `y = ${regressionData.a.toFixed(
                  2
                )}x + ${regressionData.b.toFixed(2)}`;
              break;
            case "quadratic":
              regressionError = dataset.length < 3;
              if (regressionError)
                regressionFormula =
                  "Cannot perform quadratic regression: Insufficient data points.";
              else
                regressionFormula = `y = ${regressionData.a.toFixed(
                  2
                )}x^2 + ${regressionData.b.toFixed(
                  2
                )}x + ${regressionData.c.toFixed(2)}`;
              break;
            case "exponential":
              regressionError = dataset.length < 2;
              if (regressionError)
                regressionFormula =
                  "Cannot perform exponential regression: Insufficient data points.";
              else
                regressionFormula = `y = ${regressionData.a.toFixed(
                  2
                )}e^(${regressionData.b.toFixed(2)}x)`;
              break;
            case "polynomial":
              regressionError = dataset.length < 4;
              if (regressionError) {
                regressionFormula =
                  "Cannot perform polynomial regression: Insufficient data points.";
                break;
              }
              let coeffients = regressionData.coefficients;
              let formula = "y = ";
              for (let i = 0; i < coeffients.length; i++) {
                formula += coeffients[i].toFixed(2) + "x^" + (3 - i) + " + ";
              }
              regressionFormula = formula.slice(0, -2);
              break;
            case "logarithmic":
              regressionError = dataset.length < 2;
              if (regressionError)
                regressionFormula =
                  "Cannot perform logarithmic regression: Insufficient data points.";
              else
                regressionFormula = `y = ${regressionData.a.toFixed(
                  2
                )}ln(x) + ${regressionData.b.toFixed(2)}`;
              break;
            case "power":
              regressionError = dataset.length < 2;
              if (regressionError)
                regressionFormula =
                  "Cannot perform power regression: Insufficient data points.";
              else
                regressionFormula = `y = ${regressionData.a.toFixed(
                  2
                )}x^${regressionData.b.toFixed(2)}`;
              break;
            case "loess":
              regressionError = dataset.length < 2;
              if (regressionError)
                regressionFormula =
                  "Cannot perform loess regression: Insufficient data points.";
              else regressionFormula = `LOESS curve`;
              break;
          }
        }
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
        const n = dataset.length;
        const x_mean = d3.mean(dataset.map((d) => d.x));
        const y_mean = d3.mean(dataset.map((d) => d.y));
        const x_std = d3.deviation(dataset.map((d) => d.x));
        const y_std = d3.deviation(dataset.map((d) => d.y));
        const correlation =
          d3.sum(dataset.map((d) => (d.x - x_mean) * (d.y - y_mean))) /
          (n * x_std * y_std);
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
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .transition()
        .delay((_, i: number) => i * animationTime) // Important: d can be deleted
        .duration(300)
        .style("opacity", 0.5)
        .on("start", (event) => {
          setTimeout(() => {
            const coords = {
              x: 0,
              y: 0,
            };

            const circle = this.shadowRoot.querySelector(
              `svg circle[cx="${x(event.x)}"][cy="${y(event.y)}"]`
            ) as SVGCircleElement;

            if (circle) {
              // get the position of the circle on the page
              const rect = circle.getBoundingClientRect();
              coords.x = rect.x + rect.width / 2;
              coords.y = rect.y + rect.height / 2;
            }

            tooltip
              .style("opacity", 1)
              .html(xlabel + ": " + event.x + " " + ylabel + ": " + event.y)
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
      svg
        .append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));
      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(""));
      svg
        .selectAll(".grid line")
        .style("stroke", "#0a0909")
        .style("stroke-opacity", "0.15")
        .style("shape-rendering", "crispEdges");
      // add color light dark for grid
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
