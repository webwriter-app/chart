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
export interface ScatterplotDataSets {
  axisLabels: { x: string; y: string };
  sets: ScatterplotDataSet[];
}
export interface ScatterplotDataSet {
  scatter_color: string;
  scatter_titel: string;
  ids: number[];
  dimensional_data?: { x: number; y: number; selected: boolean }[];
}
// TODO: Delete this interface
// For Advanced Scatterplot with multiple columns for y and x axis
export interface ScatterplotDataSetsAdvanced {
  labels: string[];
  color: string;
  sets: ScatterplotDataSetAdvanced[];
}
export interface ScatterplotDataSetAdvanced {
  id: number;
  data: (number | string)[];
}
export interface LineDataSet {
  data: { x: number; y: number }[];
}
export interface LineDataSets {
  sets: LineDataSet[];
}
export interface ScatterDatasets {
  sets: ScatterDataset[];
  selected: {
    axis: {
      x?: string;
      y?: string;
    };
    dataset_indexes: number[];
  };
}
export interface ScatterDataset {
  color: string;
  name: string;
  ids: number[];
  labels: string[];
  typeOfEachData: ("string" | "number")[];
  dimensional_data: {
    data: (number | string)[];
    selected: boolean;
    color?: string;
  }[];
  filter: {
    label: string;
    type: "string" | "number" | "none";
    index_in_labels: number;
    labelsandcolors?: {
      label: string;
      color: string;
    }[];
    rangesandcolors?: {
      range: { min: number; max: number };
      color: string;
    }[];
  };
}
