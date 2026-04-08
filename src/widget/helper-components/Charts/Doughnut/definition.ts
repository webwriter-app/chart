import { chartOption } from "../../../utils";

export const OptionDefinition = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
};

export const Name = "Doughnut";
export const Description = `Simple Chart.js Doughnut Chart`;
export const TagName = "doughnut-chart";
export const Align: ChartAlignment = "center";
