export type TypeMapping = {
  boolean: boolean;
  color: string;
  number: number;
  array: boolean;
};

export type OptionDef<T extends keyof TypeMapping = keyof TypeMapping> = {
  type: T;
  default: TypeMapping[T];
  name: string;
  min?: number;
  max?: number;
};

export type OptionDefinitions = Record<string, OptionDef>;

export type OptionValues = Record<string, TypeMapping[keyof TypeMapping]>;

export type TeacherOptions = {
  showOptions: boolean;
  showData: boolean;
  showLockedOptions: boolean;
  changeData: boolean;
  changeOptions: boolean;
  addRemoveData: boolean;
};

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
  options?: OptionValues;
}

export interface ScatterDatasets {
  title: string;
  sets: ScatterDataset[];
  selected: {
    axis: { x: string; y: string };
    dataset_indexes: number[];
  };
}

interface ScatterDataset {
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
  teacherOptions: TeacherOptions;
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
    options: OptionValues;
    optionsLocked: { [key: string]: boolean };
    optionDefinition: OptionDefinitions;
  };
}
