import { chartOption } from "../../../utils";

export const OptionDefinition = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  // individualColors: chartOption("boolean", false, "Individual Colors"),
  // horizontal: chartOption("boolean", false, "Horizontal"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scalling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 5, "Step Size", 1, undefined),
};

export const Name = "Bar";
export const Description = `Simple Chart.js Bar Chart`;
export const TagName = "bar-chart";
export const Align: ChartAlignment = "left";
