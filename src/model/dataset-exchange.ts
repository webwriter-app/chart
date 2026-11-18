import type { ChartDataSet, ChartDataSets } from "./models";
import { type EditableSet, getDistributedColor, normalizeSetColors, sanitizeTableData } from "./dataset-table";

/** The table shape widgets exchange: the first column holds the series names, the other columns the categories. */
export type DataTable = { columns: string[]; rows: (string | number | null)[][] };

export type ImportedData = { title: string; labels: string[]; sets: ChartDataSet[] };

export function isDataTable(value: unknown): value is DataTable {
  const table = value as DataTable | null;
  return !!table && Array.isArray(table.columns) && Array.isArray(table.rows) && table.rows.every(Array.isArray);
}

/** The chart data as a table: the title and the category names in the header row, one row per series. Null without data. */
export function datasetsToTable(title: string, datasets: ChartDataSets): DataTable | null {
  if (!datasets.labels?.length || !datasets.sets?.length) return null;
  return {
    columns: [title, ...datasets.labels],
    rows: datasets.sets.map((set) => [set.name, ...datasets.labels.map((_, i) => (set.data[i] ?? null) as string | number | null)]),
  };
}

/** Names for what the table leaves empty (numbered from 1). */
export type DefaultNames = { category: (index: number) => string; series: (index: number) => string };

/** Reads a table as chart data. Returns null if it has no category column or no row. */
export function tableToData(table: DataTable, names: DefaultNames): ImportedData | null {
  if (table.columns.length < 2 || table.rows.length < 1) return null;
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value).trim());
  const labels = table.columns.slice(1).map((label, i) => text(label) || names.category(i + 1));
  const sets: EditableSet[] = table.rows.map((row, i) => {
    const color = getDistributedColor(i);
    return {
      name: text(row[0]) || names.series(i + 1),
      color,
      colors: labels.map(() => color),
      data: labels.map((_, j) => row[j + 1] ?? null),
    };
  });
  return { title: text(table.columns[0]), labels, sets: normalizeSetColors(sanitizeTableData(sets)) as unknown as ChartDataSet[] };
}

/** Splits CSV text into rows. The delimiter (comma, semicolon or tab) is the one that occurs most in the first line. */
export function parseCsv(source: string): string[][] {
  const text = source.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0].replace(/"[^"]*"/g, "");
  const delimiter = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length] as const).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = false;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += char;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function csvToTable(text: string): DataTable {
  const [columns = [], ...rows] = parseCsv(text);
  return { columns, rows: rows.map((r) => r.map((c) => (c.trim() === "" ? null : c))) };
}

export function tableToCsv(table: DataTable): string {
  const quote = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\r\n;]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [table.columns, ...table.rows].map((r) => r.map(quote).join(",")).join("\r\n") + "\r\n";
}
