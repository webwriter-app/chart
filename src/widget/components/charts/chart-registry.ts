// Central registry for all chart types: definitions, tag names, option schemas,
// and the getChart() factory. Replaces the old imports.ts.
import { html, unsafeStatic } from "lit/static-html.js";
import { attribute } from "../../utils";
import { chartOption } from "../../utils";
import type { ChartDataSets, ChartState, InternalChartType } from "../../state/models";

// Side-effect imports: register custom elements
import "./bar-chart";
import "./circular-chart";
import "./line-chart";
import "./radar-chart";
import "./polar-area-chart";

// ─── Option definitions (co-located with registry) ───────────────────────────

const PIE_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
};

const DOUGHNUT_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
};

const BAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scalling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 5, "Step Size", 1, undefined),
};

const LINE_OPTIONS = {
  borderWidth: chartOption("number", 2, "Line Width", 0, 5),
  pointRadius: chartOption("number", 3, "Point Size", 0, 10),
  dynamicSize: chartOption("boolean", true, "Dynamic Scalling"),
  scaleMin: chartOption("number", 0, "Scale Min", Infinity, Infinity),
  scaleMax: chartOption("number", 100, "Scale Max", Infinity, Infinity),
  scaleStepSize: chartOption("number", 5, "Step Size", Infinity, Infinity),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

const POLAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scaling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 10, "Step Size", 1, undefined),
};

const RADAR_OPTIONS = {
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  pointRadius: chartOption("number", 3, "Point Radius", 0, 10),
  fill: chartOption("boolean", false, "Fill"),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

// Scatter plot tab options — not user-selectable as a visualization type,
// but needed by getOptionsDefinition("Scatter plot").
const SCATTERPLOT_OPTIONS = {
  listRegressionLine: chartOption("array", false, "Regression Model"),
  snapToGrid: chartOption("boolean", true, "Snap to Grid"),
  showGrid: chartOption("boolean", true, "Show Grid"),
  animation: chartOption("boolean", false, "Animation"),
  showCorrelation: chartOption("boolean", false, "Show Correlation"),
  showOutliers: chartOption("boolean", false, "Show Outliers"),
  showMean: chartOption("boolean", false, "Show Mean"),
};

// ─── Registry ─────────────────────────────────────────────────────────────────

interface ChartConfig {
  name: InternalChartType;
  tagName: string;
  optionDefinition: Record<string, OptionDef<any>>;
}

const USER_CHARTS: ChartConfig[] = [
  { name: "Pie",        tagName: "pie-chart",    optionDefinition: PIE_OPTIONS },
  { name: "Doughnut",  tagName: "doughnut-chart", optionDefinition: DOUGHNUT_OPTIONS },
  { name: "Bar",        tagName: "bar-chart",    optionDefinition: BAR_OPTIONS },
  { name: "Line",       tagName: "line-chart",   optionDefinition: LINE_OPTIONS },
  { name: "Polar Area", tagName: "polar-chart",  optionDefinition: POLAR_OPTIONS },
  { name: "Radar",      tagName: "radar-chart",  optionDefinition: RADAR_OPTIONS },
];

// Only the option definition is needed for Scatter plot here;
// the element itself is rendered directly in webwriter-chart.ts.
const SCATTERPLOT_CONFIG: ChartConfig = {
  name: "Scatter plot",
  tagName: "scatter-chart-js",
  optionDefinition: SCATTERPLOT_OPTIONS,
};

const ALL_CHARTS = [...USER_CHARTS, SCATTERPLOT_CONFIG];

// ─── Public API ───────────────────────────────────────────────────────────────

export const availableCharts = USER_CHARTS.map((c) => c.name);
export const availableRegressions = [
  "none",
  "Linear Regression",
  "Polynomial Regression",
  "Local Regression",
  "Exponential Regression",
  "Logarithmic Regression",
] as const;
export type RegressionType = (typeof availableRegressions)[number];
export type ChartType = (typeof availableCharts)[number];

export function getOptionsDefinition(chartType: InternalChartType | string) {
  const config = ALL_CHARTS.find((c) => c.name === chartType);
  if (!config) throw new Error(`Chart "${chartType}" not found`);
  return config.optionDefinition;
}

export function getChart(
  chartType: InternalChartType | string,
  datasets: ChartDataSets,
  title: string,
  options: any,
  teacherOptions: TeacherOptions,
  onChange: (e: CustomEvent) => void,
  sharedState: ChartState,
  xAxisIndex: number = 0,
  yColumns: string[] = [],
  xCategories: string[] = [],
  scaleLabel: string = ""
) {
  const config = USER_CHARTS.find((c) => c.name === chartType);
  if (!config) return html`<div>Chart not found!</div>`;
  // @ts-ignore
  const chartName = unsafeStatic(config.tagName);

  return html`
    <div style="position: absolute; inset: 0; padding: 10px; box-sizing: border-box; overflow: hidden;">
      <${chartName}
        id="chart"
        hide_excat_values="${attribute(!teacherOptions.showData)}"
        datasets="${attribute(datasets)}"
        label=${title}
        style="display: block; width: 100%; height: 100%;"
        options="${attribute(options)}"
        .xAxisIndex=${xAxisIndex}
        .yColumns=${yColumns}
        .xCategories=${xCategories}
        .scaleLabel=${scaleLabel}
        .sharedState=${sharedState}
        @wwci-state-change=${onChange}
      ></${chartName}>
    </div>
  `;
}
