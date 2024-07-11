import { html, css } from "lit";
import * as d3 from "d3";
import { customElement } from "lit/decorators.js";
import { SharedTestStateMixin } from "../../../state";
import { LitElementWw } from "@webwriter/lit";

@customElement("scatterplot-advanced-chart")
export class ScatterplotAdvancedChart extends SharedTestStateMixin(
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
    z-index: 10;
  }
  svg *, sl-icon {
    user-select: none;
  }
  `;
  render() {
    return html`
      <div class="scatterplot-root">
        <div class="scatterplot-wrapper">
          <div class="scatterplot-svg"></div>
        </div>
      </div>
    `;
  }

  firstUpdated() {
    this.createScatterPlot();
  }
  //TODO: Add case for just one string axis
  createScatterPlot() {
    const datasets: {
      x: number | string;
      y: number | string;
      selected?: boolean;
      offset?: number;
      color?: string;
      label?: string;
      scatter_titel?: string;
    }[] = [];
    const datasets_copy: {
      x: number | string;
      y: number | string;
    }[] = [];
    const singeledatasets: {
      p: number | string;
      selected?: boolean;
      offset?: number;
      color?: string;
      label?: string;
      scatter_titel?: string;
    }[] = [];
    const singeledatasets_copy: {
      p: number | string;
    }[] = [];

    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 50, left: 70 },
      width = 550 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
    // Get the 2 dimentiional data from the shared state

    const indexOfX =
      this.sharedState.scatterplotAdvanced.selectedX === "none"
        ? -1
        : this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.indexOf(
            this.sharedState.scatterplotAdvanced.selectedX
          );
    const indexOfY =
      this.sharedState.scatterplotAdvanced.selectedY === "none"
        ? -1
        : this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.indexOf(
            this.sharedState.scatterplotAdvanced.selectedY
          );

    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.forEach(
      (dataset) => {
        !(indexOfX === -1) && !(indexOfY === -1)
          ? datasets_copy.push({
              x: dataset.data[indexOfX],
              y: dataset.data[indexOfY],
            })
          : !(indexOfX === -1)
          ? singeledatasets_copy.push({ p: dataset.data[indexOfX] })
          : !(indexOfY === -1)
          ? singeledatasets_copy.push({ p: dataset.data[indexOfY] })
          : null;
      }
    );

    let xlabel = this.sharedState.scatterplotAdvanced.selectedX;
    let ylabel = this.sharedState.scatterplotAdvanced.selectedY;

    const root = this.shadowRoot.querySelector(".scatterplot-svg");

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
    !(xlabel === "none") && !(ylabel === "none")
      ? (data_for_x_axis_copy = datasets_copy)
      : (data_for_x_axis_copy = singeledatasets_copy.map((d) => ({
          x: d.p,
          y: "",
        })));
    //TODO: max for number values
    // Add X axis
    let x;
    if (!(xlabel === "none") && data_for_x_axis_copy.length > 0) {
      x =
        typeof data_for_x_axis_copy[0].x === "number"
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
      if (typeof data_for_x_axis_copy[0].x === "number") {
        svg
          .append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
      } else {
        let axis_x = svg
          .append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
        if (xlabel !== "none" && ylabel !== "none") {
          if (
            typeof data_for_x_axis_copy[0].x === "string" &&
            typeof data_for_x_axis_copy[0].y === "number"
          ) {
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
        .text(xlabel);

      // Add Gridlines
      if (!(typeof data_for_x_axis_copy[0].x === "number")) {
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
    !(xlabel === "none") && !(ylabel === "none")
      ? (data_for_y_axis_copy = datasets_copy)
      : (data_for_y_axis_copy = singeledatasets_copy.map((d) => ({
          x: "",
          y: d.p,
        })));

    // Add Y axis
    let y;
    if (!(ylabel === "none") && data_for_y_axis_copy.length > 0) {
      y =
        typeof data_for_y_axis_copy[0].y === "number"
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
      if (typeof data_for_y_axis_copy[0].y === "number") {
        svg.append("g").call(d3.axisLeft(y));
      } else {
        let axis_y = svg.append("g").call(d3.axisLeft(y));

        if (
          typeof data_for_y_axis_copy[0].y === "string" &&
          typeof data_for_y_axis_copy[0].x === "number"
        ) {
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
        .text(ylabel);

      // Add Gridlines
      if (!(typeof data_for_y_axis_copy[0].y === "number")) {
        addGrid(d3.axisLeft, y, width, null, `0, ${y.bandwidth() / 2}`);
      }
    }

    if (!(xlabel === "none") && !(ylabel === "none")) {
      if (
        typeof data_for_y_axis_copy[0].y === "string" &&
        typeof data_for_y_axis_copy[0].x === "string"
      ) {
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
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.forEach(
      (dataset) => {
        const color =
          this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced
            .color;
        let offset = 0;
        if (!(indexOfX === -1) && !(indexOfY === -1)) {
          const x = dataset.data[indexOfX];
          const y = dataset.data[indexOfY];
          // Check if x or y is a string and if an offset needs to be applied
          if (typeof x === "string" && typeof y === "number") {
            offset = calculateOffset(datasets, "x", x, y);
          } else if (typeof y === "string" && typeof x === "number") {
            offset = calculateOffset(datasets, "y", y, x);
          } else if (typeof y === "string" && typeof x === "string") {
            offset = calculateOffset(datasets, "y", y, x);
          }
          datasets.push({ x, y, offset, color });
        } else if (indexOfX === -1 && !(indexOfY === -1)) {
          const y = dataset.data[indexOfY];
          offset = calculateOffset(singeledatasets, "x_none", null, y);
          singeledatasets.push({ p: y, offset, color });
        } else if (!(indexOfX === -1) && indexOfY === -1) {
          const x = dataset.data[indexOfX];
          offset = calculateOffset(singeledatasets, "y_none", null, x);
          singeledatasets.push({ p: x, offset, color });
        }
      }
    );

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
      let distance = 10;
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
        // Diameter of each point (10)
        offset = count * distance;
      }

      return offset;
    }

    function calculateDistanceOfOffset(
      string_axis: "x" | "y" | "x_none" | "y_none",
      x_value: string | number,
      y_value: string | number
    ) {
      //Diameter of each point (10)
      let defaultDistance = 10; // Default distance between points (center to center)

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
          defaultDistance - (count * defaultDistance - bandwidth + 10) / count;
      }

      return distance;
    }
    const scatter = svg;
    // if one of the axis is string and there are multiple value of the other axis, those values are the same, then the circles will be on top of each other
    if (!(xlabel === "none") && !(ylabel === "none")) {
      datasets.forEach((d) => {
        scatter
          .append("circle")
          .attr(
            "cx",
            typeof d.x === "number"
              ? x(d.x)
              : typeof d.y === "number"
              ? x(d.x as string) + 5 + d.offset
              : x(d.x as string) + 5
          ) // 5 is the radius of the circle
          .attr(
            "cy",
            typeof d.y === "number"
              ? y(d.y)
              : y(d.y as string) - 5 - d.offset + y.bandwidth()
          )
          .attr("r", 5)
          .style("fill", d.color ?? "#417ca1")
          .style("opacity", 0.5);
      });
    }
    if (xlabel === "none" && !(ylabel === "none")) {
      singeledatasets.forEach((d) => {
        scatter
          .append("circle")
          .attr("cx", 5 + d.offset)
          .attr(
            "cy",
            typeof d.p === "number"
              ? y(d.p)
              : y(d.p as string) + y.bandwidth() / 2
          )
          .attr("r", 5)
          .style("fill", d.color ?? "#417ca1")
          .style("opacity", 0.5);
      });
    }
    if (!(xlabel === "none") && ylabel === "none") {
      singeledatasets.forEach((d) => {
        scatter
          .append("circle")
          .attr(
            "cx",
            typeof d.p === "number"
              ? x(d.p)
              : x(d.p as string) + x.bandwidth() / 2
          )
          .attr("cy", -5 + height - d.offset)
          .attr("r", 5)
          .style("fill", d.color ?? "#417ca1")
          .style("opacity", 0.5);
      });
    }
  }

  public static get scopedElements() {
    return {};
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scatterplot-advanced-chart": ScatterplotAdvancedChart;
  }
}
