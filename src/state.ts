import { ChartType, RegressionType } from "./helper-components/Charts/imports";
import { ChartDataSets } from "./interfaces";
import { createSharedStateMixin } from "lit-sm";
import { ScatterplotDataSets } from "./interfaces";
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
  scatterplotdatasets: ScatterplotDataSets;
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
    showOptions: false,
    showData: false,
    showLockedOptions: false,
    changeData: false,
    changeOptions: false,
    addRemoveData: false,
  },
  scatterplotdatasets: {
    axisLabels: { x: "x", y: "y" },
    sets: [
      {
        scatter_color: "#9966FF",
        scatter_titel: "Data1",
        labels: ["a", "b", "c", "d"],
        dimensional_data: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 6 },
          { x: 4, y: 200 },
          /*
          { x: 4, y: 33 },
          { x: 5, y: 31.37 },
          { x: 6, y: 30.26 },
          { x: 7, y: 30.01 },
          { x: 8, y: 29.02 },
          { x: 9, y: 28.62 },
          { x: 10, y: 28.31 },
          { x: 20, y: 20.22 },
          { x: 30, y: 14.76 },
          { x: 40, y: 13.04 },
          { x: 50, y: 11.33 },
          { x: 60, y: 10.42 },
          { x: 70, y: 9.49 },
          { x: 80, y: 8.49 },
          { x: 90, y: 7.81 },
          { x: 100, y: 7.34 },
          { x: 200, y: 5.08 },*/
        ],
      },
      /*{
        scatter_color: "#ff00d0",
        scatter_titel: "Data2",
        labels: ["a", "b", "c"],
        dimensional_data: [
          { x: 6, y: 8 },
          { x: 5, y: 3 },
          { x: 7, y: 4 },
        ],
      },*/
    ],
  },
  regressionType: "none",
  chart: {
    selectedType: "Bar",
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
