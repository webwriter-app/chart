import { chartOption } from "../../../utils";

export const OptionDefinition = {
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  pointRadius: chartOption("number", 1, "Point Radius", 0, 10),
  fill: chartOption("boolean", false, "Fill"),
  pointColors: chartOption("boolean", false, "Point Colors"),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

export const Name = "Radar";
export const Description = `Simple Chart.js Radar Chart`;
export const TagName = "radar-chart";
export const Align: ChartAlignment = "center";
