import * as d3 from "d3";
import * as d3regression from "d3-regression";
import {
  OneDimentionalPoint,
  PointOnlyNumbers,
  Point,
  OneDimentionalNumberPoint,
} from "./scatterplot";
import {
  LineDataSets,
  ScatterplotDataSets,
  ScatterDatasets,
  ScatterDataset,
} from "../../../chart-models";
import { generateColorWheel, randomColor } from "../../../utils";

interface Dimensions {
  height: number;
  width: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  min: { x: number; y: number };
  max: { x: number; y: number };
  ticks: { x: number; y: number };
}

interface Scales {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
}
interface Scales_singleDataset {
  x_num: d3.ScaleLinear<number, number>;
  y_num: d3.ScaleLinear<number, number>;
  x_band: d3.ScaleBand<string>;
  y_band: d3.ScaleBand<string>;
  x_none: d3.ScaleLinear<number, number>;
  y_none: d3.ScaleLinear<number, number>;
}

const AXIS_COLOR = "#cecece";
const GRID_COLOR = "#e5e5e5";
const AXIS_LABEL_COLOR = "#666666";

function hexToRgbaHalf(hex: string): string {
  const hex_clean = hex.replace("#", "");
  const r = parseInt(hex_clean.substring(0, 2), 16);
  const g = parseInt(hex_clean.substring(2, 4), 16);
  const b = parseInt(hex_clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
}

function styleAxisGroup(
  axisGroup: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  axisGroup.style("color", AXIS_COLOR);
  axisGroup.selectAll(".domain, .tick line").attr("stroke", AXIS_COLOR);
  axisGroup.selectAll(".tick text").attr("fill", AXIS_LABEL_COLOR);
}

function getScatterplotDataSets(scatterdatasets: ScatterDatasets) {
  const scatterplotdatasets: ScatterplotDataSets = {
    axisLabels: {
      x: scatterdatasets.selected.axis.x,
      y: scatterdatasets.selected.axis.y,
    },
    sets: scatterdatasets.selected.dataset_indexes.map((index) => {
      const set = scatterdatasets.sets[index];
      const index_x = set.labels.indexOf(scatterdatasets.selected.axis.x);
      const index_y = set.labels.indexOf(scatterdatasets.selected.axis.y);
      const index_in_scatterdatasets = index;

      const dimensional_data = set.dimensional_data.map((dimensional_data) => {
        return {
          x: dimensional_data.data[index_x] as number,
          y: dimensional_data.data[index_y] as number,
          selected: dimensional_data.selected,
        };
      });

      return {
        scatter_color: set.color,
        scatter_titel: set.name,
        ids: set.ids,
        dimensional_data: dimensional_data,
        index_in_scatterdatasets: index_in_scatterdatasets,
      };
    }),
  };
  return scatterplotdatasets;
}
function checkDatasetForScatterplot(
  datasets: PointOnlyNumbers[][],
  line_datasets: LineDataSets
) {
  let x_axis_data:
    | "only_positive"
    | "only_negative"
    | "both"
    | "no_data"
    | undefined = undefined;
  let y_axis_data:
    | "only_positive"
    | "only_negative"
    | "both"
    | "no_data"
    | undefined = undefined;
  if (datasets.length === 0) {
    x_axis_data = "no_data";
    y_axis_data = "no_data";
  }

  for (let i = 0; i < datasets.length; i++) {
    const dataset = datasets[i];
    for (let j = 0; j < dataset.length; j++) {
      const x = dataset[j].x;
      const y = dataset[j].y;

      // Check x-axis
      if (x < 0) {
        if (x_axis_data === undefined) {
          x_axis_data = "only_negative";
        } else if (x_axis_data === "only_positive") {
          x_axis_data = "both";
        }
      } else if (x > 0) {
        if (x_axis_data === undefined) {
          x_axis_data = "only_positive";
        } else if (x_axis_data === "only_negative") {
          x_axis_data = "both";
        }
      }

      // Check y-axis
      if (y < 0) {
        if (y_axis_data === undefined) {
          y_axis_data = "only_negative";
        } else if (y_axis_data === "only_positive") {
          y_axis_data = "both";
        }
      } else if (y > 0) {
        if (y_axis_data === undefined) {
          y_axis_data = "only_positive";
        } else if (y_axis_data === "only_negative") {
          y_axis_data = "both";
        }
      }
    }
  }

  // Check line datasets
  line_datasets.sets.forEach((line_dataset) => {
    line_dataset.data.forEach((d) => {
      const x = d.x;
      const y = d.y;

      // Check x-axis
      if (x < 0) {
        if (x_axis_data === undefined) {
          x_axis_data = "only_negative";
        } else if (x_axis_data === "only_positive") {
          x_axis_data = "both";
        }
      } else if (x > 0) {
        if (x_axis_data === undefined) {
          x_axis_data = "only_positive";
        } else if (x_axis_data === "only_negative") {
          x_axis_data = "both";
        }
      }

      // Check y-axis
      if (y < 0) {
        if (y_axis_data === undefined) {
          y_axis_data = "only_negative";
        } else if (y_axis_data === "only_positive") {
          y_axis_data = "both";
        }
      } else if (y > 0) {
        if (y_axis_data === undefined) {
          y_axis_data = "only_positive";
        } else if (y_axis_data === "only_negative") {
          y_axis_data = "both";
        }
      }
    });
  });
  return { x_axis_data, y_axis_data };
}

function calculateSVGDimensions(
  root: Element,
  data: PointOnlyNumbers[][],
  line_datasets: LineDataSets,
  datasets_count: number,
  lineDatasets_count: number
): Dimensions {
  let maxX = 0;
  let maxY = 0;
  let minX = 0;
  let minY = 0;
  let result = checkDatasetForScatterplot(data, line_datasets);
  if (datasets_count > 0) {
    data.forEach((dataset) => {
      maxX = Math.max(...dataset.map((d) => d.x), maxX);
      maxY = Math.max(...dataset.map((d) => d.y), maxY);
      minX = Math.min(...dataset.map((d) => d.x), minX);
      minY = Math.min(...dataset.map((d) => d.y), minY);
    });
  }

  if (lineDatasets_count > 0) {
    line_datasets.sets.forEach((line_dataset) => {
      maxX = Math.max(...line_dataset.data.map((d) => d.x), maxX);
      maxY = Math.max(...line_dataset.data.map((d) => d.y), maxY);
      minX = Math.min(...line_dataset.data.map((d) => d.x), minX);
      minY = Math.min(...line_dataset.data.map((d) => d.y), minY);
    });
  }
  if (maxX > 0) {
    const roundingFactorX = 10 ** Math.floor(Math.log10(maxX));
    maxX = Math.ceil(maxX / roundingFactorX) * roundingFactorX;
  }
  if (maxY > 0) {
    const roundingFactorY = 10 ** Math.floor(Math.log10(maxY));
    maxY = Math.ceil(maxY / roundingFactorY) * roundingFactorY;
  }
  // Round the min if the min is negative

  if (minX < 0) {
    const roundingFactorX = 10 ** Math.floor(Math.log10(Math.abs(minX)));
    minX = Math.ceil(Math.abs(minX) / roundingFactorX) * roundingFactorX * -1;
  }
  if (minY < 0) {
    const roundingFactorY = 10 ** Math.floor(Math.log10(Math.abs(minY)));
    minY = Math.ceil(Math.abs(minY) / roundingFactorY) * roundingFactorY * -1;
  }
  if (minX === 0 && maxX === 0) {
    maxX = 1;
  }
  if (minY === 0 && maxY === 0) {
    maxY = 1;
  }

  // set the dimensions and margins of the graph
  const margin = { top: 50, right: 55, bottom: 50, left: 70 };
  const rootRect = root.getBoundingClientRect();
  const fallbackOuterWidth = 575;
  const fallbackOuterHeight = 420;
  const outerWidth =
    rootRect.width > 0 ? rootRect.width : fallbackOuterWidth;
  const outerHeight =
    rootRect.height > 0 ? rootRect.height : fallbackOuterHeight;

  const width = Math.max(220, outerWidth - margin.left - margin.right);
  const height = Math.max(180, outerHeight - margin.top - margin.bottom);
  let tick_x = -1;
  let tick_y = -1;

  if (result.x_axis_data === "only_negative") {
    const scales_x = d3.scaleLinear().domain([minX, maxX]).range([0, width]);
    let tickValues: number[] = scales_x.ticks();
    if (minX < -1 * 10 ** 3 && minX > -1 * 10 ** 7) {
      tick_x = 5;
      tickValues = scales_x.ticks(tick_x);
    } else if (minX <= -1 * 10 ** 7 && minX > -1 * 10 ** 100) {
      tick_x = 6;
      tickValues = scales_x.ticks(tick_x);
    } else if (minX <= -1 * 10 ** 100) {
      tick_x = 5;
      tickValues = scales_x.ticks(tick_x);
    }
    // Find the biggest tick value that is not 0
    const maxTickValue = tickValues.filter((d) => d !== 0).pop();
    if (maxTickValue !== undefined && maxTickValue < 0) {
      maxX = maxTickValue * -1;
    }
  }
  if (result.x_axis_data === "only_positive") {
    if (maxX > 10 ** 3 && maxX < 10 ** 7) {
      tick_x = 5;
    } else if (maxX >= 10 ** 7 && maxX < 10 ** 100) {
      tick_x = 6;
    } else if (maxX >= 10 ** 100) {
      tick_x = 5;
    }
  }
  if (result.x_axis_data === "both") {
    if (maxX - minX > 10 ** 3 && maxX - minX < 10 ** 7) {
      tick_x = 5;
    } else if (maxX - minX >= 10 ** 7 && maxX - minX < 10 ** 100) {
      tick_x = 6;
    } else if (maxX - minX >= 10 ** 100) {
      tick_x = 5;
    }
  }

  if (result.y_axis_data === "only_negative") {
    const scales_y = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);
    let tickValues: number[] = scales_y.ticks();
    if (minY < -1 * 10 ** 3 && minY > -1 * 10 ** 5) {
      tick_y = 5;
      tickValues = scales_y.ticks(tick_y);
    } else if (minY <= -1 * 10 ** 5 && minY > -1 * 10 ** 100) {
      tick_y = 6;
      tickValues = scales_y.ticks(tick_y);
    } else if (minY <= -1 * 10 ** 100) {
      tick_y = 5;
      tickValues = scales_y.ticks(tick_y);
    }
    // Find the biggest tick value that is not 0
    const maxTickValue = tickValues.filter((d) => d !== 0).pop();
    if (maxTickValue !== undefined && maxTickValue < 0) {
      maxY = maxTickValue * -1;
    }
  }
  if (result.y_axis_data === "only_positive") {
    if (maxY > 10 ** 3 && maxY < 10 ** 5) {
      tick_y = 5;
    } else if (maxY >= 10 ** 5 && maxY < 10 ** 100) {
      tick_y = 6;
    } else if (maxY >= 10 ** 100) {
      tick_y = 5;
    }
  }
  if (result.y_axis_data === "both") {
    if (maxY - minY > 10 ** 3 && maxY - minY < 10 ** 5) {
      tick_y = 5;
    } else if (maxY - minY >= 10 ** 5 && maxY - minY < 10 ** 100) {
      tick_y = 6;
    } else if (maxY - minY >= 10 ** 100) {
      tick_y = 5;
    }
  }
  return {
    height,
    width,
    margin,
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    ticks: { x: tick_x, y: tick_y },
  };
}

function createSVG(
  parent: Element,
  width: number,
  height: number,
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
) {
  // append the svg object to the body of the page
  const svg = d3
    .select(parent)
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

  return svg;
}
// Custom tick format for x-axis when the max value > 10^7 or min value < -10^7
// Custom tick format for y-axis when the max value > 10^5 or min value < -10^5
function customTickFormatForAxis(d) {
  if (d !== 0) {
    const exponent = Math.floor(Math.log10(Math.abs(d)));
    const mantissa = (d / Math.pow(10, exponent)).toFixed(1); // 1 decimal places
    return `${mantissa}e${exponent}`;
  } else {
    return d;
  }
}

function drawAxis(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  height: number,
  width: number,
  margin: {
    bottom: number;
  },
  axisLabels: { x: string; y: string },
  scales: Scales,
  maxX: number,
  maxY: number,
  minX: number,
  minY: number,
  ticksX: number,
  ticksY: number,
  datasets_count: number,
  lineDatasets_count: number,
  x_axis_type: string,
  y_axis_type: string,
  title: string
) {
  const gx = svg
    .append("g")
    .attr("transform", "translate(0," + height + ")");
  const gy = svg.append("g");
  // count the points in datasets
  if (
    ((x_axis_type === "noSelectedDataset" &&
      y_axis_type === "noSelectedDataset") ||
      (x_axis_type === "noData" && y_axis_type === "noData") ||
      (x_axis_type === "noDataInSelectedDatasets" &&
        y_axis_type === "noDataInSelectedDatasets")) &&
    lineDatasets_count === 0
  ) {
    if (
      x_axis_type === "noSelectedDataset" &&
      y_axis_type === "noSelectedDataset"
    ) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Please select at least one dataset");
    } else if (x_axis_type === "noData" && y_axis_type === "noData") {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Please add dataset");
    } else {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Please add data to the selected dataset(s)");
    }
  } else if (
    (x_axis_type === "none" || y_axis_type === "none") &&
    lineDatasets_count === 0
  ) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Please select x and y axis");
  } else if (datasets_count === 0 && lineDatasets_count === 0) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Please add data to the selected dataset(s)");
  } else {
    // Get the ticks from the scale directly
    const tickValues_x =
      ticksX === -1 ? scales.x.ticks() : scales.x.ticks(ticksX);
    // Case only negative values or both
    if (minX < 0 && maxX >= 0) {
      // Ensure 0 is in the tick values

      // Ensure 0 is included in the tick values
      if (!tickValues_x.includes(0)) {
        tickValues_x.push(0);
      }

      // Sort the tick values to maintain the correct order
      tickValues_x.sort((a, b) => a - b);
      if (maxX === 0) {
        // Apply the axis with the custom tick values
        minX >= -1 * 10 ** 7
          ? gx.call(d3.axisBottom(scales.x).tickValues(tickValues_x))
          : gx.call(
              d3
                .axisBottom(scales.x)
                .tickFormat(customTickFormatForAxis)
                .tickValues(tickValues_x)
            ); // Use the custom tick format
      } else {
        // Apply the axis with the custom tick values
        maxX - minX < 1 * 10 ** 7
          ? gx.call(d3.axisBottom(scales.x).tickValues(tickValues_x))
          : gx.call(
              d3
                .axisBottom(scales.x)
                .tickFormat(customTickFormatForAxis)
                .tickValues(tickValues_x)
            ); // Use the custom tick format
      }
      svg
        .append("line")
        .attr("x1", scales.x(0))
        .attr("y1", scales.y(minY))
        .attr("x2", scales.x(0))
        .attr("y2", scales.y(maxY))
        .attr("class", "line-x")
        .style("stroke", AXIS_COLOR)
        .style("stroke-width", 0.7)
        .style("opacity", 1);
    } else if (minX === 0 && maxX > 0) {
      // only positive values
      maxX < 10 ** 7
        ? gx.call(d3.axisBottom(scales.x).tickValues(tickValues_x))
        : gx.call(
            d3
              .axisBottom(scales.x)
              .tickFormat(customTickFormatForAxis)
              .tickValues(tickValues_x)
          ); // Use the custom tick format
    } else if (minX === 0 && maxX === 0) {
      // only 0
      gx.call(d3.axisBottom(scales.x));
    }
    svg
      .append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("style", "text-align: center;")
      .attr("fill", AXIS_LABEL_COLOR)
      .text(axisLabels.x ? axisLabels.x : "X-axis");

    // Add Y axis

    // Get the ticks from the scale directly
    const tickValues_y =
      ticksY === -1 ? scales.y.ticks() : scales.y.ticks(ticksY);
    // Case only negative values or both
    if (minY < 0 && maxY >= 0) {
      // Ensure 0 is in the tick values

      // Ensure 0 is included in the tick values
      if (!tickValues_y.includes(0)) {
        tickValues_y.push(0);
      }

      // Sort the tick values to maintain the correct order
      tickValues_y.sort((a, b) => a - b);
      if (maxY === 0) {
        // Apply the axis with the custom tick values
        minY >= -1 * 10 ** 5
          ? gy.call(d3.axisLeft(scales.y).tickValues(tickValues_y))
          : gy.call(
              d3
                .axisLeft(scales.y)
                .tickFormat(customTickFormatForAxis)
                .tickValues(tickValues_y)
            ); // Use the custom tick format
      } else {
        // Apply the axis with the custom tick values
        maxY - minY < 1 * 10 ** 5
          ? gy.call(d3.axisLeft(scales.y).tickValues(tickValues_y))
          : gy.call(
              d3
                .axisLeft(scales.y)
                .tickFormat(customTickFormatForAxis)
                .tickValues(tickValues_y)
            ); // Use the custom tick format
      }
      svg
        .append("line")
        .attr("x1", scales.x(minX))
        .attr("y1", scales.y(0))
        .attr("x2", scales.x(maxX))
        .attr("y2", scales.y(0))
        .attr("class", "line-y")
        .style("stroke", AXIS_COLOR)
        .style("stroke-width", 0.7)
        .style("opacity", 1);
    } else if (minY === 0 && maxY > 0) {
      // only positive values
      maxY < 10 ** 5
        ? gy.call(d3.axisLeft(scales.y).tickValues(tickValues_y))
        : gy.call(
            d3
              .axisLeft(scales.y)
              .tickFormat(customTickFormatForAxis)
              .tickValues(tickValues_y)
          ); // Use the custom tick format
    } else if (minY === 0 && maxY === 0) {
      // only 0
      gy.call(d3.axisLeft(scales.y));
    }
    styleAxisGroup(gx);
    styleAxisGroup(gy);
    svg
      .append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", -((height + margin.bottom) / 2)) // to my x axis
      .attr("y", maxY - minY <= 1999 ? -50 : maxY - minY <= 9999 ? -52 : -57) // to my y axis
      .attr("transform", "rotate(-90)")
      .attr("fill", AXIS_LABEL_COLOR)
      .text(axisLabels.y ? axisLabels.y : "Y-axis");
  }
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("fill", AXIS_LABEL_COLOR)
    .text(title);
  return { gx, gy };
}

function createTooltip(parent: Element) {
  // Add tooltip for data points
  return d3
    .select(parent)
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "fixed")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");
}
function createNewTooltip(parent: Element) {
  // This tooltip is used for the dragging
  return d3
    .select(parent)
    .append("div")
    .style("opacity", 0)
    .attr("class", "new-tooltip")
    .style("position", "fixed")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");
}

// Custom tick format for x-axis when the max value > 10^7 or min value < -10^7
function customFormatForBigNumber(d, decimal: number) {
  if (d !== 0) {
    const exponent = Math.floor(Math.log10(Math.abs(d)));
    const mantissa = roundNumber(d / Math.pow(10, exponent), decimal); // 4 decimal places
    return `${mantissa}e${exponent}`;
  } else {
    return d;
  }
}

function drawScatterplot(
  root: Element,
  datasets: PointOnlyNumbers[][],
  axisLabels: { x: string; y: string },
  fullAxisLabels: { x: string; y: string },
  options: {
    hoverTooltip: boolean;
    showOutliers: boolean;
    hoverCursorChange: boolean;
    drawLine: boolean;
    isDragging: boolean;
  },
  line_datasets: LineDataSets,
  datasets_count: number,
  lineDatasets_count: number,
  x_axis_type: string,
  y_axis_type: string,
  title: string
) {
  const dimensions = calculateSVGDimensions(
    root,
    datasets,
    line_datasets,
    datasets_count,
    lineDatasets_count
  );
  const svg = createSVG(
    root,
    dimensions.width,
    dimensions.height,
    dimensions.margin
  );
  const scales = {
    x: d3
      .scaleLinear()
      .domain([dimensions.min.x, dimensions.max.x])
      .range([0, dimensions.width]),
    y: d3
      .scaleLinear()
      .domain([dimensions.min.y, dimensions.max.y])
      .range([dimensions.height, 0]),
  };
  drawAxis(
    svg,
    dimensions.height,
    dimensions.width,
    dimensions.margin,
    axisLabels,
    scales,
    dimensions.max.x,
    dimensions.max.y,
    dimensions.min.x,
    dimensions.min.y,
    dimensions.ticks.x,
    dimensions.ticks.y,
    datasets_count,
    lineDatasets_count,
    x_axis_type,
    y_axis_type,
    title
  );
  const tooltip = createTooltip(root);
  // For normal scatter plot
  const scatter = svg.append("g");

  // Draw points in the scatter plot
  if (
    datasets_count > 0 &&
    x_axis_type === "number" &&
    y_axis_type === "number"
  ) {
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      drawPoints(scatter, dataset, i, scales);
      // Hover points to make them bigger and show tooltip
      scatter
        .selectAll(`circle.dataset-${i}`)
        .on("mouseover", function (_e, d: PointOnlyNumbers) {
          if (options.hoverCursorChange) {
            d3.select(this).attr("r", 8);
            // Change the cursor to move
            d3.select(this).style("cursor", "move");
          }
          const dx: number =
            Math.abs(d.x) < 10 ** 7
              ? roundNumber(d.x, 4)
              : customFormatForBigNumber(d.x, 4);
          const dy: number =
            Math.abs(d.y) < 10 ** 5
              ? roundNumber(d.y, 4)
              : customFormatForBigNumber(d.y, 4);
          // Show tooltip
          if (
            options.hoverTooltip &&
            !options.isDragging &&
            !options.drawLine
          ) {
            tooltip
              .style("opacity", 1)
              .html(
                "ID: " +
                  d.id +
                  "<br/>" +
                  fullAxisLabels.x +
                  ": " +
                  dx +
                  " " +
                  fullAxisLabels.y +
                  ": " +
                  dy
              );
          }
        })
        .on("mousemove", (e) => {
          tooltip.style("left", e.x + 10 + "px").style("top", e.y + 10 + "px");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("r", 7);
          // Change the cursor back to normal
          d3.select(this).style("cursor", "default");
          // Hide tooltip
          if (
            options.hoverTooltip &&
            !options.isDragging &&
            !options.drawLine
          ) {
            tooltip.transition().duration(200).style("opacity", 0);
          }
        });

      // Show outliers for each dataset
      if (options.showOutliers) {
        const datasetLabel = dataset[0].scatter_titel;
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
          .data(outliers, (d: PointOnlyNumbers) => `${d.x}-${d.y}`) // Assuming x and y uniquely identify each circle
          .style("fill", hexToRgbaHalf("#f9080c"))
          .style("stroke", "#f9080c")
          .on("mouseover", (event, d) => {
            const dx: number =
              Math.abs(d.x) < 10 ** 7
                ? roundNumber(d.x, 4)
                : customFormatForBigNumber(d.x, 4);
            const dy: number =
              Math.abs(d.y) < 10 ** 5
                ? roundNumber(d.y, 4)
                : customFormatForBigNumber(d.y, 4);
            if (!options.isDragging && !options.drawLine) {
              tooltip
                .style("opacity", 1)
                .html(
                  `${
                    datasetLabel ? "Outlier of " + datasetLabel : "Outlier"
                  }<br>${fullAxisLabels.x}: ${dx} ${fullAxisLabels.y}: ${dy}`
                )
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
            }
          })
          .on("mouseleave", () => {
            if (!options.isDragging && !options.drawLine) {
              tooltip.transition().duration(200).style("opacity", 0);
            }
          });
      }
    }
  }
  return { svg, scales, scatter, dimensions, tooltip };
}
function findIndexForPoint(
  d: PointOnlyNumbers,
  scatterdatasets: ScatterDatasets,
  compareSelected: boolean
) {
  // Iterate over scatterdatasets.sets in reverse order
  for (let i = scatterdatasets.sets.length - 1; i >= 0; i--) {
    if (scatterdatasets.selected.dataset_indexes.includes(i)) {
      const set = scatterdatasets.sets[i];
      const index_x = set.labels.indexOf(scatterdatasets.selected.axis.x);
      const index_y = set.labels.indexOf(scatterdatasets.selected.axis.y);

      // Iterate over set.dimensional_data in reverse order
      for (let j = set.dimensional_data.length - 1; j >= 0; j--) {
        let dimensional_data = set.dimensional_data[j];
        if (
          dimensional_data.data[index_x] === d.x &&
          dimensional_data.data[index_y] === d.y &&
          (compareSelected ? dimensional_data.selected === d.selected : true)
        ) {
          return {
            index_in_set: i,
            index_in_dimensional_data: j,
            index_in_data_x: index_x,
            index_in_data_y: index_y,
          };
        }
      }
    }
  }
  return {
    index_in_set: -1,
    index_in_dimensional_data: -1,
    index_in_data_x: -1,
    index_in_data_y: -1,
  }; // Return -1 if no match is found
}

function drawPoints(
  parent: d3.Selection<SVGGElement, unknown, null, undefined>,
  dataset: PointOnlyNumbers[],
  index: number,
  scales: Scales
) {
  parent
    .selectAll(`circle.dataset-${index}`)
    .data(dataset)
    .enter()
    .append("circle")
    .attr("class", `dataset-${index}`)
    .attr("cx", (d) => scales.x(d.x))
    .attr("cy", (d) => scales.y(d.y))
    .attr("r", 7)
    .style("fill", (d) => hexToRgbaHalf(d.color ?? "#417ca1"))
    .style("stroke", (d) => d.color ?? "#417ca1")
    .style("stroke-width", 1.5)
    .classed("selected", (d) => d.selected);
}

// Function to check if a point is brushed
function isBrushed(
  brush_coords: [[number, number], [number, number]],
  cx: number,
  cy: number
) {
  const x0 = brush_coords[0][0],
    x1 = brush_coords[1][0],
    y0 = brush_coords[0][1],
    y1 = brush_coords[1][1];
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function addDrawLineListeners(
  svg: d3.Selection<SVGElement, unknown, null, undefined>,
  scales: Scales,
  onFinish: (line: [{ x: number; y: number }, { x: number; y: number }]) => void
) {
  let isDrawing = false;
  let line: d3.Selection<SVGGElement, unknown, null, undefined>;
  let x1: number, y1: number, x2: number, y2: number;

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
        const line = [
          { x: scales.x.invert(x1), y: scales.y.invert(y1) },
          { x: scales.x.invert(x2), y: scales.y.invert(y2) },
        ] as [{ x: number; y: number }, { x: number; y: number }];
        onFinish(line);
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

function addBrushingListeners(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scatter: d3.Selection<SVGGElement, unknown, null, undefined>,
  dimensions: Dimensions,
  scales: Scales,
  scatterdatasets: ScatterDatasets,
  onFinish: () => void,
  type: "select" | "deselect"
) {
  let brushingEnabled = true; // Flag to track if brushing is enabled

  // Initialize brush behavior
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [dimensions.width, dimensions.height],
    ])
    .on("start brush", updateChartForSelection)
    .on("end", (event) => {
      finalizeSelection(event, scatterdatasets);
      onFinish();
    });

  svg.call(brush);

  function updateChartForSelection(event) {
    if (!brushingEnabled) return; // Exit if brushing is disabled
    const extent = event.selection;
    scatter.selectAll("circle").each(function (d: PointOnlyNumbers) {
      // Reset to current selected state during brushing
      d3.select(this).classed("selected", d.selected);
      if (extent) {
        if (isBrushed(extent, scales.x(d.x), scales.y(d.y))) {
          // Temporarily add the selected class for brushed points
          d3.select(this).classed("selected", type === "select");
        }
      }
    });
  }

  function finalizeSelection(event, scatterdatasets: ScatterDatasets) {
    if (!brushingEnabled) return; // Exit if brushing is disabled
    const extent = event.selection;
    if (extent) {
      scatter.selectAll("circle").each(function (d: PointOnlyNumbers) {
        if (isBrushed(extent, scales.x(d.x), scales.y(d.y))) {
          d.selected = type === "select"; // Definitively select the point if it is brushed
        }
        // Update the class based on final selection
        d3.select(this).classed("selected", d.selected);
        const point: PointOnlyNumbers = {
          x: d.x,
          y: d.y,
        };
        // Update the scatterdatasets
        const index_set = findIndexForPoint(point, scatterdatasets, false);
        scatterdatasets.sets[index_set.index_in_set].dimensional_data[
          index_set.index_in_dimensional_data
        ].selected = d.selected;
      });
    }
    brushingEnabled = false; // Disable brushing after the first brush
    // delete the brush
    svg.call(brush.move, null); // Clear the brush selection
    svg.on(".brush", null); // Remove brush event listeners
    svg.selectAll(".overlay").remove(); // Remove any overlay elements created by brushing
  }
}

function findTheClosestPoint(
  datasets: PointOnlyNumbers[][],
  click_X: number,
  click_Y: number
) {
  let minDistance = Infinity;
  let closestPoint: PointOnlyNumbers = null;
  const flattenedDatasets = datasets.flat();
  for (let i = flattenedDatasets.length - 1; i >= 0; i--) {
    const point = flattenedDatasets[i];
    const diff_x = Math.abs(point.x - click_X);
    const diff_y = Math.abs(point.y - click_Y);
    const distance = diff_x + diff_y;
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }
  return { closestPoint, minDistance };
}
// Iterate through the scatterplot datasets and return the last match index
function findTheLastMatchIndexInSPDatasets(
  closestPoint: PointOnlyNumbers,
  datasets: ScatterplotDataSets
) {
  let datasetIndex = -1;
  for (let i = datasets.sets.length - 1; i >= 0; i--) {
    const dataset = datasets.sets[i];
    if (
      (closestPoint.scatter_titel !== ""
        ? dataset.scatter_titel === closestPoint.scatter_titel
        : true) &&
      (closestPoint.id ? dataset.ids.includes(closestPoint.id) : true) &&
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
  return datasetIndex;
}
// Iterate through the scatterplot dataset and return the last match index
function findTheLastMatchIndexInSPDataset(
  closestPoint: PointOnlyNumbers,
  dimensionalData: { x: number; y: number; selected: boolean }[]
) {
  //Find the index of the point in the dataset
  let index = -1;
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
  return index;
}

function addDragingPointListeners(
  root: Element,
  svg: d3.Selection<SVGElement, unknown, null, undefined>,
  scatter: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  scatterdatasets: ScatterDatasets,
  datasets: PointOnlyNumbers[][],
  onFinish: () => void,
  axisLabels: { x: string; y: string }
) {
  // create tooltip that separates from the tooltip of the chart
  let index_set = {
    index_in_set: -1,
    index_in_dimensional_data: -1,
    index_in_data_x: -1,
    index_in_data_y: -1,
  };
  const new_tooltip = createNewTooltip(root);
  const drag = d3
    .drag()
    .on("start", (event, d: PointOnlyNumbers) => {
      d3.select(event.sourceEvent.target).classed("selected", true);
      index_set = findIndexForPoint(d, scatterdatasets, true);
      // Delete the tooltip
      d3.select(root).selectAll(".tooltip").remove();
    })
    .on("drag", (event, d: PointOnlyNumbers) => {
      // Get new coordinates relative to the SVG container
      const [newX, newY] = d3.pointer(event, svg.node());
      d.x = scales.x.invert(newX);
      d.y = scales.y.invert(newY);
      // Update the visual position of the circle (this is true)
      scatter.selectAll("circle").each(function (d: PointOnlyNumbers) {
        d3.select(this).attr("cx", scales.x(d.x)).attr("cy", scales.y(d.y));
      });
      // show the tooltip with the new values
      const dx: number =
        Math.abs(d.x) < 10 ** 7
          ? roundNumber(d.x, 4)
          : customFormatForBigNumber(d.x, 4);
      const dy: number =
        Math.abs(d.y) < 10 ** 5
          ? roundNumber(d.y, 4)
          : customFormatForBigNumber(d.y, 4);
      new_tooltip
        .style("opacity", 1)
        .html(
          `ID: ${d.id}<br/>
          ${axisLabels.x}: ${dx} ${axisLabels.y}: ${dy}`
        )
        .style("left", `${event.sourceEvent.pageX + 10}px`)
        .style("top", `${event.sourceEvent.pageY + 10}px`);
    })
    .on("end", (event, d: PointOnlyNumbers) => {
      // Delete the new tooltip
      d3.select(root).selectAll(".new-tooltip").remove();
      const selected = d.selected;
      // Update the data point in the scatterdatasets
      scatterdatasets.sets[index_set.index_in_set].dimensional_data[
        index_set.index_in_dimensional_data
      ].data[index_set.index_in_data_x] = d.x;
      scatterdatasets.sets[index_set.index_in_set].dimensional_data[
        index_set.index_in_dimensional_data
      ].data[index_set.index_in_data_y] = d.y;
      // Update the visual position of the circle
      d3.select(event.sourceEvent.target).classed("selected", selected);
      // Re-render
      onFinish();
    });
  datasets.forEach((_, index) => {
    scatter.selectAll(`circle.dataset-${index}`).call(drag);
  });
}
function addGridListeners(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  dimensions: Dimensions
) {
  const grid_y = svg
    .insert("g", ":first-child")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(scales.y)
        .tickSize(-dimensions.width)
        .tickFormat(() => "")
    )
    .style("stroke", GRID_COLOR)
    .style("stroke-opacity", "1")
    .style("shape-rendering", "crispEdges");
  const grid_x = svg
    .insert("g", ":first-child")
    .attr("class", "grid")
    .attr("transform", "translate(0," + dimensions.height + ")")
    .call(
      d3
        .axisBottom(scales.x)
        .tickSize(-dimensions.height)
        .tickFormat(() => "")
    )
    .style("stroke", GRID_COLOR)
    .style("stroke-opacity", "1")
    .style("shape-rendering", "crispEdges");

  grid_x
    .selectAll(".tick line")
    .attr("stroke", GRID_COLOR)
    .attr("stroke-opacity", 1);
  grid_y
    .selectAll(".tick line")
    .attr("stroke", GRID_COLOR)
    .attr("stroke-opacity", 1);

  grid_x.selectAll(".domain").remove(); // Important, since the activities on point are not working
  grid_y.selectAll(".domain").remove();
}
// 10^7 for x-axis and 10^5 for y-axis
function roundNumber(num: number, decimal: number): number {
  // if the number with less than 4 decimal places, return the number
  const [_, decimalPart] = num.toString().split(".");

  // If there is no decimal part or it's length is less than or equal to 4, return the original number
  if (!decimalPart || decimalPart.length <= 2) {
    return num;
  }
  // else fix the number to .. decimal places
  return (num.toFixed(decimal) as unknown as number) > 0
    ? Math.abs(num.toFixed(decimal) as unknown as number)
    : -Math.abs(num.toFixed(decimal) as unknown as number);
}
//Must delete the exponential form scince the library is not working correctly
// Only linear regression and LOESS are supported, scince the runtime for other regression types is too long with many datapoints
function addRegressionLine(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  dataset: PointOnlyNumbers[],
  regressionType: string,
  color: string
): { regressionFormula: string } {
  let regression: d3regression.Regression | undefined;
  let regressionFormula = "";

  let requiredPoints = 2; // Default to 2 for most regression types

  switch (regressionType) {
    case "none":
      return { regressionFormula };
    case "linear":
      regression = d3regression.regressionLinear();
      break;
    case "quadratic":
      requiredPoints = 3;
      regression = d3regression.regressionQuad();
      break;
    /*case "polynomial":
      requiredPoints = 4;
      regression = d3regression.regressionPoly().order(3);
      break;
    case "logarithmic":
      regression = d3regression.regressionLog();
      break;
    case "power":
      regression = d3regression.regressionPow();
      break;*/
    case "loess":
      regression = d3regression.regressionLoess().bandwidth(0.2);
      break;
  }

  if (!regression || dataset.length < requiredPoints) {
    return { regressionFormula };
  } else {
    regression = regression.x((d) => d.x).y((d) => d.y);

    // Render the regression line
    const line = d3
      .line()
      .x((d) => scales.x(d[0]))
      .y((d) => scales.y(d[1]));

    const regressionData = regression(dataset);

    svg
      .append("path")
      .attr("class", "regression-line")
      .datum(regressionData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Generate the regression formula string
    switch (regressionType) {
      case "linear":
        regressionFormula = `y = ${
          Math.abs(regressionData.a) > 10 ** 7
            ? customFormatForBigNumber(regressionData.a, 4)
            : roundNumber(regressionData.a, 4)
        }x  ${
          roundNumber(regressionData.b, 4) > 0
            ? ` + ${
                Math.abs(regressionData.b) > 10 ** 7
                  ? customFormatForBigNumber(regressionData.b, 4)
                  : roundNumber(regressionData.b, 4)
              }`
            : ` - ${
                Math.abs(regressionData.b) > 10 ** 7
                  ? customFormatForBigNumber(Math.abs(regressionData.b), 4)
                  : roundNumber(Math.abs(regressionData.b), 4)
              }`
        }`;
        break;
      /*case "quadratic":
      regressionFormula = `y = ${roundNumber(regressionData.a, 4)}x^2 ${
        roundNumber(regressionData.b, 4) > 0
          ? ` + ${roundNumber(regressionData.b, 4)}x`
          : ` - ${Math.abs(roundNumber(regressionData.b, 4))}x`
      } ${
        roundNumber(regressionData.c, 4) > 0
          ? ` + ${roundNumber(regressionData.c, 4)}`
          : ` - ${Math.abs(roundNumber(regressionData.c, 4))}`
      }`;

      break;
    case "polynomial":
      regressionFormula = regressionData.coefficients
        .reverse()
        .map((coeff, i) => {
          const sign = coeff >= 0 ? "+" : "-";
          const formattedCoeff = Math.abs(roundNumber(coeff, 4)); // Use absolute value for the coefficient
          const exponent = 3 - i;
          if (i < 3) {
            // Construct the term with the correct sign
            return ` ${exponent === 3 ? "" : sign} ${
              exponent === 3 ? roundNumber(coeff, 4) : formattedCoeff
            }x^${exponent}`;
          } else {
            return `${sign} ${formattedCoeff}`;
          }
        })
        .join(" ");
      regressionFormula = `y = ${regressionFormula}`;

      break;
    case "logarithmic":
      if (
        roundNumber(regressionData.a, 4) &&
        roundNumber(regressionData.b, 4)
      ) {
        regressionFormula = `y = ${roundNumber(regressionData.a, 4)} ln(x) ${
          roundNumber(regressionData.b, 4) > 0
            ? ` + ${roundNumber(regressionData.b, 4)}`
            : ` - ${Math.abs(roundNumber(regressionData.b, 4))}`
        }`;
      } else {
        regressionFormula = `y = ? ln(x) + ?`;
      }

      break;
    case "power":
      if (regressionData.a && regressionData.b) {
        regressionFormula = `y = ${roundNumber(
          regressionData.a,
          4
        )} x^${roundNumber(regressionData.b, 4)}`;
      } else {
        regressionFormula = `y = ? x^?`;
      }
      break;*/
      case "loess":
        regressionFormula = `LOESS curve`;
        break;
    }
  }

  return { regressionFormula };
}

function calculateCorrelation(dataset: PointOnlyNumbers[]) {
  const n = dataset.length;
  const x_mean = d3.mean(dataset.map((d) => d.x));
  const y_mean = d3.mean(dataset.map((d) => d.y));
  const x_std = d3.deviation(dataset.map((d) => d.x));
  const y_std = d3.deviation(dataset.map((d) => d.y));
  const correlation =
    d3.sum(dataset.map((d) => (d.x - x_mean) * (d.y - y_mean))) /
    (n * x_std * y_std);
  return correlation;
}
// Update the visual position of the line and points
function updateLineAndPoints(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  d: PointOnlyNumbers,
  index: number,
  indexForEndPointsLeft: number,
  indexForEndPointsRight: number,
  inverse: boolean,
  lineDatasets: LineDataSets
) {
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
  if (!inverse) {
    svg
      .select(`.line-${index}`)
      .attr("x1", d[0].x)
      .attr("y1", d[0].y)
      .attr("x2", d[1].x)
      .attr("y2", d[1].y);
    lineDatasets.sets[index].data[0].x = scales.x.invert(d[0].x);
    lineDatasets.sets[index].data[0].y = scales.y.invert(d[0].y);
    lineDatasets.sets[index].data[1].x = scales.x.invert(d[1].x);
    lineDatasets.sets[index].data[1].y = scales.y.invert(d[1].y);
  } else {
    svg
      .select(`.line-${index}`)
      .attr("x1", d[1].x)
      .attr("y1", d[1].y)
      .attr("x2", d[0].x)
      .attr("y2", d[0].y);
    lineDatasets.sets[index].data[0].x = scales.x.invert(d[1].x);
    lineDatasets.sets[index].data[0].y = scales.y.invert(d[1].y);
    lineDatasets.sets[index].data[1].x = scales.x.invert(d[0].x);
    lineDatasets.sets[index].data[1].y = scales.y.invert(d[0].y);
  }
}
// Find index i of the line
function findIndexForLine(
  scales: Scales,
  d: PointOnlyNumbers,
  lineDatasets: LineDataSets,
  index: number
) {
  for (let i = lineDatasets.sets.length - 1; i >= 0; i--) {
    const dataset = lineDatasets.sets[i];
    if (
      Math.abs(dataset.data[0].x - scales.x.invert(d[0].x)) < 0.01 &&
      Math.abs(dataset.data[0].y - scales.y.invert(d[0].y)) < 0.01 &&
      Math.abs(dataset.data[1].x - scales.x.invert(d[1].x)) < 0.01 &&
      Math.abs(dataset.data[1].y - scales.y.invert(d[1].y)) < 0.01
    ) {
      index = i;
      break; // stop at the first match from the end
    }
  }
  return index;
}

function calculateForRotation(d: PointOnlyNumbers, newX: number, newY: number) {
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
  return d;
}
// Delete the line
function deleteLineListeners(
  event: MouseEvent,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  lineDatasetsWithCenterPoint: PointOnlyNumbers[][],
  scales: Scales,
  lineDatasets: LineDataSets
) {
  event.preventDefault();
  const [clickX, clickY] = d3.pointer(event, svg.node());
  const click_X = scales.x.invert(clickX);
  const click_Y = scales.y.invert(clickY);
  // Find the closest point to the recht clicked position
  const result = findTheClosestPoint(
    lineDatasetsWithCenterPoint,
    click_X,
    click_Y
  );
  if (result.minDistance && result.closestPoint) {
    // Find the index i of the line
    let index = -1;
    for (let i = lineDatasetsWithCenterPoint.length - 1; i >= 0; i--) {
      const dataset = lineDatasetsWithCenterPoint[i];
      if (
        (dataset[0].x === result.closestPoint.x &&
          dataset[0].y === result.closestPoint.y) ||
        (dataset[1].x === result.closestPoint.x &&
          dataset[1].y === result.closestPoint.y) ||
        (dataset[2].x === result.closestPoint.x &&
          dataset[2].y === result.closestPoint.y)
      ) {
        index = i;
        break; // stop at the first match from the END
      }
    }
    if (index !== -1) {
      lineDatasets.sets.splice(index, 1);
    }
  }
}
function deletePointListeners(
  event: MouseEvent,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  datasets: PointOnlyNumbers[][],
  scatterdatasets: ScatterDatasets,
  scales: Scales
) {
  event.preventDefault();
  const scatterplotdatasets = getScatterplotDataSets(scatterdatasets);
  const [clickX, clickY] = d3.pointer(event, svg.node());
  const click_X = scales.x.invert(clickX);
  const click_Y = scales.y.invert(clickY);
  // Find the closest point to the recht clicked position
  const result = findTheClosestPoint(datasets, click_X, click_Y);
  if (result.minDistance && result.closestPoint) {
    // Find the index of the scatterplot dataset
    let datasetIndex = findTheLastMatchIndexInSPDatasets(
      result.closestPoint,
      scatterplotdatasets
    );
    if (datasetIndex !== -1) {
      const dimensionalData =
        scatterplotdatasets.sets[datasetIndex].dimensional_data;
      //Find the index of the point in the dataset
      let index_in_dimensional_data = findTheLastMatchIndexInSPDataset(
        result.closestPoint,
        dimensionalData
      );
      if (index_in_dimensional_data !== -1) {
        // Remove the point from the original scatterdatasets
        scatterdatasets.sets.forEach((set, index) => {
          if (
            index ===
            scatterplotdatasets.sets[datasetIndex].index_in_scatterdatasets
          ) {
            const index_x = set.labels.indexOf(scatterdatasets.selected.axis.x);
            const index_y = set.labels.indexOf(scatterdatasets.selected.axis.y);
            set.dimensional_data = set.dimensional_data.filter(
              (dimensional_data) =>
                dimensional_data.data[index_x] !==
                  scatterplotdatasets.sets[datasetIndex].dimensional_data[
                    index_in_dimensional_data
                  ].x ||
                dimensional_data.data[index_y] !==
                  scatterplotdatasets.sets[datasetIndex].dimensional_data[
                    index_in_dimensional_data
                  ].y
            );
            set.ids = set.ids.filter(
              (id) =>
                id !==
                scatterplotdatasets.sets[datasetIndex].ids[
                  index_in_dimensional_data
                ]
            );
          }
        });
      }
    }
  }
}
function addPointListeners(
  event: MouseEvent,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  scatterdatasets: ScatterDatasets,
  selectedIndextoAddNode: number
) {
  //const scatterplotdatasets = getScatterplotDataSets(scatterdatasets);
  const [clickX, clickY] = d3.pointer(event, svg.node());
  const newX = scales.x.invert(clickX);
  const newY = scales.y.invert(clickY);

  // Add the new point to the dataset
  scatterdatasets.sets.forEach((set, index) => {
    if (index === selectedIndextoAddNode) {
      const index_x = set.labels.indexOf(scatterdatasets.selected.axis.x);
      const index_y = set.labels.indexOf(scatterdatasets.selected.axis.y);
      // Prepare the new data point for the original dataset
      const newPointData = set.typeOfEachData.map((label, index) => {
        if (index === index_x) {
          return newX;
        } else if (index === index_y) {
          return newY;
        } else if (label === "number") {
          return 0; // or some default value
        } else {
          return "new string"; // or some default value
        }
      });
      set.dimensional_data.push({
        data: newPointData,
        selected: false,
      });
      set.ids.push(set.ids.length + 1);
    }
  });
}
function selectPointByClickingListeners(
  event: MouseEvent,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  datasets: PointOnlyNumbers[][],
  scales: Scales,
  scatterDatasets: ScatterDatasets
) {
  const scatterplotdatasets = getScatterplotDataSets(scatterDatasets);
  const [clickX, clickY] = d3.pointer(event, svg.node());
  const click_X = scales.x.invert(clickX);
  const click_Y = scales.y.invert(clickY);
  // Find the closest point to the recht clicked position
  const result = findTheClosestPoint(datasets, click_X, click_Y);
  if (result.minDistance && result.closestPoint) {
    // Find the index of the scatterplot dataset
    let datasetIndex = findTheLastMatchIndexInSPDatasets(
      result.closestPoint,
      scatterplotdatasets
    );
    if (datasetIndex !== -1) {
      const dimensionalData =
        scatterplotdatasets.sets[datasetIndex].dimensional_data;
      //Find the index of the point in the dataset
      let index_in_dimensional_data = findTheLastMatchIndexInSPDataset(
        result.closestPoint,
        dimensionalData
      );
      if (index_in_dimensional_data !== -1) {
        scatterDatasets.sets.forEach((set, index) => {
          if (
            index ===
            scatterplotdatasets.sets[datasetIndex].index_in_scatterdatasets
          ) {
            const index_x = set.labels.indexOf(scatterDatasets.selected.axis.x);
            const index_y = set.labels.indexOf(scatterDatasets.selected.axis.y);
            set.dimensional_data.map((dimensional_data) =>
              dimensional_data.data[index_x] ===
                scatterplotdatasets.sets[datasetIndex].dimensional_data[
                  index_in_dimensional_data
                ].x &&
              dimensional_data.data[index_y] ===
                scatterplotdatasets.sets[datasetIndex].dimensional_data[
                  index_in_dimensional_data
                ].y
                ? (dimensional_data.selected = !dimensional_data.selected)
                : null
            );
          }
        });
      }
    }
  }
}
function updateColorForFilter(
  i: number,
  type: "number" | "string" | string,
  selectedDataset: ScatterDataset
) {
  const listofstringsforlabels: string[] = [];
  const labelsandcolors: {
    label: string;
    color: string;
  }[] = [];
  const rangesandcolors: {
    range: { min: number; max: number };
    color: string;
  }[] = [];
  // find the min and max of the data
  let min = Infinity;
  let max = -Infinity;
  let ranges: number[] = [];
  let parts = 5;

  // find the labels and colors for the data (5 colors) between min and max
  if (type === "number") {
    selectedDataset.dimensional_data.forEach((d) => {
      if (Math.floor(d.data[i] as number) < min) {
        min = Math.floor(d.data[i] as number);
      }
      if (Math.ceil(d.data[i] as number) > max) {
        max = Math.ceil(d.data[i] as number);
      }
    });
    const range_value = max - min;

    let step = Math.ceil(range_value / parts);
    for (let i = 0; i < parts + 1; i++) {
      ranges.push(min + i * step);
    }

    const colors = ["#cceeff", "#99ccff", "#6699ff", "#3366ff", "#0033cc"];

    for (let i = 0; i < ranges.length - 1; i++) {
      rangesandcolors.push({
        range: { min: ranges[i], max: ranges[i + 1] },
        color: colors[i],
      });
    }

    selectedDataset.filter.rangesandcolors = rangesandcolors;

    selectedDataset.dimensional_data.forEach((d) => {
      selectedDataset.filter.rangesandcolors.forEach((rangeandcolor, index) => {
        if (
          index === rangesandcolors.length - 1
            ? (d.data[i] as number) >= rangeandcolor.range.min &&
              (d.data[i] as number) <= rangeandcolor.range.max
            : (d.data[i] as number) >= rangeandcolor.range.min &&
              (d.data[i] as number) < rangeandcolor.range.max
        ) {
          d.color = rangeandcolor.color;
        }
      });
    });
  }

  if (type === "string") {
    selectedDataset.dimensional_data.forEach((d) => {
      if (!listofstringsforlabels.includes(d.data[i] as string)) {
        listofstringsforlabels.push(d.data[i] as string);
        labelsandcolors.push({
          label: d.data[i] as string,
          color: randomColor(),
        });
      }
    });
    const colorss = generateColorWheel(labelsandcolors.length);
    labelsandcolors.forEach((labelandcolor, index) => {
      labelandcolor.color = colorss[index];
    });

    selectedDataset.filter.labelsandcolors = labelsandcolors;
    selectedDataset.dimensional_data.forEach((d) => {
      selectedDataset.filter.labelsandcolors.forEach((labelandcolor) => {
        if (d.data[i] === labelandcolor.label) {
          d.color = labelandcolor.color;
        }
      });
    });
  }
}
/*  */
function checkDatasetForScatterplot_singleDataset(
  data_for_x_axis_copy: { x: number | string; y: number | string }[],
  data_for_y_axis_copy: { x: number | string; y: number | string }[],
  x_axis_type: string,
  y_axis_type: string
) {
  let x_axis_data:
    | "only_positive"
    | "only_negative"
    | "both"
    | "no_data"
    | undefined = undefined;
  let y_axis_data:
    | "only_positive"
    | "only_negative"
    | "both"
    | "no_data"
    | undefined = undefined;
  if (data_for_x_axis_copy.length === 0) {
    x_axis_data = "no_data";
  }
  if (data_for_y_axis_copy.length === 0) {
    y_axis_data = "no_data";
  }
  if (x_axis_type === "number") {
    data_for_x_axis_copy.forEach((dataset) => {
      if (Number(dataset.x) > 0) {
        if (x_axis_data === undefined) {
          x_axis_data = "only_positive";
        } else if (x_axis_data === "only_negative") {
          x_axis_data = "both";
        }
      }
      if (Number(dataset.x) < 0) {
        if (x_axis_data === undefined) {
          x_axis_data = "only_negative";
        } else if (x_axis_data === "only_positive") {
          x_axis_data = "both";
        }
      }
    });
  }
  if (y_axis_type === "number") {
    data_for_y_axis_copy.forEach((dataset) => {
      if (Number(dataset.y) > 0) {
        if (y_axis_data === undefined) {
          y_axis_data = "only_positive";
        } else if (y_axis_data === "only_negative") {
          y_axis_data = "both";
        }
      }
      if (Number(dataset.y) < 0) {
        if (y_axis_data === undefined) {
          y_axis_data = "only_negative";
        } else if (y_axis_data === "only_positive") {
          y_axis_data = "both";
        }
      }
    });
  }
  return { x_axis_data, y_axis_data };
}

//  get the max value of the dataset
function calculateSVGDimensions_singleDataset(
  root: Element,
  data_for_x_axis_copy: { x: number | string; y: number | string }[],
  data_for_y_axis_copy: { x: number | string; y: number | string }[],
  x_axis_type: string,
  y_axis_type: string
) {
  let maxX = 0;
  let maxY = 0;
  let minX = 0;
  let minY = 0;
  const result = checkDatasetForScatterplot_singleDataset(
    data_for_x_axis_copy,
    data_for_y_axis_copy,
    x_axis_type,
    y_axis_type
  );
  if (x_axis_type === "number") {
    data_for_x_axis_copy.forEach((dataset) => {
      maxX = Math.max(maxX, Number(dataset.x));
      minX = Math.min(minX, Number(dataset.x));
    });
  }

  if (y_axis_type === "number") {
    data_for_y_axis_copy.forEach((dataset) => {
      maxY = Math.max(maxY, Number(dataset.y));
      minY = Math.min(minY, Number(dataset.y));
    });
  }
  if (maxX > 0) {
    const roundingFactorX = 10 ** Math.floor(Math.log10(maxX));
    maxX = Math.ceil(maxX / roundingFactorX) * roundingFactorX;
  }
  if (maxY > 0) {
    const roundingFactorY = 10 ** Math.floor(Math.log10(maxY));
    maxY = Math.ceil(maxY / roundingFactorY) * roundingFactorY;
  }
  // Round the min if the min is negative
  if (minX < 0) {
    const roundingFactorX = 10 ** Math.floor(Math.log10(Math.abs(minX)));
    minX = Math.ceil(Math.abs(minX) / roundingFactorX) * roundingFactorX * -1;
  }
  if (minY < 0) {
    const roundingFactorY = 10 ** Math.floor(Math.log10(Math.abs(minY)));
    minY = Math.ceil(Math.abs(minY) / roundingFactorY) * roundingFactorY * -1;
  }
  if (minX === 0 && maxX === 0) {
    maxX = 1;
  }
  if (minY === 0 && maxY === 0) {
    maxY = 1;
  }
  // set the dimensions and margins of the graph
  const margin = { top: 50, right: 55, bottom: 50, left: 70 };
  const rootRect = root.getBoundingClientRect();
  const fallbackOuterWidth = 575;
  const fallbackOuterHeight = 420;
  const outerWidth =
    rootRect.width > 0 ? rootRect.width : fallbackOuterWidth;
  const outerHeight =
    rootRect.height > 0 ? rootRect.height : fallbackOuterHeight;

  const width = Math.max(220, outerWidth - margin.left - margin.right);
  const height = Math.max(180, outerHeight - margin.top - margin.bottom);
  let tick_x = -1;
  let tick_y = -1;
  if (result.x_axis_data === "only_negative") {
    const scales_x = d3.scaleLinear().domain([minX, maxX]).range([0, width]);
    let tickValues: number[] = scales_x.ticks();
    if (minX < -1 * 10 ** 3 && minX > -1 * 10 ** 7) {
      tick_x = 5;
      tickValues = scales_x.ticks(tick_x);
    } else if (minX <= -1 * 10 ** 7 && minX > -1 * 10 ** 100) {
      tick_x = 6;
      tickValues = scales_x.ticks(tick_x);
    } else if (minX <= -1 * 10 ** 100) {
      tick_x = 5;
      tickValues = scales_x.ticks(tick_x);
    }
    // Find the biggest tick value that is not 0
    const maxTickValue = tickValues.filter((d) => d !== 0).pop();
    if (maxTickValue !== undefined && maxTickValue < 0) {
      maxX = maxTickValue * -1;
    }
  }
  if (result.x_axis_data === "only_positive") {
    if (maxX > 10 ** 3 && maxX < 10 ** 7) {
      tick_x = 5;
    } else if (maxX >= 10 ** 7 && maxX < 10 ** 100) {
      tick_x = 6;
    } else if (maxX >= 10 ** 100) {
      tick_x = 5;
    }
  }
  if (result.x_axis_data === "both") {
    if (maxX - minX > 10 ** 3 && maxX - minX < 10 ** 7) {
      tick_x = 5;
    } else if (maxX - minX >= 10 ** 7 && maxX - minX < 10 ** 100) {
      tick_x = 6;
    } else if (maxX - minX >= 10 ** 100) {
      tick_x = 5;
    }
  }

  if (result.y_axis_data === "only_negative") {
    const scales_y = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);
    let tickValues: number[] = scales_y.ticks();
    if (minY < -1 * 10 ** 3 && minY > -1 * 10 ** 5) {
      tick_y = 5;
      tickValues = scales_y.ticks(tick_y);
    } else if (minY <= -1 * 10 ** 5 && minY > -1 * 10 ** 100) {
      tick_y = 6;
      tickValues = scales_y.ticks(tick_y);
    } else if (minY <= -1 * 10 ** 100) {
      tick_y = 5;
      tickValues = scales_y.ticks(tick_y);
    }
    // Find the biggest tick value that is not 0
    const maxTickValue = tickValues.filter((d) => d !== 0).pop();
    if (maxTickValue !== undefined && maxTickValue < 0) {
      maxY = maxTickValue * -1;
    }
  }
  if (result.y_axis_data === "only_positive") {
    if (maxY > 10 ** 3 && maxY < 10 ** 5) {
      tick_y = 5;
    } else if (maxY >= 10 ** 5 && maxY < 10 ** 100) {
      tick_y = 6;
    } else if (maxY >= 10 ** 100) {
      tick_y = 5;
    }
  }
  if (result.y_axis_data === "both") {
    if (maxY - minY > 10 ** 3 && maxY - minY < 10 ** 5) {
      tick_y = 5;
    } else if (maxY - minY >= 10 ** 5 && maxY - minY < 10 ** 100) {
      tick_y = 6;
    } else if (maxY - minY >= 10 ** 100) {
      tick_y = 5;
    }
  }

  return {
    height,
    width,
    margin,
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    ticks: { x: tick_x, y: tick_y },
  };
}
function createSVG_SingleDataset(
  parent: Element,
  width: number,
  height: number,
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
) {
  // append the svg object to the body of the page
  const svg = d3
    .select(parent)
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
  return svg;
}
function drawAxis_singleDataset(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  height: number,
  width: number,
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  },
  x_axis_type: string,
  y_axis_type: string,
  data_for_x_axis_copy: { x: number | string; y: number | string }[],
  data_for_y_axis_copy: { x: number | string; y: number | string }[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  axisLabels: { x: string; y: string },
  scales_x_num: d3.ScaleLinear<number, number>,
  scales_y_num: d3.ScaleLinear<number, number>,
  tick_x: number,
  tick_y: number,
  title: string
) {
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
      .attr("stroke", GRID_COLOR)
      .attr("stroke-opacity", 1);
    grid.selectAll(".domain").remove();
  };
  // Add X axis
  let x_bandwidth = 0;
  let y_bandwidth = 0;
  if (x_axis_type !== "none" && data_for_x_axis_copy.length > 0) {
    if (x_axis_type === "number") {
      const tickValues_x =
        tick_x === -1 ? scales_x_num.ticks() : scales_x_num.ticks(tick_x);
      const gx = svg
        .append("g")
        .attr("transform", "translate(0," + height + ")");
      // Case only negative values or both
      if (minX < 0 && maxX >= 0) {
        // Ensure 0 is in the tick values

        // Ensure 0 is included in the tick values
        if (!tickValues_x.includes(0)) {
          tickValues_x.push(0);
        }

        // Sort the tick values to maintain the correct order
        tickValues_x.sort((a, b) => a - b);
        if (maxX === 0) {
          // Apply the axis with the custom tick values
          minX >= -1 * 10 ** 7
            ? gx.call(d3.axisBottom(scales_x_num).tickValues(tickValues_x))
            : gx.call(
                d3
                  .axisBottom(scales_x_num)
                  .tickFormat(customTickFormatForAxis)
                  .tickValues(tickValues_x)
              ); // Use the custom tick format
        } else {
          // Apply the axis with the custom tick values
          maxX - minX < 1 * 10 ** 7
            ? gx.call(d3.axisBottom(scales_x_num).tickValues(tickValues_x))
            : gx.call(
                d3
                  .axisBottom(scales_x_num)
                  .tickFormat(customTickFormatForAxis)
                  .tickValues(tickValues_x)
              ); // Use the custom tick format
        }
      } else if (minX === 0 && maxX > 0) {
        // only positive values
        maxX < 10 ** 7
          ? gx.call(d3.axisBottom(scales_x_num).tickValues(tickValues_x))
          : gx.call(
              d3
                .axisBottom(scales_x_num)
                .tickFormat(customTickFormatForAxis)
                .tickValues(tickValues_x)
            ); // Use the custom tick format
      } else if (minX === 0 && maxX === 0) {
        // only 0
        gx.call(d3.axisBottom(scales_x_num));
      }
      styleAxisGroup(gx);
    } else {
      // x_axis_type === "string"
      let x = d3
        .scaleBand()
        .domain(data_for_x_axis_copy.map((d) => d.x as string))
        .range([0, width])
        .align(0)
        .paddingOuter(0)
        .paddingInner(0);
      let axis_x = svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
      x_bandwidth = x.bandwidth();
      if (y_axis_type !== "none") {
        if (x_axis_type === "string" && y_axis_type === "number") {
          axis_x
            .selectAll(".tick text")
            .attr("transform", `translate(${-x.bandwidth() / 2}, 0)`);
          svg.selectAll(".tick line").remove();
        }
      }
      // Add Gridlines
      addGrid(
        d3.axisBottom,
        x,
        height,
        `translate(0, ${height})`,
        `${-x.bandwidth() / 2}, 0`
      );
      styleAxisGroup(axis_x);
    }
    svg
      .append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("style", "text-align: center;")
      .attr("fill", AXIS_LABEL_COLOR)
      .text(axisLabels.x);
  }
  // Add Y axis

  if (y_axis_type !== "none" && data_for_y_axis_copy.length > 0) {
    if (y_axis_type === "number") {
      const tickValues_y =
        tick_y === -1 ? scales_y_num.ticks() : scales_y_num.ticks(tick_y);
      const gy = svg.append("g");
      // Case only negative values or both
      if (minY < 0 && maxY >= 0) {
        // Ensure 0 is in the tick values

        // Ensure 0 is included in the tick values
        if (!tickValues_y.includes(0)) {
          tickValues_y.push(0);
        }

        // Sort the tick values to maintain the correct order
        tickValues_y.sort((a, b) => a - b);
        if (maxY === 0) {
          // Apply the axis with the custom tick values
          minY >= -1 * 10 ** 5
            ? gy.call(d3.axisLeft(scales_y_num).tickValues(tickValues_y))
            : gy.call(
                d3
                  .axisLeft(scales_y_num)
                  .tickFormat(customTickFormatForAxis)
                  .tickValues(tickValues_y)
              ); // Use the custom tick format
        } else {
          // Apply the axis with the custom tick values
          maxY - minY < 1 * 10 ** 5
            ? gy.call(d3.axisLeft(scales_y_num).tickValues(tickValues_y))
            : gy.call(
                d3
                  .axisLeft(scales_y_num)
                  .tickFormat(customTickFormatForAxis)
                  .tickValues(tickValues_y)
              ); // Use the custom tick format
        }
      } else if (minY === 0 && maxY > 0) {
        // only positive values
        maxY < 10 ** 5
          ? gy.call(d3.axisLeft(scales_y_num).tickValues(tickValues_y))
          : gy.call(
              d3
                .axisLeft(scales_y_num)
                .tickFormat(customTickFormatForAxis)
                .tickValues(tickValues_y)
            ); // Use the custom tick format
      } else if (minY === 0 && maxY === 0) {
        // only 0
        gy.call(d3.axisLeft(scales_y_num));
      }
      styleAxisGroup(gy);
      svg
        .append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("x", -((height + margin.bottom) / 2)) // to my x axis
        .attr("y", maxY - minY <= 1999 ? -50 : maxY - minY <= 9999 ? -52 : -57) // to my y axis
        .attr("transform", "rotate(-90)")
        .attr("fill", AXIS_LABEL_COLOR)
        .text(axisLabels.y);
    } else {
      // y_axis_type === "string"
      let y = d3
        .scaleBand()
        .domain(data_for_y_axis_copy.map((d) => d.y as string))
        .range([height, 0])
        .padding(0)
        .paddingOuter(0);
      let axis_y = svg.append("g").call(d3.axisLeft(y));
      y_bandwidth = y.bandwidth();

      if (y_axis_type === "string" && x_axis_type === "number") {
        axis_y
          .selectAll(".tick text")
          .attr("transform", `translate( 0, ${y.bandwidth() / 2})`);
        svg.selectAll(".tick line").remove();
      }
      // Add Gridlines
      addGrid(d3.axisLeft, y, width, null, `0, ${y.bandwidth() / 2}`);
      styleAxisGroup(axis_y);
      svg
        .append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("x", -((height + margin.bottom) / 2)) // to my x axis
        .attr("y", -57) // to my y axis
        .attr("transform", "rotate(-90)")
        .attr("fill", AXIS_LABEL_COLOR)
        .text(axisLabels.y);
    }
  }
  if (x_axis_type === "none" && y_axis_type === "none") {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Please select x or y axis");
  }
  if (
    (x_axis_type !== "none" &&
      y_axis_type === "none" &&
      data_for_x_axis_copy.length === 0) ||
    (x_axis_type === "none" &&
      y_axis_type !== "none" &&
      data_for_y_axis_copy.length === 0)
  ) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Please add data to the selected dataset");
  }
  if (
    x_axis_type !== "none" &&
    y_axis_type !== "none" &&
    (data_for_x_axis_copy.length === 0 || data_for_y_axis_copy.length === 0)
  ) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Please add data to the selected dataset");
  }
  svg
    .selectAll("g:not(.grid) .domain, g:not(.grid) .tick line")
    .attr("stroke", AXIS_COLOR);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("fill", AXIS_LABEL_COLOR)
    .text(title);

  return { x_bandwidth, y_bandwidth };
}

function drawScatterplot_singleDataset(
  root: Element,
  data_for_x_axis_copy: { x: number | string; y: number | string }[],
  data_for_y_axis_copy: { x: number | string; y: number | string }[],
  x_axis_type: string,
  y_axis_type: string,
  axisLabels: { x: string; y: string },
  title: string
) {
  const dimensions = calculateSVGDimensions_singleDataset(
    root,
    data_for_x_axis_copy,
    data_for_y_axis_copy,
    x_axis_type,
    y_axis_type
  );
  const svg = createSVG_SingleDataset(
    root,
    dimensions.width,
    dimensions.height,
    dimensions.margin
  );

  const scales = {
    x_num: d3
      .scaleLinear()
      .domain([dimensions.min.x, dimensions.max.x])
      .range([0, dimensions.width]),
    y_num: d3
      .scaleLinear()
      .domain([dimensions.min.y, dimensions.max.y])
      .range([dimensions.height, 0]),
    x_band: d3
      .scaleBand()
      .domain(data_for_x_axis_copy.map((d) => d.x as string))
      .range([0, dimensions.width]),
    y_band: d3
      .scaleBand()
      .domain(data_for_y_axis_copy.map((d) => d.y as string))
      .range([dimensions.height, 0]),
    x_none: d3
      .scaleLinear()
      .domain([0, dimensions.width])
      .range([0, dimensions.width]),
    y_none: d3
      .scaleLinear()
      .domain([0, dimensions.height])
      .range([dimensions.height, 0]),
  };
  const bandwidth_result = drawAxis_singleDataset(
    svg,
    dimensions.height,
    dimensions.width,
    dimensions.margin,
    x_axis_type,
    y_axis_type,
    data_for_x_axis_copy,
    data_for_y_axis_copy,
    dimensions.min.x,
    dimensions.min.y,
    dimensions.max.x,
    dimensions.max.y,
    axisLabels,
    scales.x_num,
    scales.y_num,
    dimensions.ticks.x,
    dimensions.ticks.y,
    title
  );
  return { svg, scales, dimensions, bandwidth_result };
}
function drawScatterplot_singleDataset2(
  root: Element,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  x_axis_type: string,
  y_axis_type: string,
  datasets: Point[],
  singeledatasets: OneDimentionalPoint[],
  scales: Scales_singleDataset,
  dimensions: Dimensions,
  bandwidth_result: { x_bandwidth: number; y_bandwidth: number },
  options: {
    hoverCursorChange: boolean;
    hoverTooltip: boolean;
  },
  fullAxisLabels: { x: string; y: string }
) {
  const tooltip = createTooltip(root);
  const scatter = svg.append("g");

  if (datasets.length > 0) {
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
              ? scales.x_band(d.x as string) + 6 + d.offset
              : scales.x_band(d.x as string) + bandwidth_result.x_bandwidth / 2
          ) // 6 is the radius of the circle
          .attr(
            "cy",
            y_axis_type === "number"
              ? scales.y_num(d.y as number)
              : scales.y_band(d.y as string) -
                  6 -
                  d.offset +
                  bandwidth_result.y_bandwidth
          )
          .attr("r", 6)
          .style("fill", hexToRgbaHalf(d.color ?? "#417ca1"))
          .style("stroke", d.color ?? "#417ca1")
          .style("stroke-width", 0.5)
          .classed("selected", d.selected ?? false);

        scatter
          .selectAll(`circle.dataset-${i}`)
          .on("mouseover", function () {
            if (
              options.hoverCursorChange &&
              !(x_axis_type === "string" && y_axis_type === "string")
            ) {
              d3.select(this).attr("r", 7);
              // Change the cursor to move
              d3.select(this).style("cursor", "move");
            }
            let dx: number | string = d.x;
            let dy: number | string = d.y;
            if (x_axis_type === "number") {
              dx =
                Math.abs(d.x as unknown as number) < 10 ** 7
                  ? roundNumber(d.x as unknown as number, 4)
                  : customFormatForBigNumber(d.x as unknown as number, 4);
            }
            if (y_axis_type === "number") {
              dy =
                Math.abs(d.y as unknown as number) < 10 ** 5
                  ? roundNumber(d.y as unknown as number, 4)
                  : customFormatForBigNumber(d.y as unknown as number, 4);
            }

            // Show tooltip
            if (options.hoverTooltip) {
              tooltip
                .attr("class", "tooltip")
                .style("opacity", 1)
                .html(
                  "ID: " +
                    d.id +
                    "<br>" +
                    fullAxisLabels.x +
                    ": " +
                    dx +
                    " " +
                    fullAxisLabels.y +
                    ": " +
                    dy
                );
            }
          })
          .on("mousemove", (e) => {
            tooltip
              .style("left", e.x + 10 + "px")
              .style("top", e.y + 10 + "px");
          })
          .on("mouseleave", function () {
            if (
              options.hoverCursorChange &&
              !(x_axis_type === "string" && y_axis_type === "string")
            ) {
              d3.select(this).attr("r", 6);
              // Change the cursor back to normal
              d3.select(this).style("cursor", "default");
            }
            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
          });
      });
    }
  }
  if (singeledatasets.length > 0) {
    if (x_axis_type === "none" && y_axis_type === "number") {
      singeledatasets.forEach((d: OneDimentionalNumberPoint, i) => {
        scatter
          .append("circle")
          .attr("class", `single-y-${i}`)
          .attr("cx", 6 + d.offset)
          .attr("cy", scales.y_num(d.p as number))
          .attr("r", 6)
          .style("fill", hexToRgbaHalf(d.color ?? "#417ca1"))
          .style("stroke", d.color ?? "#417ca1")
          .style("stroke-width", 0.5)
          .classed("selected", d.selected ?? false);
        scatter
          .selectAll(`circle.single-y-${i}`)
          .on("mouseover", function () {
            if (options.hoverCursorChange) {
              d3.select(this).attr("r", 7);
              // Change the cursor to move
              d3.select(this).style("cursor", "move");
            }
            // Show tooltip
            if (options.hoverTooltip) {
              const dy =
                Math.abs(d.p as unknown as number) < 10 ** 5
                  ? roundNumber(d.p as unknown as number, 4)
                  : customFormatForBigNumber(d.p as unknown as number, 4);

              tooltip
                .style("opacity", 1)
                .html("ID: " + d.id + "<br>" + fullAxisLabels.y + ": " + dy);
            }
          })
          .on("mousemove", (e) => {
            tooltip
              .style("left", e.x + 10 + "px")
              .style("top", e.y + 10 + "px");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("r", 6);
            // Change the cursor back to normal
            d3.select(this).style("cursor", "default");
            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
          });
      });
    }
    if (x_axis_type === "none" && y_axis_type === "string") {
      singeledatasets.forEach((d: OneDimentionalPoint, i) => {
        scatter
          .append("circle")
          .attr("class", `single-string-y-${i}`)
          .attr("cx", 6 + d.offset)
          .attr(
            "cy",
            scales.y_band(d.p as string) + bandwidth_result.y_bandwidth / 2
          )
          .attr("r", 6)
          .style("fill", hexToRgbaHalf(d.color ?? "#417ca1"))
          .style("stroke", d.color ?? "#417ca1")
          .style("stroke-width", 0.5)
          .classed("selected", d.selected ?? false);
        scatter
          .selectAll(`circle.single-string-y-${i}`)
          .on("mouseover", function () {
            // Show tooltip
            if (options.hoverTooltip) {
              tooltip
                .style("opacity", 1)
                .html("ID: " + d.id + "<br>" + fullAxisLabels.y + ": " + d.p);
            }
          })
          .on("mousemove", (e) => {
            tooltip
              .style("left", e.x + 10 + "px")
              .style("top", e.y + 10 + "px");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("r", 6);
            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
          });
      });
    }

    if (x_axis_type === "number" && y_axis_type === "none") {
      singeledatasets.forEach((d: OneDimentionalNumberPoint, i) => {
        scatter
          .append("circle")
          .attr("class", `single-x-${i}`)
          .attr("cx", scales.x_num(d.p as number))
          .attr("cy", -6 + dimensions.height - d.offset)
          .attr("r", 6)
          .style("fill", hexToRgbaHalf(d.color ?? "#417ca1"))
          .style("stroke", d.color ?? "#417ca1")
          .style("stroke-width", 0.5)
          .classed("selected", d.selected ?? false);
        scatter
          .selectAll(`circle.single-x-${i}`)
          .on("mouseover", function () {
            if (options.hoverCursorChange) {
              d3.select(this).attr("r", 7);
              // Change the cursor to move
              d3.select(this).style("cursor", "move");
            }
            // Show tooltip
            if (options.hoverTooltip) {
              const dx =
                Math.abs(d.p as unknown as number) < 10 ** 7
                  ? roundNumber(d.p as unknown as number, 4)
                  : customFormatForBigNumber(d.p as unknown as number, 4);

              tooltip
                .style("opacity", 1)
                .html("ID: " + d.id + "<br>" + fullAxisLabels.x + ": " + dx);
            }
          })
          .on("mousemove", (e) => {
            tooltip
              .style("left", e.x + 10 + "px")
              .style("top", e.y + 10 + "px");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("r", 6);
            // Change the cursor back to normal
            d3.select(this).style("cursor", "default");
            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
          });
      });
    }
    if (x_axis_type === "string" && y_axis_type === "none") {
      singeledatasets.forEach((d: OneDimentionalPoint, i) => {
        scatter
          .append("circle")
          .attr("class", `single-string-x-${i}`)
          .attr(
            "cx",
            scales.x_band(d.p as string) + bandwidth_result.x_bandwidth / 2
          )
          .attr("cy", -6 + dimensions.height - d.offset)
          .attr("r", 6)
          .style("fill", hexToRgbaHalf(d.color ?? "#417ca1"))
          .style("stroke", d.color ?? "#417ca1")
          .style("stroke-width", 0.5)
          .classed("selected", d.selected ?? false);
        scatter
          .selectAll(`circle.single-string-x-${i}`)
          .on("mouseover", function () {
            // Show tooltip
            if (options.hoverTooltip) {
              tooltip
                .style("opacity", 1)
                .html("ID: " + d.id + "<br>" + fullAxisLabels.x + ": " + d.p);
            }
          })
          .on("mousemove", (e) => {
            tooltip
              .style("left", e.x + 10 + "px")
              .style("top", e.y + 10 + "px");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("r", 6);
            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
          });
      });
    }
  }
  return { scatter, tooltip };
}
// Achtung the dragging und brushing und select in the fall that labels wil be cutted
function clampLabel(label: string, maxLength = 6) {
  if (!label) return "";
  return label.length > maxLength
    ? label.slice(0, maxLength - 2) + "..."
    : label;
}
function clampLabelForXAxis(label: string, count_labels_in_x_axis: number) {
  let maxLength = 6;
  if (!label) return "";
  if (count_labels_in_x_axis > 0) {
    maxLength =
      count_labels_in_x_axis <= 10
        ? Math.floor(42 / count_labels_in_x_axis)
        : 4;
  }
  return label.length > maxLength
    ? label.slice(0, maxLength - 2) + "..."
    : label;
}

export {
  drawScatterplot,
  addDrawLineListeners,
  addBrushingListeners,
  findTheClosestPoint,
  addDragingPointListeners,
  addGridListeners,
  addRegressionLine,
  calculateCorrelation,
  findTheLastMatchIndexInSPDatasets,
  findTheLastMatchIndexInSPDataset,
  updateLineAndPoints,
  findIndexForLine,
  calculateForRotation,
  deleteLineListeners,
  deletePointListeners,
  addPointListeners,
  selectPointByClickingListeners,
  updateColorForFilter,
  drawScatterplot_singleDataset,
  drawScatterplot_singleDataset2,
  checkDatasetForScatterplot,
  customFormatForBigNumber,
  roundNumber,
  clampLabel,
  clampLabelForXAxis,
  createNewTooltip,
};
