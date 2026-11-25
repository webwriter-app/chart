import { CircularChart } from "./circular-chart";

declare global {
  interface HTMLElementTagNameMap { "pie-chart": PieChart; }
}

export class PieChart extends CircularChart {
  protected readonly chartJsType = "pie" as const;
}
