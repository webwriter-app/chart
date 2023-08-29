import { chartOption } from "../../../functions";

export const OptionDefinition = {
  borderWidth: chartOption("number", 1, "Line Border Width", 0, 5),
  pointRadius: chartOption("number", 1, "Point Radius", 0, 10),
  pointColors: chartOption("boolean", false, "Point Colors"),
  dynamicSize: chartOption("boolean", true, "Dynamic Size"),
  scaleMin: chartOption("number", 0, "Scale Min", Infinity, Infinity),
  scaleMax: chartOption("number", 100, "Scale Max", Infinity, Infinity),
  scaleStepSize: chartOption("number", 5, "Step Size", Infinity, Infinity),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

export const Name = "Line";
export const Description = `Simple Chart.js Line Chart`;
export const TagName = "line-chart";
export const Align: ChartAlignment = "left";
