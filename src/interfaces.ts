export interface ChartData {
  [key: string]: {
    value: number;
    color?: string;
    label?: string;
  };
}

export interface CompleteChartData {
  [key: string]: {
    value: number;
    color: string;
    label: string;
  };
}

export type ChartType =
  | "bar"
  | "bubble"
  | "pie"
  | "line"
  | "doughnut"
  | "polarArea"
  | "radar"
  | "scatter";

export interface ChartDataSet {
  name: string;
  color: string;
  data: number[];
  colors: string[];
}

export interface ChartDataSets {
  labels: string[];
  sets: ChartDataSet[];
}
