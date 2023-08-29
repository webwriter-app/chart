import { chartOption } from "../../../functions";

export const OptionDefinition = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
};

export const Name = "Polar Area";
export const Description = `Simple Chart.js Polar Area Chart`;
export const TagName = "polar-chart";
export const Align: ChartAlignment = "center";
