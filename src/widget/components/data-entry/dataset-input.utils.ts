import * as XLSX from "xlsx";

export type EditableCell = number | string | null | undefined;

export type EditableSet = {
  name: string;
  color: string;
  data: EditableCell[];
  colors: string[];
};

export const PREDEFINED_COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7",
  "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4",
  "#009688", "#4caf50", "#8bc34a", "#ffeb3b",
  "#ffc107", "#ff9800", "#ff5722", "#795548",
  "#9e9e9e", "#607d8b",
];

const COLOR_DISTRIBUTION_OFFSET = 3;
const COLOR_DISTRIBUTION_STEP = 7;

export function getDistributedColor(index: number): string {
  const paletteSize = PREDEFINED_COLORS.length;
  const distributedIndex =
    (COLOR_DISTRIBUTION_OFFSET + index * COLOR_DISTRIBUTION_STEP) %
    paletteSize;

  return PREDEFINED_COLORS[distributedIndex] ?? "#2196f3";
}

function cleanNumber(value: EditableCell): number {
  if (typeof value === "number") return value;
  if (value === undefined || value === null || value === "") return NaN;
  const cleaned = String(value).replace(/[\s$€£¥]/g, "").replace(",", ".");
  return Number(cleaned);
}

export function sanitizeTableData(sets: EditableSet[]): EditableSet[] {
  if (sets.length === 0) return sets;
  const numCols = sets[0].data.length;

  const nextSets = sets.map((set) => ({ ...set, data: [...set.data] }));

  for (let colIndex = 0; colIndex < numCols; colIndex++) {
    let isTextColumn = false;

    for (let rowIndex = 0; rowIndex < nextSets.length; rowIndex++) {
      const value = nextSets[rowIndex].data[colIndex];
      if (value !== undefined && value !== null && value !== "") {
        if (isNaN(cleanNumber(value))) {
          isTextColumn = true;
          break;
        }
      }
    }

    for (let rowIndex = 0; rowIndex < nextSets.length; rowIndex++) {
      const value = nextSets[rowIndex].data[colIndex];

      if (value === undefined || value === null || value === "") {
        nextSets[rowIndex].data[colIndex] = isTextColumn ? null : 0;
        continue;
      }

      const numericValue = cleanNumber(value);
      nextSets[rowIndex].data[colIndex] = isNaN(numericValue)
        ? String(value).trim()
        : numericValue;
    }
  }

  return nextSets;
}

export function normalizeSetColors(sets: EditableSet[]): EditableSet[] {
  return sets.map((set, index) => {
    const rowColor = set.color || getDistributedColor(index);
    const colCount = Array.isArray(set.data) ? set.data.length : 0;

    return {
      ...set,
      color: rowColor,
      colors: Array.from({ length: colCount }, () => rowColor),
    };
  });
}

export function parseSpreadsheet(fileBuffer: ArrayBuffer): {
  labels: string[];
  sets: EditableSet[];
  parsedTitle: string | null;
} {
  const data = new Uint8Array(fileBuffer);
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: EditableCell[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
  });

  if (!rows || rows.length === 0) {
    throw new Error("Spreadsheet is empty.");
  }

  const firstRow = rows[0] || [];
  const parsedTitle =
    firstRow[0] !== undefined && firstRow[0] !== ""
      ? String(firstRow[0])
      : null;

  let labels = firstRow
    .slice(1)
    .map((value) => (value !== undefined ? String(value).trim() : ""));

  let maxDataColumns = 0;
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    maxDataColumns = Math.max(maxDataColumns, (rows[rowIndex] || []).length - 1);
  }

  maxDataColumns = Math.max(maxDataColumns, labels.length);
  while (labels.length < maxDataColumns) {
    labels.push(`Category ${labels.length + 1}`);
  }

  const sets: EditableSet[] = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] || [];
    if (row.length === 0) continue;

    const rowData: EditableCell[] = [];
    for (let colIndex = 0; colIndex < maxDataColumns; colIndex++) {
      rowData.push(row[colIndex + 1]);
    }

    const color = getDistributedColor(sets.length);
    sets.push({
      name:
        row[0] !== undefined && row[0] !== ""
          ? String(row[0])
          : `Series ${rowIndex}`,
      color,
      colors: Array.from({ length: maxDataColumns }, () => color),
      data: rowData,
    });
  }

  return { labels, sets, parsedTitle };
}
