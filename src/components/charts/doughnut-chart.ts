import { CircularChart } from "./circular-chart";

declare global {
  interface HTMLElementTagNameMap { "doughnut-chart": DoughnutChart; }
}

export class DoughnutChart extends CircularChart {
  protected readonly chartJsType = "doughnut" as const;
}
