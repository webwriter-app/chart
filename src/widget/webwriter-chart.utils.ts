import { ChartState, ScatterDatasets } from "./state/models";

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

/**
 * Older documents (and some shipped snippets) stored scatter points only in
 * `scatterDatasets`, as sets holding many `dimensional_data` rows. The fixed
 * scatter tab now reads the shared `chart.datasets` table, where every row is one
 * point, so derived sets always hold exactly one row. Returns the legacy points
 * converted into a `chart.datasets` table plus the axis indexes that were
 * selected, or `null` when the state is already in the current format.
 */
export function migrateLegacyScatterDatasets(
  state: ChartState
): { datasets: ChartState["chart"]["datasets"]; xAxisIndex: number; yAxisIndex: number } | null {
  const legacySets = state.scatterDatasets?.sets ?? [];
  const isLegacy = legacySets.some((set) => (set.dimensional_data ?? []).length !== 1);
  if (!isLegacy) return null;

  const labels: string[] = [];
  for (const set of legacySets) {
    for (const label of set.labels ?? []) {
      if (!labels.includes(label)) labels.push(label);
    }
  }

  const sets = legacySets.flatMap((set) =>
    (set.dimensional_data ?? []).map((point, pointIndex) => {
      const color = point.color ?? set.color ?? "#2196f3";
      const data = labels.map((label) => {
        const index = (set.labels ?? []).indexOf(label);
        return index >= 0 ? normalizeScatterCellValue(point.data[index]) : "";
      });
      return {
        name: `${set.name || "Series"} ${set.ids?.[pointIndex] ?? pointIndex + 1}`,
        color,
        colors: labels.map(() => color),
        data,
      };
    })
  );
  if (labels.length === 0 || sets.length === 0) return null;

  const axis = state.scatterDatasets.selected?.axis ?? { x: "None", y: "None" };
  const xAxisIndex = Math.max(0, labels.indexOf(axis.x));
  let yAxisIndex = labels.indexOf(axis.y);
  if (yAxisIndex < 0 || yAxisIndex === xAxisIndex) {
    yAxisIndex = labels.findIndex((_, index) => index !== xAxisIndex);
  }

  return { datasets: { labels, sets }, xAxisIndex, yAxisIndex: Math.max(0, yAxisIndex) };
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
