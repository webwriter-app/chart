import { html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import type SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import type SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";
import IconArrowsRightLeft from "@tabler/icons/outline/arrows-right-left.svg";
import IconAxisX from "@tabler/icons/outline/axis-x.svg";
import IconAxisY from "@tabler/icons/outline/axis-y.svg";
import IconChartDots2 from "@tabler/icons/outline/chart-dots-2.svg";
import IconPercentage80 from "@tabler/icons/outline/percentage-80.svg";
import IconTarget from "@tabler/icons/outline/target.svg";
import IconTableShortcut from "@tabler/icons/outline/table-shortcut.svg";
import IconRegexOff from "@tabler/icons/outline/regex-off.svg";
import { availableCharts, availableRegressions } from "./charts/chart-registry";
import type { ChartType, RegressionType } from "./charts/chart-registry";
import type { OptionSelect } from "./controls/option-select";
import type { Visualization } from "../model/models";
import { COL_LABELS, ROW_LABELS, axisControls, regressionShortfall } from "../model/viz-axes";
import type { WebwriterChart } from "../widgets/webwriter-chart";

type SelectedValues = (e: Event) => string[];

const selectedValues: SelectedValues = (e) => {
  const sl = e.target as SlSelect;
  return Array.isArray(sl.value) ? sl.value : [sl.value];
};

/** The x and y axis selectors of the scatter plot and the button that moves plot edits into the data table. */
function scatterAxisControls(host: WebwriterChart) {
  const labels = host.sharedState.chart.datasets.labels;
  const pending = host.sharedState.hasPendingScatterChanges;
  return html`
    <span class="viz-type-label">${host.msg("X-Axis")}</span>
    <wwci-select
      size="small"
      class="select-axis"
      title=${host.msg("X-Axis")}
      .icon=${IconAxisX}
      .selectOptions=${labels}
      .value=${labels[host.scatterXAxis] ?? labels[0] ?? ""}
      @wwci-change=${(e: CustomEvent) => {
        const idx = e.detail.index;
        if (idx >= 0 && idx < labels.length) host.scatterXAxis = idx;
      }}
    ></wwci-select>

    <span class="viz-type-label">${host.msg("Y-Axis")}</span>
    <wwci-select
      size="small"
      class="select-axis"
      title=${host.msg("Y-Axis")}
      .icon=${IconAxisY}
      .selectOptions=${labels}
      .value=${labels[host.scatterYAxis] ?? labels[1] ?? ""}
      @wwci-change=${(e: CustomEvent) => {
        const idx = e.detail.index;
        if (idx >= 0 && idx < labels.length) host.scatterYAxis = idx;
      }}
    ></wwci-select>

    <sl-tooltip
      hoist
      content=${pending
        ? host.msg("Transfer your plot changes into the data table")
        : host.msg("No unsaved plot changes — move or add points first")}
    >
      <sl-button
        size="small"
        variant="primary"
        style="margin-left: auto;"
        aria-label=${host.msg("Apply Changes to Data")}
        ?outline=${!pending}
        ?disabled=${!pending}
        @click=${() => host.applyScatterChanges()}
      >
        <sl-icon slot="prefix" src=${IconArrowsRightLeft}></sl-icon>
        <span class="btn-label">${host.msg("Apply Changes to Data")}</span>
      </sl-button>
    </sl-tooltip>
  `;
}

/** The selectors for the columns and series that a bar, line, pie, doughnut, polar area or radar chart shows. */
function seriesAxisControls(host: WebwriterChart, viz: Visualization | undefined, canChangeOptions: boolean) {
  const controls = axisControls(viz, host.sharedState.chart.datasets.labels ?? [], host.sharedState.chart.datasets.sets ?? []);
  if (!controls) return "";
  const { showCategoryAxis, showYAxisOnly, showRadarSpokes, showXYAxis, rawLabels, availableSpokes, availableYSeries } = controls;

  const xAxisLabel = showCategoryAxis ? host.msg("Selected Series") : showYAxisOnly ? host.msg("Segments") : host.msg("X-Axis");
  const xAxisIcon = showCategoryAxis ? IconTableShortcut : showYAxisOnly ? IconPercentage80 : IconAxisX;
  const yAxisLabel = showYAxisOnly ? host.msg("Levels") : host.msg("Selected Series");
  const yAxisIcon = showYAxisOnly ? IconTarget : IconTableShortcut;

  return html`
    <div class="viz-type-divider"></div>

    ${showRadarSpokes ? html`
      <span class="viz-type-label">${host.msg("Spokes")}</span>
      ${keyed(availableSpokes.join('|'), html`<sl-select
        class="select-axis"
        size="small"
        title=${host.msg("Spokes")}
        ?multiple=${true}
        max-options-visible="2"
        placeholder=${host.msg("All spokes")}
        clearable
        .value=${controls.selectedSpokes.map(s => String(availableSpokes.indexOf(s))).filter(i => i !== "-1")}
        ?disabled=${!canChangeOptions}
        hoist
        @sl-change=${(e: Event) => {
          if (!viz) return;
          const selected = selectedValues(e).map(v => availableSpokes[Number(v)]).filter(Boolean);
          host.changeVizXCategories(viz.id, selected);
        }}
      >
        <sl-icon slot="prefix" src=${IconTableShortcut}></sl-icon>
        ${availableSpokes.map((s, i) => html`<sl-option value=${String(i)}>${s}</sl-option>`)}
      </sl-select>`)}
    ` : html`
      <span class="viz-type-label">${xAxisLabel}</span>
      <wwci-select
        class="select-axis"
        size="small"
        title=${xAxisLabel}
        .icon=${xAxisIcon}
        .selectOptions=${controls.xAxisOptions}
        .value=${controls.currentXValue}
        ?disabled=${!canChangeOptions}
        @wwci-change=${(e: CustomEvent) => {
          if (!viz) return;
          const val = e.detail.value;
          if (val === ROW_LABELS) host.changeVizXAxis(viz.id, -1);
          else if (val === COL_LABELS) host.changeVizXAxis(viz.id, -2);
          else {
            const idx = rawLabels.indexOf(val);
            if (idx >= 0) host.changeVizXAxis(viz.id, idx);
          }
        }}
      ></wwci-select>

      ${(showXYAxis || showYAxisOnly) && availableYSeries.length > 1 ? html`
        <span class="viz-type-label">${yAxisLabel}</span>
        ${keyed(availableYSeries.join('|'), html`<sl-select
          class="select-axis"
          size="small"
          title=${yAxisLabel}
          ?multiple=${true}
          max-options-visible="2"
          placeholder=${host.msg("All series")}
          clearable
          .value=${controls.selectedYSeries.map(s => String(availableYSeries.indexOf(s))).filter(i => i !== "-1")}
          ?disabled=${!canChangeOptions}
          hoist
          @sl-change=${(e: Event) => {
            if (!viz) return;
            const selected = selectedValues(e).map(v => availableYSeries[Number(v)]).filter(Boolean);
            host.changeVizYColumns(viz.id, selected);
          }}
        >
          <sl-icon slot="prefix" src=${yAxisIcon}></sl-icon>
          ${availableYSeries.map((s, i) => html`<sl-option value=${String(i)}>${s}</sl-option>`)}
        </sl-select>`)}
      ` : ""}
    `}
  `;
}

/** The row under the tabs: chart type and axis selectors of the active visualization. */
export function renderVizTypeRow(host: WebwriterChart, viz: Visualization | undefined, isScatterTab: boolean, canChangeOptions: boolean) {
  const chartTypeLabels = {
    Pie: host.msg("Pie Chart"),
    Doughnut: host.msg("Doughnut Chart"),
    Bar: host.msg("Bar Chart"),
    Line: host.msg("Line Chart"),
    "Polar Area": host.msg("Polar Area Chart"),
    Radar: host.msg("Radar Chart"),
    "Scatter plot": host.msg("Scatter plot"),
  };
  return html`
    <div class="viz-type-row">
      ${isScatterTab ? "" : html`
        <span class="viz-type-label">${host.msg("Chart type")}</span>
        <wwci-select
          class="select-chart-type"
          size="small"
          title=${host.msg("Chart type")}
          .icon=${IconChartDots2}
          .value=${viz?.selectedType ?? "Bar"}
          .selectOptions=${availableCharts}
          .selectLabels=${availableCharts.map(type => chartTypeLabels[type])}
          ?disabled=${!canChangeOptions}
          @wwci-change=${(e: CustomEvent) => {
            e.stopPropagation();
            if (viz) host.changeVizType(viz.id, (e.target as OptionSelect).value as ChartType);
          }}
        ></wwci-select>
      `}

      ${isScatterTab ? scatterAxisControls(host) : seriesAxisControls(host, viz, canChangeOptions)}
    </div>
  `;
}

/** The row of the scatter plot with the regression model, its warning and the analysis options. */
export function renderRegressionRow(host: WebwriterChart, editing: boolean) {
  const state = host.sharedState;
  const opts = state.chart.options ?? {};
  const locked = state.chart.optionsLocked ?? {};
  const mayChange = (key: string) => editing || (state.teacherOptions.changeOptions && !locked[key]);
  const regressionType = state.regressionType;
  const shortfall = regressionShortfall(state);
  const warning = shortfall
    ? `${host.msg("Not enough data points for this regression model:")} ${shortfall.points}/${shortfall.required}`
    : null;
  const regressionLabels = {
    none: host.msg("No regression"),
    "Linear Regression": host.msg("Linear Regression"),
    "Polynomial Regression": host.msg("Polynomial Regression"),
    "Local Regression": host.msg("Local Regression"),
    "Exponential Regression": host.msg("Exponential Regression"),
    "Logarithmic Regression": host.msg("Logarithmic Regression"),
  };
  return html`
    <div class="viz-type-row analysis-row">
      <span class="viz-type-label">${host.msg("Regression Model")}</span>

      <sl-select
        class="select-regression"
        size="small"
        title=${host.msg("Regression Model")}
        .value=${regressionType}
        ?disabled=${!mayChange("listRegressionLine")}
        hoist
        @sl-change=${(e: Event) => {
          e.stopPropagation();
          host.sharedState = { ...host.sharedState, regressionType: (e.target as SlSelect).value as RegressionType };
        }}
      >
        <sl-icon slot="prefix" src=${IconRegexOff}></sl-icon>
        ${availableRegressions.map(r => html`<sl-option value=${r}>${regressionLabels[r]}</sl-option>`)}
      </sl-select>

      ${warning ? html`
        <sl-tooltip hoist content=${warning}>
          <span class="analysis-warning">⚠</span>
        </sl-tooltip>` : ""}
      <sl-checkbox
        size="small"
        ?checked=${Boolean(opts.showCorrelation)}
        ?disabled=${regressionType === "none" || !mayChange("showCorrelation")}
        @sl-change=${(e: Event) => host.setScatterOption("showCorrelation", (e.target as SlCheckbox).checked)}
      >${host.msg("Show Correlation")}</sl-checkbox>
      <sl-checkbox
        size="small"
        ?checked=${Boolean(opts.showOutliers)}
        ?disabled=${regressionType === "none" || !mayChange("showOutliers")}
        @sl-change=${(e: Event) => host.setScatterOption("showOutliers", (e.target as SlCheckbox).checked)}
      >${host.msg("Show Outliers")}</sl-checkbox>
    </div>`;
}
