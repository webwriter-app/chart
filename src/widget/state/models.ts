// All chart type definitions. RegressionType is defined here directly
// to avoid a circular dependency with chart-registry.ts.
export type RegressionType = "none" | "linear" | "loess" | "quadratic";

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

export type InternalChartType =
  | "Pie"
  | "Doughnut"
  | "Bar"
  | "Line"
  | "Polar Area"
  | "Radar"
  | "Scatterplot";

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

export interface Visualization {
  id: string;
  name: string;
  selectedType: InternalChartType;
  visibleColumns?: string[];
}

export interface ScatterDatasets {
  title: string;
  sets: ScatterDataset[];
  selected: {
    axis: { x: string; y: string };
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
    labelsandcolors?: { label: string; color: string }[];
    rangesandcolors?: { range: { min: number; max: number }; color: string }[];
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
  visualizations: Visualization[];
  activeVisualizationId: string;
  chart: {
    title: string;
    selectedType: InternalChartType;
    datasets: ChartDataSets;
    options: ChartOptions<Record<string, OptionDef<keyof TypeMapping>>>;
    optionsLocked: { [key: string]: boolean };
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
