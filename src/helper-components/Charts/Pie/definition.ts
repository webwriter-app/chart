import { chartOption } from "../../../functions";

export const OptionDefinition = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
};

export const Name = "Pie";
export const Description = `Simple Chart.js Pie Chart`;
export const TagName = "pie-chart";
export const Align: ChartAlignment = "center";
