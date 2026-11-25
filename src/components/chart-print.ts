import type { WebwriterChart } from "../widgets/webwriter-chart";

const CHART_ELEMENTS = "bar-chart, line-chart, pie-chart, doughnut-chart, polar-chart, radar-chart, scatter-chart-js";

/** Shows the chart panel while the print dialog is open, even if the Data tab is active, and redraws the charts at that size, because Chart.js draws nothing into a hidden panel. Removes its listeners with the signal. */
export function watchPrint(host: WebwriterChart, signal: AbortSignal) {
  const prepare = (printing: boolean) => {
    host.renderRoot.querySelector("#main")?.classList.toggle("printing", printing);
    host.renderRoot.querySelectorAll(CHART_ELEMENTS).forEach((chart) => (chart as { refreshChart?: () => void }).refreshChart?.());
  };
  window.addEventListener("beforeprint", () => prepare(true), { signal });
  window.addEventListener("afterprint", () => prepare(false), { signal });
}
