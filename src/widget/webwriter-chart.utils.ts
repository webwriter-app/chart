import { ChartState, ScatterDatasets } from "./chart-models";

export function normalizeColumnsInput(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    return value ? [value] : [];
  }

  return [];
}

export function normalizeColumnIndexesInput(
  value: unknown,
  labels: string[]
): number[] {
  const rawValues = normalizeColumnsInput(value);
  const indexes = rawValues
    .map((raw) => {
      const numericIndex = Number(raw);
      if (
        Number.isInteger(numericIndex) &&
        numericIndex >= 0 &&
        numericIndex < labels.length
      ) {
        return numericIndex;
      }

      const normalizedRaw = raw.trim().toLowerCase();
      return labels.findIndex(
        (label) => label.trim().toLowerCase() === normalizedRaw
      );
    })
    .filter((index) => index >= 0);

  return Array.from(new Set(indexes));
}

function normalizeScatterCellValue(value: unknown): number | string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const numeric = Number(trimmed.replace(",", "."));
    return Number.isFinite(numeric) ? numeric : trimmed;
  }

  return "";
}

export function deriveFixedScatterDatasets(
  state: ChartState
): ScatterDatasets {
  const labels = [...(state.chart.datasets.labels ?? [])];
  const chartSets = state.chart.datasets.sets ?? [];

  const sets = chartSets.map((set, setIndex) => {
    const color = set.color ?? "#2196f3";
    const rowData = labels.map((_, colIndex) =>
      normalizeScatterCellValue((set.data as unknown[])[colIndex])
    );

    return {
      color,
      name: set.name || `Series ${setIndex + 1}`,
      ids: [0],
      labels: [...labels],
      typeOfEachData: rowData.map((item) =>
        typeof item === "number" && Number.isFinite(item) ? "number" : "string"
      ),
      dimensional_data: [
        {
          data: rowData,
          selected: false,
          color,
        },
      ],
      filter: {
        label: "",
        type: "none",
        index_in_labels: -1,
      },
    };
  });

  const previousSelected = state.scatterDatasets.selected ?? {
    axis: { x: "None", y: "None" },
    dataset_indexes: [],
  };

  const validIndexes = previousSelected.dataset_indexes.filter(
    (index) => index >= 0 && index < sets.length
  );
  const dataset_indexes =
    validIndexes.length > 0 ? validIndexes : sets.map((_, index) => index);

  const numericLabelIndexes = labels
    .map((_, index) => index)
    .filter((index) => sets.some((set) => set.typeOfEachData[index] === "number"));

  const fallbackX = labels[numericLabelIndexes[0]] ?? labels[0] ?? "None";
  const fallbackYIndex =
    numericLabelIndexes.find((index) => labels[index] !== fallbackX) ??
    labels.findIndex((label) => label !== fallbackX);
  const fallbackY =
    fallbackYIndex >= 0 ? labels[fallbackYIndex] : labels[1] ?? fallbackX;

  const normalizedPreviousX =
    previousSelected.axis.x === "None" ? "" : previousSelected.axis.x;
  const normalizedPreviousY =
    previousSelected.axis.y === "None" ? "" : previousSelected.axis.y;

  const isValidAxisLabel = (label: string) => labels.includes(label);

  return {
    title: state.chart.title,
    sets,
    selected: {
      axis: {
        x: isValidAxisLabel(normalizedPreviousX)
          ? normalizedPreviousX
          : fallbackX,
        y: isValidAxisLabel(normalizedPreviousY) && normalizedPreviousY !== fallbackX
          ? normalizedPreviousY
          : fallbackY,
      },
      dataset_indexes,
    },
  };
}
