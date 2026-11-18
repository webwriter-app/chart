import { str } from "@lit/localize";
import { parseSpreadsheet } from "../model/dataset-table";
import {
  csvToTable, datasetsToTable, tableToCsv, tableToData,
  type DataTable, type ImportedData,
} from "../model/dataset-exchange";
import type { ChartState } from "../model/models";
import type { WebwriterChart } from "../widgets/webwriter-chart";

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CHART_ELEMENTS = "bar-chart, line-chart, pie-chart, doughnut-chart, polar-chart, radar-chart, scatter-chart-js";

/** The chart data of a state as a table, or null while there is none. */
export const stateTable = (state: ChartState) => datasetsToTable(state.chart.title, state.chart.datasets);

/** A table element as a data table: the first row is the header, an empty top-left cell takes the caption. */
export function elementToTable(table: HTMLTableElement): DataTable | null {
  const [head, ...body] = Array.from(table.rows, (row) => Array.from(row.cells, (cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim()));
  if (!head) return null;
  const caption = table.caption?.textContent?.trim();
  if (!head[0] && caption) head[0] = caption;
  return { columns: head, rows: body.map((row) => row.map((cell) => (cell === "" ? null : cell))) };
}

/** A data table as a detached table element with a header row and a header cell per series. */
export function tableToElement(doc: Document, table: DataTable): HTMLTableElement {
  const element = doc.createElement("table");
  const cell = (tag: string, text: unknown, scope?: string) => {
    const el = doc.createElement(tag);
    el.textContent = text === null || text === undefined ? "" : String(text);
    if (scope) el.setAttribute("scope", scope);
    return el;
  };
  const row = (cells: HTMLElement[]) => {
    const tr = doc.createElement("tr");
    tr.append(...cells);
    return tr;
  };
  const thead = doc.createElement("thead");
  thead.append(row(table.columns.map((column) => cell("th", column, "col"))));
  const tbody = doc.createElement("tbody");
  tbody.append(...table.rows.map(([name, ...values]) => row([cell("th", name, "row"), ...values.map((value) => cell("td", value))])));
  element.append(thead, tbody);
  return element;
}

/** Replaces the title and the data table of the widget. */
export function applyData(host: WebwriterChart, data: ImportedData) {
  const { chart } = host.sharedState;
  host.sharedState = { ...host.sharedState, chart: { ...chart, title: data.title || chart.title, datasets: { labels: data.labels, sets: data.sets } } };
}

/** Applies a table to the widget after checking it. Declines with false. */
export function loadTable(this: WebwriterChart, fragment: DocumentFragment): boolean {
  const host = this;
  const element = fragment.querySelector("table");
  const table = element && elementToTable(element);
  const data = table && tableToData(table, defaultNames(host));
  if (!data) return false;
  applyData(host, data);
  return true;
}

export function defaultNames(host: WebwriterChart) {
  return {
    category: (index: number) => host.msg(str`Category ${index}`),
    series: (index: number) => host.msg(str`Series ${index}`),
  };
}

function checked(host: WebwriterChart, table: DataTable): ImportedData {
  const data = tableToData(table, defaultNames(host));
  if (!data) throw new Error(host.msg("The file needs a header row and at least one row with a name and values."));
  return data;
}

/** Reads a CSV file and returns the function that applies it. The first row holds the title and the categories. */
export async function importCsv(this: WebwriterChart, file: File) {
  const host = this;
  const data = checked(host, csvToTable(await file.text()));
  return () => applyData(host, data);
}

/** Reads the first sheet of a spreadsheet file and returns the function that applies it. */
export async function importXlsx(this: WebwriterChart, file: File) {
  const host = this;
  let parsed;
  try {
    parsed = await parseSpreadsheet(await file.arrayBuffer(), defaultNames(host));
  } catch {
    throw new Error(host.msg("Could not parse the file. Please ensure it is a valid Excel or CSV file."));
  }
  if (!parsed.labels.length || !parsed.sets.length) throw new Error(host.msg("The file needs a header row and at least one row with a name and values."));
  const data = { title: parsed.parsedTitle ?? "", labels: parsed.labels, sets: parsed.sets as unknown as ImportedData["sets"] };
  return () => applyData(host, data);
}

function fileName(title: string, extension: string) {
  const slug = title.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${slug || "chart"}.${extension}`;
}

export function exportCsv(this: WebwriterChart): File | null {
  const host = this;
  const table = stateTable(host.sharedState);
  return table && new File([tableToCsv(table)], fileName(host.sharedState.chart.title, "csv"), { type: "text/csv" });
}

/** The page color behind the chart when it is opaque, else white, so that themed light text stays readable. */
function paperColor(host: HTMLElement) {
  for (let el: Element | null = host; el; el = el.parentElement) {
    const color = getComputedStyle(el).backgroundColor;
    if (color && !/^rgba?\(.*,\s*0\)$|^transparent$/.test(color)) return color;
  }
  return "#fff";
}

/** The picture of the chart that is on screen, on the page color (white without one). Null while no chart is shown. */
export async function exportPng(this: WebwriterChart): Promise<File | null> {
  const host = this;
  const canvas = Array.from(host.renderRoot.querySelectorAll(CHART_ELEMENTS), (chart) => chart.shadowRoot?.querySelector("canvas"))
    .find((candidate) => candidate && candidate.getClientRects().length > 0);
  if (!canvas || !canvas.width || !canvas.height) return null;
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const context = flat.getContext("2d")!;
  context.fillStyle = paperColor(host);
  context.fillRect(0, 0, flat.width, flat.height);
  context.drawImage(canvas, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => flat.toBlob(resolve, "image/png"));
  return blob && new File([blob], fileName(host.sharedState.chart.title, "png"), { type: "image/png" });
}

/** A detached table element with the chart data, or null without data. */
export function toTable(this: WebwriterChart): HTMLTableElement | null {
  const table = stateTable(this.sharedState);
  return table && tableToElement(this.ownerDocument, table);
}
