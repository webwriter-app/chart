import Chart from "chart.js/auto";
import type { ChartEvent, LegendElement, LegendItem, Plugin, Point } from "chart.js";
import type { PlotDataset } from "../../model/scatter-datasets";
import { r3 } from "../../model/scatter-geometry";

export type PlotChart = Chart<"scatter" | "line", Point[], unknown>;

/** Creates the scatter chart with its linear axes, the hover emphasis of the HTML legend and the tooltip format. */
export function createScatterPlot(
  ctx: CanvasRenderingContext2D,
  opts: { datasets: PlotDataset[]; xTitle: string; yTitle: string; plugins: Plugin<"scatter" | "line">[] },
): PlotChart {
  // Saved colors/sizes for legend hover — restored on leave
  let legendSaved: Array<{ bc: PlotDataset["borderColor"]; bgc: PlotDataset["backgroundColor"]; pr: PlotDataset["pointRadius"] }> | null = null;
  const dimLegendColor = <C,>(c: C): C | string => {
    if (typeof c !== "string" || c.length < 4) return c;
    if (c.startsWith("rgba(")) return c.replace(/,\s*[\d.]+\)$/, ", 0.25)");
    if (c.startsWith("rgb(")) return c.replace("rgb(", "rgba(").replace(")", ", 0.25)");
    const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
    return hex.slice(0, 7) + "40";
  };

  return new Chart<"scatter" | "line", Point[], unknown>(ctx, {
    type: "scatter",
    data: { datasets: opts.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      // touchstart/touchmove enable native Chart.js tooltips on touch devices
      events: ["click", "mousemove", "mouseout", "touchstart", "touchmove"],
      plugins: {
        legend: {
          // Rendered as scrollable HTML below the canvas (html-legend.ts);
          // onHover/onLeave are invoked by the HTML legend's delegation
          display: false,
          onHover: (_e: ChartEvent, item: LegendItem, legend: LegendElement<"scatter" | "line">) => {
            const chart = legend.chart;
            if (!legendSaved) {
              legendSaved = chart.data.datasets.map((ds) => ({
                bc: ds.borderColor,
                bgc: ds.backgroundColor,
                pr: ds.pointRadius,
              }));
            }
            chart.data.datasets.forEach((ds, i) => {
              if (i !== item.datasetIndex) {
                ds.borderColor = dimLegendColor(ds.borderColor);
                ds.backgroundColor = dimLegendColor(ds.backgroundColor);
              } else {
                // Boost hovered: brighter fill + larger point
                if (typeof ds.backgroundColor === "string" && ds.backgroundColor.length >= 7) {
                  ds.backgroundColor = ds.backgroundColor.slice(0, 7) + "CC";
                }
                if (ds.type !== "line") {
                  ds.pointRadius = (Number(ds.pointRadius) || 6) + 2;
                }
              }
            });
            chart.update("none");
          },
          onLeave: (_e: ChartEvent, _item: LegendItem, legend: LegendElement<"scatter" | "line">) => {
            const chart = legend.chart;
            if (legendSaved) {
              chart.data.datasets.forEach((ds, i) => {
                if (!legendSaved![i]) return;
                ds.borderColor = legendSaved![i].bc;
                ds.backgroundColor = legendSaved![i].bgc;
                ds.pointRadius = legendSaved![i].pr;
              });
              legendSaved = null;
            }
            chart.update("none");
          },
        },
        title: { display: false },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          callbacks: {
            label: (ctx) => {
              const pt = ctx.raw as { x: number; y: number };
              return `${ctx.dataset.label}: (${r3(pt.x)}, ${r3(pt.y)})`;
            },
          },
        },
      },
      scales: {
        x: { type: "linear", grid: { display: true }, title: { display: true, text: opts.xTitle } },
        y: { type: "linear", grid: { display: true }, title: { display: true, text: opts.yTitle } },
      },
    },
    plugins: opts.plugins,
  });
}
