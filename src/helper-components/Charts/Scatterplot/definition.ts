import { chartOption } from "../../../functions";
// TODO: true does not work
export const OptionDefinition = {
  //radius: chartOption("number", 0, "Radius", 0, 10),
  //filled: chartOption("boolean", true, "Filled"),
  listRegressionLine: chartOption("array", false, "Regression Model"),
  hoverTooltip: chartOption("boolean", false, "Hover Tooltip"),
  showGrid: chartOption("boolean", false, "Show Grid"),
  animation: chartOption("boolean", true, "Animation"),
  showCorrelation: chartOption("boolean", false, "Show Correlation"),
  showOutliers: chartOption("boolean", false, "Show Outliers"),
  showMeanLine: chartOption("boolean", true, "Show Mean"),

  /*xMin: chartOption("number", 0, "x Min", undefined, undefined),
    xMax: chartOption("number", 100, "x Max", undefined, undefined),
    yMin: chartOption("number", 0, "y Min", undefined, undefined),
      yMax: chartOption("number", 100, "y Max", undefined, undefined),
    scaleStepSize: chartOption("number", 5, "Step Size", 1, undefined),
    showGrid: chartOption("boolean", true, "Show Grid"),
    */
};
export const Definition = {
  animationTime: 2000,
};

export const Name = "Scatterplot";
export const TagName = "scatterplot-chart";
export const Align: ChartAlignment = "center";
export const Description = `d3.js Scatterplot Chart`;
