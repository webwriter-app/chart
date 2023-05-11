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

export interface Dataset {
  label: string;
  labels: string[];
  data: number[];
  colors: string[];
}

export interface ChartOptions {
  borderRadius?: number;
  borderWidth?: number;
  horizontal?: boolean;
  filled?: boolean;
  dynamicSize?: boolean;
  scaleMin?: number;
  scaleMax?: number;
}
