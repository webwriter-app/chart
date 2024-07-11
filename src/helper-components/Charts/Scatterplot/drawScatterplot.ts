import * as d3 from "d3";
import * as d3regression from "d3-regression";
import { Point } from "./scatterplot";
import { LineDataSets, ScatterplotDataSets } from "../../../interfaces";

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
}

interface Scales {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
}

function calculateSVGDimensions(data: Point[][]): Dimensions {
  // get the max value of the dataset
  let maxX = 0;
  let maxY = 0;
  let minX = 0;
  let minY = 0;
  data.forEach((dataset) => {
    maxX = Math.max(...dataset.map((d) => d.x), maxX);
    maxY = Math.max(...dataset.map((d) => d.y), maxY);
    minX = Math.min(...dataset.map((d) => d.x), minX);
    minY = Math.min(...dataset.map((d) => d.y), minY);
  });

  const roundingFactorX = 10 ** Math.floor(Math.log10(maxX));
  maxX = Math.ceil(maxX / roundingFactorX) * roundingFactorX;

  const roundingFactorY = 10 ** Math.floor(Math.log10(maxY));
  maxY = Math.ceil(maxY / roundingFactorY) * roundingFactorY;

  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 50, left: 70 },
    width = 550 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  return {
    height,
    width,
    margin,
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
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

  // TODO: check if this is used / needed
  // Add a transparent rectangle to capture click events
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

  return svg;
}

function drawAxis(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  height: number,
  width: number,
  margin: {
    bottom: number;
  },
  axisLabels: { x: string; y: string },
  scales: Scales
) {
  // Add X axis
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(scales.x));
  svg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("style", "text-align: center;")
    .text(axisLabels.x);

  // Add Y axis
  svg.append("g").call(d3.axisLeft(scales.y));
  svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -((height + margin.bottom) / 2)) // to my x axis
    .attr("y", -40) // to my y axis
    .attr("transform", "rotate(-90)")
    .text(axisLabels.y);
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

function drawScatterplot(
  root: Element,
  datasets: Point[][],
  axisLabels: { x: string; y: string },
  options: {
    hoverTooltip: boolean;
    showOutliers: boolean;
  }
) {
  const dimensions = calculateSVGDimensions(datasets);
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
    scales
  );
  const tooltip = createTooltip(root);

  // For normal scatter plot
  const scatter = svg.append("g");
  // Draw points in the scatter plot
  for (let i = 0; i < datasets.length; i++) {
    const dataset = datasets[i];
    drawPoints(scatter, dataset, i, axisLabels, tooltip, scales, options);

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
        .data(outliers, (d: Point) => `${d.x}-${d.y}`) // Assuming x and y uniquely identify each circle
        .style("fill", "#f9080c")
        .style("opacity", 1)
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `${datasetLabel ? "Outlier of " + datasetLabel : "Outlier"}<br>${
                axisLabels.x
              }: ${d.x} ${axisLabels.y}: ${d.y}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseleave", () => {
          tooltip.transition().duration(200).style("opacity", 0);
        });
    }
  }

  return { svg, scales, scatter, dimensions, tooltip };
}

function drawPoints(
  parent: d3.Selection<SVGGElement, unknown, null, undefined>,
  dataset: Point[],
  index: number,
  axisLabels: { x: string; y: string },
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>,
  scales: Scales,
  options: {
    hoverTooltip: boolean;
  }
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
    .style("fill", (d) => d.color ?? "#417ca1")
    .style("stroke", "white")
    .style("opacity", 0.5)
    .classed("selected", (d) => d.selected)
    .on("mouseover", (_e, d) => {
      if (!options.hoverTooltip) return;
      tooltip
        .style("opacity", 1)
        .html(
          d.label +
            "<br/>" +
            axisLabels.x +
            ": " +
            d.x +
            " " +
            axisLabels.y +
            ": " +
            d.y
        );
    })
    .on("mousemove", (e) => {
      tooltip.style("left", e.x + 10 + "px").style("top", e.y + 10 + "px");
    })
    .on("mouseleave", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });
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
      finalizeSelection(event);
      onFinish();
    });

  svg.call(brush);

  function updateChartForSelection(event) {
    if (!brushingEnabled) return; // Exit if brushing is disabled
    const extent = event.selection;
    scatter.selectAll("circle").each(function (d: Point) {
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

  function finalizeSelection(event) {
    if (!brushingEnabled) return; // Exit if brushing is disabled
    const extent = event.selection;
    if (extent) {
      scatter.selectAll("circle").each(function (d: Point) {
        if (isBrushed(extent, scales.x(d.x), scales.y(d.y))) {
          d.selected = type === "select"; // Definitively select the point if it is brushed
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

function findTheClosestPoint(
  datasets: Point[][],
  scales: Scales,
  clickX: number,
  clickY: number
) {
  let minDistance = Infinity;
  let closestPoint: Point = null;
  const flattenedDatasets = datasets.flat();
  for (let i = flattenedDatasets.length - 1; i >= 0; i--) {
    const point = flattenedDatasets[i];
    const distance = Math.sqrt(
      (scales.x(point.x) - clickX) ** 2 + (scales.y(point.y) - clickY) ** 2
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }
  return { closestPoint, minDistance };
}
// Iterate through the scatterplot datasets and return the last match index
function findTheLastMatchIndexInSPDatasets(
  closestPoint: Point,
  datasets: ScatterplotDataSets
) {
  let datasetIndex = -1;
  for (let i = datasets.sets.length - 1; i >= 0; i--) {
    const dataset = datasets.sets[i];
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
  return datasetIndex;
}
// Iterate through the scatterplot dataset and return the last match index
function findTheLastMatchIndexInSPDataset(
  closestPoint: Point,
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
  svg: d3.Selection<SVGElement, unknown, null, undefined>,
  scatter: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  onFinish: () => void
) {
  const drag = d3
    .drag()
    .on("start", (event) => {
      d3.select(event.sourceEvent.target).classed("selected", true);
    })
    .on("drag", (event, d: Point) => {
      console.log("dragging", d);
      // Get new coordinates relative to the SVG container
      const [newX, newY] = d3.pointer(event, svg.node());
      d.x = scales.x.invert(newX);
      d.y = scales.y.invert(newY);

      // Update the visual position of the circle
      d3.select(event.sourceEvent.target)
        .attr("cx", scales.x(d.x))
        .attr("cy", scales.y(d.y));
    })
    .on("end", (event, d: Point) => {
      const selected = d.selected;
      // Update the visual position of the circle
      d3.select(event.sourceEvent.target).classed("selected", selected);
      // Re-render
      onFinish();
    });
  scatter.selectAll("circle").call(drag);
}
function addGridListeners(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  dimensions: Dimensions
) {
  svg
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(scales.y)
        .tickSize(-dimensions.width)
        .tickFormat(() => "")
    );
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + dimensions.height + ")")
    .call(
      d3
        .axisBottom(scales.x)
        .tickSize(-dimensions.height)
        .tickFormat(() => "")
    );

  svg
    .selectAll(".grid line")
    .style("stroke", "#0a0909")
    .style("stroke-opacity", "0.15")
    .style("shape-rendering", "crispEdges");
}
//TODO: Fix any type
function addRegressionLine(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  dataset: Point[],
  regressionType: string
) {
  let regression;
  let regressionFormula = "";
  let regressionError = false;
  switch (regressionType) {
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
    .x((d) => scales.x(d[0]))
    .y((d) => scales.y(d[1]));
  svg
    .append("path")
    .datum(regression(dataset))
    .attr("fill", "none")
    .attr("stroke", dataset[0]?.color ?? "#69b3a2")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  const regressionData = regression(dataset);
  if (regressionData) {
    switch (regressionType) {
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
          )}x^2 + ${regressionData.b.toFixed(2)}x + ${regressionData.c.toFixed(
            2
          )}`;
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
  return { regressionFormula, regressionError };
}
function calculateCorrelation(dataset: Point[]) {
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
  d: Point,
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
  d: Point,
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
function calculateForRotation(d: Point, newX: number, newY: number) {
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
  lineDatasetsWithCenterPoint: Point[][],
  scales: Scales,
  lineDatasets: LineDataSets
) {
  event.preventDefault();
  const [clickX, clickY] = d3.pointer(event, svg.node());
  // Find the closest point to the recht clicked position
  const result = findTheClosestPoint(
    lineDatasetsWithCenterPoint,
    scales,
    clickX,
    clickY
  );
  const threshold = 7;
  if (result.minDistance < threshold && result.closestPoint) {
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
  datasets: Point[][],
  scales: Scales,
  scatterplotdatasets: ScatterplotDataSets
) {
  event.preventDefault();
  const [clickX, clickY] = d3.pointer(event, svg.node());
  // Find the closest point to the recht clicked position
  const result = findTheClosestPoint(datasets, scales, clickX, clickY);
  const threshold = 7;
  if (result.minDistance < threshold && result.closestPoint) {
    // Find the index of the scatterplot dataset
    let datasetIndex = findTheLastMatchIndexInSPDatasets(
      result.closestPoint,
      scatterplotdatasets
    );
    if (datasetIndex !== -1) {
      const dimensionalData =
        scatterplotdatasets.sets[datasetIndex].dimensional_data;
      //Find the index of the point in the dataset
      let index = findTheLastMatchIndexInSPDataset(
        result.closestPoint,
        dimensionalData
      );
      if (index !== -1) {
        // Remove the point from the dataset
        scatterplotdatasets.sets[datasetIndex].dimensional_data.splice(
          index,
          1
        );
        // Remove the label from the dataset
        scatterplotdatasets.sets[datasetIndex].labels.splice(index, 1);
      }
    }
  }
}
function addPointListeners(
  event: MouseEvent,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  scales: Scales,
  scatterplotdatasets: ScatterplotDataSets,
  selectedIndextoAddNote: number
) {
  const [clickX, clickY] = d3.pointer(event, svg.node());
  const newX = scales.x.invert(clickX);
  const newY = scales.y.invert(clickY);

  // Add the new point to the dataset
  scatterplotdatasets.sets[selectedIndextoAddNote].dimensional_data.push({
    x: newX,
    y: newY,
    selected: false,
  });
  scatterplotdatasets.sets[selectedIndextoAddNote].labels.push("new Point");
}
function selectPointByClickingListeners(
  event: MouseEvent,
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  datasets: Point[][],
  scales: Scales,
  scatterplotdatasets: ScatterplotDataSets
) {
  const [clickX, clickY] = d3.pointer(event, svg.node());
  // Find the closest point to the recht clicked position
  const result = findTheClosestPoint(datasets, scales, clickX, clickY);
  const threshold = 7;
  if (result.minDistance < threshold && result.closestPoint) {
    // Find the index of the scatterplot dataset
    let datasetIndex = findTheLastMatchIndexInSPDatasets(
      result.closestPoint,
      scatterplotdatasets
    );
    if (datasetIndex !== -1) {
      const dimensionalData =
        scatterplotdatasets.sets[datasetIndex].dimensional_data;
      //Find the index of the point in the dataset
      let index = findTheLastMatchIndexInSPDataset(
        result.closestPoint,
        dimensionalData
      );
      if (index !== -1) {
        // Check if the point is selected, if it is, remove it, if it is not, add it
        dimensionalData[index].selected
          ? (dimensionalData[index].selected = false)
          : (dimensionalData[index].selected = true);
      }
    }
  }
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
};
