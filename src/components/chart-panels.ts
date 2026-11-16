import { html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import IconTrash from "@tabler/icons/outline/trash.svg";
import { getChart } from "./charts/chart-registry";
import { renderRegressionRow, renderVizTypeRow } from "./chart-toolbar";
import type { Visualization } from "../model/models";
import { chartAxisProps } from "../model/viz-axes";
import type { WebwriterChart } from "../widgets/webwriter-chart";

/** The data table panel with its clear button. */
export function renderDataPanel(host: WebwriterChart, visible: boolean, canAddRemoveData: boolean, hasChartData: boolean) {
  return html`
    <div id="data-panel" class="panel-shell ${visible ? '' : 'hidden'}">
      ${canAddRemoveData && hasChartData
        ? html`<div class="data-actions-row">
            <sl-button
              size="small"
              variant="danger"
              outline
              aria-label=${host.msg("Clear Data")}
              @click=${() => host.clearChartData()}
            >
              <sl-icon slot="prefix" src=${IconTrash}></sl-icon>
              <span class="btn-label">${host.msg("Clear Data")}</span>
            </sl-button>
          </div>`
        : ""}
      <div class="data-content">
        <wwci-dataset-input
          .sharedState=${host.sharedState}
          .lang=${host.lang}
          @wwci-state-change=${host.onStateChange}
        ></wwci-dataset-input>
      </div>
    </div>
  `;
}

/** The chart of the active visualization: the scatter plot, or the chart element of the selected type. */
function renderChartDisplay(host: WebwriterChart, viz: Visualization | undefined, isScatterTab: boolean) {
  const state = host.sharedState;
  const labels = state.chart.datasets.labels ?? [];
  const validScatterAxes = labels.length >= 2 && host.scatterXAxis !== host.scatterYAxis;
  const axes = chartAxisProps(viz, labels, state.chart.datasets.sets ?? []);

  return html`
    <div id="display-chart" class="chart-display-wrap">
      <div class="chart-host-wrap"
           style="display:${isScatterTab && validScatterAxes ? 'block' : 'none'};">
        <scatter-chart-js
          style="display:block; width:100%; height:100%;"
          .datasets=${state.chart.datasets}
          .xAxisIndex=${host.scatterXAxis}
          .yAxisIndex=${host.scatterYAxis}
          label=${state.chart.title}
          .sharedState=${state}
          .lang=${host.lang}
          @wwci-state-change=${host.onStateChange}
        ></scatter-chart-js>
      </div>

      ${isScatterTab && !validScatterAxes ? html`
        <div class="chart-empty-state">
          ${host.msg("Please select two different values for X and Y axis.")}
        </div>
      ` : ""}

      ${!isScatterTab
        ? keyed(
            axes.key,
            getChart(
              viz?.selectedType ?? "Bar",
              state.chart.datasets,
              state.chart.title,
              state.chart.options,
              state.teacherOptions,
              host.onStateChange,
              state,
              axes.xAxis,
              axes.yColumns,
              axes.xCategories,
              axes.scaleLabel,
            )
          )
        : ""}
    </div>
  `;
}

/** The chart panel with the toolbar rows and the chart, or a hint while there is no data. */
export function renderChartPanel(
  host: WebwriterChart,
  visible: boolean,
  viz: Visualization | undefined,
  isScatterTab: boolean,
  canChangeOptions: boolean,
  editing: boolean,
  hasChartData: boolean,
) {
  return html`
    <div id="chart-panel" class="panel-shell ${visible ? '' : 'hidden'}">
      ${hasChartData
        ? html`
            ${renderVizTypeRow(host, viz, isScatterTab, canChangeOptions)}
            ${isScatterTab ? renderRegressionRow(host, editing) : ""}
            ${renderChartDisplay(host, viz, isScatterTab)}
          `
        : html`
            <div class="chart-empty-state">
              ${host.msg("Please add data first to display the graph.")}
            </div>
          `}
    </div>
  `;
}
