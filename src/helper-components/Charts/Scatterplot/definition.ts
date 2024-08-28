import { chartOption } from "../../../functions";
// TODO: true does not work
export const OptionDefinition = {
  //radius: chartOption("number", 0, "Radius", 0, 10),
  //filled: chartOption("boolean", true, "Filled"),
  listRegressionLine: chartOption("array", false, "Regression Model"),
  hoverTooltip: chartOption("boolean", true, "Hover Tooltip"),
  showGrid: chartOption("boolean", true, "Show Grid"),
  animation: chartOption("boolean", false, "Animation"),
  showCorrelation: chartOption("boolean", false, "Show Correlation"),
  showOutliers: chartOption("boolean", false, "Show Outliers"),
  showMeanLine: chartOption("boolean", true, "Show Mean"),
};
export const Definition = {
  animationTime: 2000,
};

export const Name = "Scatterplot";
export const TagName = "scatterplot-chart";
export const Align: ChartAlignment = "center";
export const Description = `d3.js Scatterplot Chart`;
