import { attribute } from "../../functions";

import { ChartDataSets } from "../../interfaces";

import { html, unsafeStatic } from "lit/static-html.js";

//@start-auto-generated
import * as Pie from "./Pie/definition";
import * as Doughnut from "./Doughnut/definition";
import * as Bar from "./Bar/definition";
import * as Line from "./Line/definition";
import * as PolarArea from "./PolarArea/definition";
import * as Radar from "./Radar/definition";
import * as Scatterplot from "./Scatterplot/definition";

import "./Bar/chart";
import "./Doughnut/chart";
import "./Pie/chart";
import "./Line/chart";
import "./PolarArea/chart";
import "./Radar/chart";
import "./Scatterplot/scatterplot";

const charts = [Pie, Doughnut, Bar, Line, PolarArea, Radar, Scatterplot];
//@end-auto-generated

export const availableCharts = charts.map((chart) => chart.Name);
export const availableRegressions = [
  "none",
  "linear",
  "quadratic",
  "exponential",
  "polynomial",
  "logarithmic",
  "power",
  "loess",
];
export type RegressionType = (typeof availableRegressions)[number];

export type ChartType = (typeof availableCharts)[number];

export function getOptionsDefinition(chartType: ChartType): {
  [key: string]: {
    type: string;
    default: any;
    name: string;
  };
} {
  const chart = charts.find((chart) => chartType === chart.Name);
  if (!chart) throw "Chart not found!";
  return chart.OptionDefinition;
}

export function getChart(
  chartType: ChartType,
  datasets: ChartDataSets,
  title: string,
  options: any,
  teacherOptions: TeacherOptions
) {
  const chart = charts.find((chart) => chartType === chart.Name);
  if (!chart) return html`<div>Chart not found!</div>`;
  //@ts-ignore
  const chartName = unsafeStatic(chart.TagName);

  return html`<div style="inset: 0px; padding: 10px; box-sizing: border-box; display: flex; width: 100%; justify-content: center; flex-direction: row; align-items: end;">

    <${chartName} 
    id="chart"
    hide_excat_values="${attribute(!teacherOptions.showData)}"
    datasets="${attribute(datasets)}"
    label=${title}
    style="display: flex; flex-grow: 1; max-height: 100%; max-width: 100%; justify-content: center; align-items: center;"
    options="${attribute(options)}

    ">
  </${chartName}>

  </div>`;
}
