import type { ChartDataSet, ChartState, Visualization } from "./models";

export const ROW_LABELS = "Row Labels";
export const COL_LABELS = "Column Labels";

/** Dataset names are stored with underscores for spaces. */
export function plainName(name: string): string {
  return name.replace(/_/g, " ").trim();
}

/** What the axis selectors of a chart type offer, for the visualization and the data table. */
export type AxisControls = {
  showXYAxis: boolean;
  showCategoryAxis: boolean;
  showYAxisOnly: boolean;
  showRadarSpokes: boolean;
  rawLabels: string[];
  xAxisOptions: string[];
  currentXValue: string;
  availableYSeries: string[];
  selectedYSeries: string[];
  availableSpokes: string[];
  selectedSpokes: string[];
};

/** Null when the chart type has no axis selectors or there are no columns. */
export function axisControls(viz: Visualization | undefined, labels: string[], sets: ChartDataSet[]): AxisControls | null {
  const rawLabels = labels.map(plainName);
  const selectedType = viz?.selectedType ?? "Bar";
  const hasLabels = rawLabels.length >= 1;
  const showXYAxis = (selectedType === "Bar" || selectedType === "Line") && hasLabels;
  const showCategoryAxis = selectedType === "Polar Area" && hasLabels;
  const showYAxisOnly = (selectedType === "Pie" || selectedType === "Doughnut") && hasLabels;
  const showRadarSpokes = selectedType === "Radar" && hasLabels;
  if (!showXYAxis && !showCategoryAxis && !showYAxisOnly && !showRadarSpokes) return null;

  const currentXAxis = viz?.xAxisIndex ?? -1;
  const xAxisOptions = [ROW_LABELS, COL_LABELS, ...rawLabels];
  let currentXValue: string;
  if (currentXAxis === -2) currentXValue = COL_LABELS;
  else if (currentXAxis < 0) currentXValue = ROW_LABELS;
  else currentXValue = rawLabels[Math.min(currentXAxis, rawLabels.length - 1)] ?? ROW_LABELS;

  // Available Y series for bar/line/pie/doughnut
  let availableYSeries: string[] = [];
  if (showXYAxis || showYAxisOnly) {
    if (currentXAxis === -2) {
      availableYSeries = sets.map((s) => plainName(s.name));
    } else if (currentXAxis < 0) {
      availableYSeries = [...rawLabels];
    } else {
      const xIdx = Math.min(currentXAxis, rawLabels.length - 1);
      availableYSeries = rawLabels.filter((_, i) => i !== xIdx);
    }
  }

  const selectedYSeries = (viz?.yColumns ?? []).map(plainName).filter((c) => availableYSeries.includes(c));
  const availableSpokes = [...rawLabels];
  const selectedSpokes = (viz?.xCategories ?? []).map(plainName).filter((s) => availableSpokes.includes(s));

  return {
    showXYAxis, showCategoryAxis, showYAxisOnly, showRadarSpokes,
    rawLabels, xAxisOptions, currentXValue,
    availableYSeries, selectedYSeries, availableSpokes, selectedSpokes,
  };
}

/** The axis settings a chart element receives for the visualization. */
export function chartAxisProps(viz: Visualization | undefined, labels: string[], sets: ChartDataSet[]) {
  const xAxisIndex = viz?.xAxisIndex ?? -1;
  const xAxis = xAxisIndex < 0 ? xAxisIndex : Math.min(xAxisIndex, labels.length - 1);
  const rawLabels = labels.map(plainName);
  const availableSeries = xAxisIndex === -2 ? sets.map((s) => plainName(s.name)) : [...rawLabels];
  return {
    xAxis,
    yColumns: (viz?.yColumns ?? []).map(plainName).filter((c) => availableSeries.includes(c)),
    xCategories: (viz?.xCategories ?? []).map(plainName).filter((s) => rawLabels.includes(s)),
    scaleLabel: viz?.scaleLabel ?? "",
    key: `${viz?.id ?? "default"}-${viz?.selectedType ?? "Bar"}`,
  };
}

/** How many points the selected regression model needs and how many the data has, when there are too few. */
export function regressionShortfall(state: ChartState): { points: number; required: number } | null {
  const type = state.regressionType;
  if (type === "none") return null;
  let required = 2;
  if (type === "Polynomial Regression") {
    const degree = Number(state.chart.options?.polynomialDegree ?? 2);
    required = Math.max(2, Math.round(degree) + 1);
  } else if (type === "Local Regression") {
    required = 3;
  }
  const points = state.chart.datasets.sets?.length ?? 0;
  return points >= required ? null : { points, required };
}
