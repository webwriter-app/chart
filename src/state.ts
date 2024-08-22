import { ChartType, RegressionType } from "./helper-components/Charts/imports";
import { ChartDataSets, LineDataSets, ScatterDatasets } from "./interfaces";
import { createSharedStateMixin } from "lit-sm";
interface sharedState {
  teacherOptions: {
    showOptions: boolean;
    showData: boolean;
    showLockedOptions: boolean;
    changeData: boolean;
    changeOptions: boolean;
    addRemoveData: boolean;
  };

  editable: boolean;
  printable: boolean;
  lineDatasets: LineDataSets;
  scatterDatasets: ScatterDatasets;
  regressionType: RegressionType;
  chart: {
    title: string;
    filled: boolean;
    selectedType: ChartType;
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

const initialState: sharedState = {
  teacherOptions: {
    showOptions: true,
    showData: true,
    showLockedOptions: true,
    changeData: true,
    changeOptions: true,
    addRemoveData: true,
  },
  lineDatasets: {
    sets: [],
  },
  scatterDatasets: {
    sets: [
      {
        color: "#9966FF",
        name: "My First Dataset",
        ids: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21,
        ],
        labels: ["a-label", "b-label", "Gender"],
        typeOfEachData: ["string", "number", "string"],
        dimensional_data: [
          { data: [60, 17000, "male"], selected: false },
          { data: [70, 18900, "male"], selected: false },
          { data: [56, 16000, "female"], selected: false },
          { data: [78, 17000, "female"], selected: false },
          { data: [57, 15500, "female"], selected: false },
          { data: [2, 2, "one"], selected: false },
          { data: [5, 4, "two"], selected: false },
          { data: [6, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [6, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },

          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
        ],
        filter: { label: "", type: "none", index_in_labels: -1 },
      },
      {
        color: "#ff00d0",
        name: "My Second Dataset",
        ids: [1, 2, 3],
        labels: ["a-label", "b-label", "c-label"],
        typeOfEachData: ["number", "number", "string"],
        dimensional_data: [
          { data: [6, 8, "six"], selected: false },
          { data: [5, 3, "five"], selected: false },
          { data: [7, 4, "seven"], selected: false },
          /*
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },
          { data: [3, 6, "three"], selected: false },*/
        ],
        filter: { label: "", type: "none", index_in_labels: -1 },
      },
      {
        color: "#1900ff",
        name: "My Third Dataset",
        ids: [1, 2, 3],
        labels: ["a-label", "b-label", "c-label"],
        typeOfEachData: ["number", "number", "string"],
        dimensional_data: [
          { data: [6, 8, "six"], selected: false },
          { data: [5, 3, "five"], selected: false },
          { data: [7, 4, "seven"], selected: false },
        ],
        filter: { label: "", type: "none", index_in_labels: -1 },
      },
    ],
    selected: {
      axis: {
        x: "a-label",
        y: "b-label",
      },
      dataset_indexes: [2],
    },
  },

  regressionType: "none",
  chart: {
    selectedType: "Scatterplot",
    title: "My fancy Chart",
    filled: false,
    datasets: {
      labels: ["Red", "Blue", "Free", "Green", "Purple", "Orange"],
      sets: [
        {
          name: "My First Dataset",
          color: "#ff00d0",
          colors: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "rgb(255, 159, 64)",
          ],
          data: [12, 19, 8, 5, 20, 13],
        },
      ],
    },
    options: {},
    optionsLocked: {},
    optionDefinition: {},
  },
  editable: true,
  printable: true,
};

export const SharedTestStateMixin = createSharedStateMixin(initialState);
