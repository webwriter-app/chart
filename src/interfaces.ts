import { RegressionType } from "./helper-components/Charts/imports";
import { ChartType as ChartTypeExternal } from "./helper-components/Charts/imports";

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
  index_in_scatterdatasets: number;
}

export interface LineDataSet {
  data: { x: number; y: number }[];
  color: string;
}
export interface LineDataSets {
  sets: LineDataSet[];
}
export interface ScatterDatasets {
  title: string;
  sets: ScatterDataset[];
  selected: {
    axis: {
      x: string;
      y: string;
    };
    dataset_indexes: number[];
  };
}
export interface ScatterDataset {
  color: string;
  name: string;
  ids: number[];
  labels: string[];
  typeOfEachData: ("string" | "number")[] | string[];
  dimensional_data: {
    data: (number | string)[];
    selected: boolean;
    color?: string;
  }[];
  filter: {
    label: string;
    type: "string" | "number" | "none" | string;
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

export interface ChartState {
  teacherOptions: {
    showOptions: boolean;
    showData: boolean;
    showLockedOptions: boolean;
    changeData: boolean;
    changeOptions: boolean;
    addRemoveData: boolean;
  };

  editable: boolean;
  lineDatasets: LineDataSets;
  scatterDatasets: ScatterDatasets;
  regressionType: RegressionType;
  chart: {
    title: string;
    selectedType: ChartTypeExternal;
    datasets: ChartDataSets;
    // options: {
    //   [key: string]: any;
    // };
    options: ChartOptions<Record<string, OptionDef<keyof TypeMapping>>>;
    optionsLocked: {
      [key: string]: boolean;
    };

    optionDefinition: {
      [key: string]: {
        type: string;
        default: any;
        name: string;
        min?: number;
        max?: number;
      };
    };
  };
}
