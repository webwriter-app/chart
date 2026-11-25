import { str, type MsgFn } from "@lit/localize";
import type { ChartState } from "../model/models";

/** The state of a widget without a data block. The titles come from the catalog, so they follow the language. */
export function defaultChartState(msg: MsgFn): ChartState {
  return {
    teacherOptions: { showOptions: true, showData: true, showLockedOptions: true, changeData: true, changeOptions: true, addRemoveData: true },
    scatterDatasets: { title: msg("My scatter plot"), sets: [], selected: { axis: { x: "None", y: "None" }, dataset_indexes: [] } },
    regressionType: "none",
    scatterLines: [],
    visualizations: [{ id: "viz-1", name: msg(str`Chart ${1}`), selectedType: "Bar" }],
    activeVisualizationId: "viz-1",
    chart: { selectedType: "Bar", title: msg("My Chart"), datasets: { labels: [], sets: [] }, options: {}, optionsLocked: {}, optionDefinition: {} },
  };
}

/** The saved data block on top of the defaults. Missing keys of the teacher options and the chart fall back to the defaults. */
export function mergeChartState(defaults: ChartState, saved: Partial<ChartState>): ChartState {
  return {
    ...defaults,
    ...saved,
    teacherOptions: { ...defaults.teacherOptions, ...saved.teacherOptions },
    chart: { ...defaults.chart, ...saved.chart },
  };
}

/** What a state writes to the data block: the key set of the saved block, minus the option definitions the code derives. */
export function authoredState(value: ChartState, saved: Partial<ChartState>): Partial<ChartState> {
  const { chart: { optionDefinition, ...chart }, ...authored } = value;
  const next = { ...authored, chart } as Partial<ChartState>;
  const removed = Object.fromEntries(Object.keys(saved).filter((key) => !(key in next)).map((key) => [key, undefined]));
  return { ...removed, ...next };
}
