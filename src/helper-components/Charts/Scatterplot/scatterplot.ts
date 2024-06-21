import { html, css } from "lit";
import * as d3 from "d3";
import * as d3regression from "d3-regression";
import { customElement, property } from "lit/decorators.js";
import { SharedTestStateMixin } from "../../../state";
import { OptionDefinition, Definition } from "./definition";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.js";
import { LitElementWw } from "@webwriter/lit";

@customElement("scatterplot-chart")
// TODO: fix type mismatch between lit-sm and @webwriter/lit
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
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .descriptions {
      width: 100%;
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .regression-formula, .correlations {
      display: flex;
      flex-direction: column;
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
  `;

  @property({ type: Object })
  options = OptionDefinition;
  @property({ type: Object })
  definition = Definition;

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
        <div class="descriptions">
          <div class="regression-formula"></div>
          <div class="correlations"></div>
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
    </div>`;
  }

  firstUpdated() {
    this.createScatterPlot();
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

  createScatterPlot() {
    const datasets: {
      x: number;
      y: number;
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

    // calculate the correlation coefficient for each dataset
    const correlations = datasets.map((dataset) => {
      const n = dataset.length;
      const x_mean = d3.mean(dataset.map((d) => d.x));
      const y_mean = d3.mean(dataset.map((d) => d.y));
      const x_std = d3.deviation(dataset.map((d) => d.x));
      const y_std = d3.deviation(dataset.map((d) => d.y));
      return (
        d3.sum(dataset.map((d) => (d.x - x_mean) * (d.y - y_mean))) /
        (n * x_std * y_std)
      );
    });

    const root = this.shadowRoot.querySelector(".scatterplot-wrapper");

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
    //TODO: Fix position of y label with long text eg: Y LabelX LabelX LabelX LabelX Label
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
    let scatter = svg
      .append("g")
      .attr("clip-path", "url(#clip)")
      .selectAll("circle")
      .data(datasets.flat())
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 7)
      .style("fill", (d) => d.color ?? "#417ca1")
      .style("stroke", "white")
      .style("opacity", this.options.filled ? 1 : 0.5);

    let outliers_scatter = svg.append("g");
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

    // Add the correlation coefficient
    if (this.options.showCorrelation) {
      const root = this.shadowRoot.querySelector(".correlations");
      [...root.children].forEach((child) => child.remove());
      correlations.forEach((correlation, index) => {
        const span = document.createElement("span");
        span.innerText = `Correlation: ${correlation.toFixed(2)}`;
        span.style.color = datasets[index][0]?.color ?? "#69b3a2";
        root.appendChild(span);
      });
    }

    // For scatter plot with regression
    const regressionFormulaRoot = this.shadowRoot.querySelector(
      ".regression-formula"
    );
    [...regressionFormulaRoot.children].forEach((child) => child.remove());
    if (this.sharedState.regressionType !== "none") {
      datasets.forEach((dataset) => {
        let regression;
        let regressionFormula = "";
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
              dataset.length < 2
                ? (regressionFormula =
                    "Cannot perform linear regression: Insufficient data points.")
                : (regressionFormula = `y = ${regressionData.a.toFixed(
                    2
                  )}x + ${regressionData.b.toFixed(2)}`);
              break;
            case "quadratic":
              dataset.length < 3
                ? (regressionFormula =
                    "Cannot perform quadratic regression: Insufficient data points.")
                : (regressionFormula = `y = ${regressionData.a.toFixed(
                    2
                  )}x^2 + ${regressionData.b.toFixed(
                    2
                  )}x + ${regressionData.c.toFixed(2)}`);
              break;
            case "exponential":
              dataset.length < 2
                ? (regressionFormula =
                    "Cannot perform exponential regression: Insufficient data points.")
                : (regressionFormula = `y = ${regressionData.a.toFixed(
                    2
                  )}e^(${regressionData.b.toFixed(2)}x)`);
              break;
            case "polynomial":
              if (dataset.length < 4) {
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
              dataset.length < 2
                ? (regressionFormula =
                    "Cannot perform logarithmic regression: Insufficient data points.")
                : (regressionFormula = `y = ${regressionData.a.toFixed(
                    2
                  )}ln(x) + ${regressionData.b.toFixed(2)}`);
              break;
            case "power":
              dataset.length < 2
                ? (regressionFormula =
                    "Cannot perform power regression: Insufficient data points.")
                : (regressionFormula = `y = ${regressionData.a.toFixed(
                    2
                  )}x^${regressionData.b.toFixed(2)}`);
              break;
            case "loess":
              dataset.length < 2
                ? (regressionFormula =
                    "Cannot perform loess regression: Insufficient data points.")
                : (regressionFormula = `LOESS curve`);
              break;
          }
        }
        //  show the formula of the regression line on the top left corner
        if (regressionFormula !== "") {
          const span = document.createElement("span");
          span.innerText = `${
            dataset[0]?.scatter_titel ?? "Regression"
          }: ${regressionFormula}`;
          span.style.color = dataset[0]?.color ?? "#69b3a2";
          regressionFormulaRoot.appendChild(span);
        }
      });
    }
    // Add outliers
    if (this.options.showOutliers) {
      datasets.map((dataset, i) => {
        const labelofDataset = String(dataset[i].scatter_titel);
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
        outliers_scatter
          .selectAll("circle")
          .data(outliers)
          .enter()
          .append("circle")
          .attr("cx", (d) => x(d.x))
          .attr("cy", (d) => y(d.y))
          .attr("r", 7)
          .style("fill", "#f9080c")
          .style("stroke", "white")
          .style("opacity", 1)
          .on("mouseover", function (event, d) {
            tooltip
              .style("opacity", 1)
              .html(
                (labelofDataset !== ""
                  ? "Outlier of " + labelofDataset
                  : "Outlier") +
                  "<br>" +
                  xlabel +
                  ": " +
                  d.x +
                  " " +
                  ylabel +
                  ": " +
                  d.y
              )
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY + 10 + "px");
          })
          .on("mouseleave", function () {
            tooltip.transition().duration(200).style("opacity", 0);
          });
      });
    }

    // Animate the scatter plot
    // For each point appears with a tooltip
    //TODO: See the papers about teaching scatterplot for the animation
    //TODO: Fix the position of the tooltip
    //TODO: Fix the regression line?
    if (this.options.animation) {
      scatter
        .style("opacity", 0)
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .transition()
        .delay((_, i: number) => i * animationTime) // Important: d can be deleted
        .duration(300)
        .style("opacity", this.options.filled ? 1 : 0.5)
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

    if (this.options.hoverTooltip) {
      // Three function that change the tooltip when user hover / move / leave a cell
      const mouseover = function (
        _e: MouseEvent,
        d: { x: number; y: number; label: string }
      ) {
        // TODO: get point data of point that we are currently hovering
        tooltip
          .style("opacity", 1)
          .html(
            d.label + "<br/>" + xlabel + ": " + d.x + " " + ylabel + ": " + d.y
          );
      };
      const mousemove = function (e: MouseEvent) {
        tooltip
          // It is important to put the + 10: other wise the tooltip is exactly where the point is an it creates a weird effect
          .style("left", e.x + 10 + "px")
          .style("top", e.y + 10 + "px");
      };
      const mouseleave = function () {
        tooltip.transition().duration(200).style("opacity", 0);
      };
      scatter
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
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
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scatterplot-chart": ScatterplotChart;
  }
}
