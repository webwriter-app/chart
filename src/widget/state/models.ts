// All chart type definitions. RegressionType is defined here directly
// to avoid a circular dependency with chart-registry.ts.
export type RegressionType = "none" | "Linear Regression" | "Polynomial Regression" | "Local Regression" | "Exponential Regression" | "Logarithmic Regression";

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
  | "Scatter plot";

export interface ChartDataSet {
  name: string;
  color: string;
  data: (number | string)[];
  colors: string[];
}

export interface ChartDataSets {
  labels: string[];
  sets: ChartDataSet[];
}

export interface Visualization {
  id: string;
  name: string;
  selectedType: InternalChartType;
  visibleColumns?: string[];
  xAxisIndex?: number;
  yColumns?: string[];
  xCategories?: string[];
  scaleLabel?: string;
  options?: Record<string, any>;
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

export interface DrawnLine {
  x1: number; y1: number; x2: number; y2: number; name?: string;
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
  scatterDatasets: ScatterDatasets;
  regressionType: RegressionType;
  scatterLines: DrawnLine[];
  hasPendingScatterChanges?: boolean;
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
