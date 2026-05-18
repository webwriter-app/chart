// Extracted from the legacy drawScatterplot.ts — pure color utility,
// no D3 dependency.
import { ScatterDataset } from "../../../state/models";
import { randomColor, generateColorWheel } from "../../../utils";

export function updateColorForFilter(
  i: number,
  type: "number" | "string" | string,
  selectedDataset: ScatterDataset
) {
  const listofstringsforlabels: string[] = [];
  const labelsandcolors: { label: string; color: string }[] = [];
  const rangesandcolors: { range: { min: number; max: number }; color: string }[] = [];

  let min = Infinity;
  let max = -Infinity;
  const parts = 5;

  if (type === "number") {
    selectedDataset.dimensional_data.forEach((d) => {
      const val = d.data[i] as number;
      if (Math.floor(val) < min) min = Math.floor(val);
      if (Math.ceil(val) > max) max = Math.ceil(val);
    });

    const range_value = max - min;
    const step = Math.ceil(range_value / parts);
    const ranges: number[] = [];
    for (let k = 0; k < parts + 1; k++) ranges.push(min + k * step);

    const colors = ["#cceeff", "#99ccff", "#6699ff", "#3366ff", "#0033cc"];
    for (let k = 0; k < ranges.length - 1; k++) {
      rangesandcolors.push({
        range: { min: ranges[k], max: ranges[k + 1] },
        color: colors[k],
      });
    }

    selectedDataset.filter.rangesandcolors = rangesandcolors;
    selectedDataset.dimensional_data.forEach((d) => {
      selectedDataset.filter.rangesandcolors.forEach((rc, index) => {
        const val = d.data[i] as number;
        const inRange =
          index === rangesandcolors.length - 1
            ? val >= rc.range.min && val <= rc.range.max
            : val >= rc.range.min && val < rc.range.max;
        if (inRange) d.color = rc.color;
      });
    });
  }

  if (type === "string") {
    selectedDataset.dimensional_data.forEach((d) => {
      const val = d.data[i] as string;
      if (!listofstringsforlabels.includes(val)) {
        listofstringsforlabels.push(val);
        labelsandcolors.push({ label: val, color: randomColor() });
      }
    });

    const colorss = generateColorWheel(labelsandcolors.length);
    labelsandcolors.forEach((lc, index) => { lc.color = colorss[index]; });

    selectedDataset.filter.labelsandcolors = labelsandcolors;
    selectedDataset.dimensional_data.forEach((d) => {
      selectedDataset.filter.labelsandcolors.forEach((lc) => {
        if (d.data[i] === lc.label) d.color = lc.color;
      });
    });
  }
}
