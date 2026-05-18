import { PropertyValueMap, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { customElement, property, state } from "lit/decorators.js";
import { LitElementWw } from "@webwriter/lit";

// Components
import { DatasetInput } from "./components/data-entry/dataset-input";
import { ScatterDatasetInput } from "./components/data-entry/scatter-dataset-input";
import { ChartSettingsPanel } from "./components/settings/chart-settings-panel";
import { OptionSelect } from "./components/controls/controls";

// Shoelace Components & Styles
import style from "./webwriter-chart.style";
import "@shoelace-style/shoelace/dist/themes/light.css";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlTabGroup from "@shoelace-style/shoelace/dist/components/tab-group/tab-group.component.js";
import SlTab from "@shoelace-style/shoelace/dist/components/tab/tab.component.js";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";

// Icons
import IconPlus from "bootstrap-icons/icons/plus.svg";

// Charts & types
import { availableCharts, getChart, getOptionsDefinition } from "./components/charts/chart-registry";
import type { ChartType } from "./components/charts/chart-registry";
import { BarChart } from "./components/charts/bar-chart";
import { DoughnutChart, PieChart } from "./components/charts/circular-chart";
import { LineChart } from "./components/charts/line-chart";
import { PolarChart } from "./components/charts/polar-area-chart";
import { RadarChart } from "./components/charts/radar-chart";
import { ScatterChartJs } from "./components/charts/scatter/scatter-chart";
import { ChartState, Visualization, InternalChartType } from "./state/models";
import {
  deriveFixedScatterDatasets,
  normalizeColumnIndexesInput,
  normalizeColumnsInput,
} from "./webwriter-chart.utils";

declare global {
  interface HTMLElementTagNameMap {
    "webwriter-chart": WwChart;
  }
}

@customElement("webwriter-chart")
export class WwChart extends LitElementWw {
  private static readonly FIXED_SCATTERPLOT_TAB_ID = "viz-scatterplot-fixed";

  @property({ type: Object, attribute: true, reflect: true })
  accessor sharedState: ChartState = {
    teacherOptions: { showOptions: true, showData: true, showLockedOptions: true, changeData: true, changeOptions: true, addRemoveData: true },
    lineDatasets: { sets: [] },
    scatterDatasets: { title: "My Scatterplot", sets: [], selected: { axis: { x: "None", y: "None" }, dataset_indexes: [] } },
    regressionType: "none",
    visualizations: [{ id: "viz-1", name: "Chart 1", selectedType: "Bar" }],
    activeVisualizationId: "viz-1",
    chart: { selectedType: "Bar", title: "My Chart", datasets: { labels: [], sets: [] }, options: {}, optionsLocked: {}, optionDefinition: {} },
    editable: true,
  };

  @property({ type: Boolean, attribute: true, reflect: true }) accessor analyzable: boolean;
  @property({ type: Boolean, attribute: true, reflect: true }) accessor showChart: boolean = false;
  @property({ type: Boolean, attribute: true, reflect: true }) accessor showData: boolean = true;
  @property({ type: Boolean, attribute: true, reflect: true }) accessor showErrorMessage = false;

  @property({ type: Number, attribute: "scatter-x", reflect: true })
  accessor scatterXAxis: number = 0;

  @property({ type: Number, attribute: "scatter-y", reflect: true })
  accessor scatterYAxis: number = 1;

  @state() accessor dataTabName = "Data";
  @state() accessor scatterplotTabName = "Scatterplot";
  @state() accessor lastChartType: InternalChartType = this.sharedState.chart.selectedType;
  @state() accessor editingVisualizationId: string | null = null;
  @state() accessor editingVisualizationName = "";

  static styles = style;

  public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-switch": SlSwitch,
      "sl-checkbox": SlCheckbox,
      "sl-icon-button": SlIconButton,
      "sl-tooltip": SlTooltip,
      "wwci-dataset-input": DatasetInput,
      "wwci-chart-settings": ChartSettingsPanel,
      "bar-chart": BarChart,
      "doughnut-chart": DoughnutChart,
      "line-chart": LineChart,
      "pie-chart": PieChart,
      "polar-chart": PolarChart,
      "radar-chart": RadarChart,
      "scatter-chart-js": ScatterChartJs,
      "wwci-scatterdataset-input": ScatterDatasetInput,
      "sl-tab-group": SlTabGroup,
      "sl-tab": SlTab,
      "sl-alert": SlAlert,
      "sl-select": SlSelect,
      "sl-option": SlOption,
      "wwci-select": OptionSelect,
    };
  }

  protected onStateChange = (e: CustomEvent) => {
    if (!e.detail || !e.detail.state) return;
    this.sharedState = { ...this.sharedState, ...e.detail.state };
    e.stopPropagation();
    e.cancelBubble = true;
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("wwci-state-change", this.onStateChange as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("wwci-state-change", this.onStateChange as EventListener);
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.tabIndex = -1;
  }

  normalizeColumns(value: unknown): string[] {
    return normalizeColumnsInput(value);
  }

  normalizeColumnIndexes(value: unknown, labels: string[]): number[] {
    return normalizeColumnIndexesInput(value, labels);
  }

  private syncFixedScatterplotFromChartData() {
    const nextScatterDatasets = deriveFixedScatterDatasets(this.sharedState);
    if (JSON.stringify(nextScatterDatasets) !== JSON.stringify(this.sharedState.scatterDatasets)) {
      this.sharedState = { ...this.sharedState, scatterDatasets: nextScatterDatasets };
    }
  }

  protected override updated(changedProperties: PropertyValueMap<any>): void {
    super.updated(changedProperties);
    if (!changedProperties.has("sharedState")) return;
    const labels = this.sharedState.chart.datasets.labels ?? [];
    if (labels.length === 0) return;
    let xi = Number.isFinite(this.scatterXAxis) ? this.scatterXAxis : 0;
    let yi = Number.isFinite(this.scatterYAxis) ? this.scatterYAxis : 1;
    if (xi < 0 || xi >= labels.length) xi = 0;
    if (yi < 0 || yi >= labels.length || yi === xi) yi = xi === 0 ? 1 : 0;
    if (yi >= labels.length) yi = xi;
    if (xi !== this.scatterXAxis) this.scatterXAxis = xi;
    if (yi !== this.scatterYAxis) this.scatterYAxis = yi;
  }

  handleTabShow(e: CustomEvent) {
    const panelId = e.detail.name;
    if (panelId === "data") {
      this.showData = true;
      this.showChart = false;
      requestAnimationFrame(() => window.getSelection()?.empty());
    } else if (panelId === WwChart.FIXED_SCATTERPLOT_TAB_ID) {
      this.showData = false;
      this.showChart = true;
      this.sharedState = {
        ...this.sharedState,
        activeVisualizationId: WwChart.FIXED_SCATTERPLOT_TAB_ID,
        chart: {
          ...this.sharedState.chart,
          selectedType: "Scatterplot",
          optionDefinition: getOptionsDefinition("Scatterplot"),
        },
      };
      this.requestUpdate();
      requestAnimationFrame(() => window.getSelection()?.empty());
    } else {
      this.showData = false;
      this.showChart = true;
      this.switchVisualization(panelId);
      requestAnimationFrame(() => window.getSelection()?.empty());
    }
  }

  handleTabClose(e: CustomEvent) {
    const panelId = (e.target as HTMLElement).getAttribute("panel");
    if (panelId) this.removeVisualization(panelId);
  }

  addVisualization() {
    const vizs = this.sharedState.visualizations ?? [];
    const id = `viz-${Date.now()}`;
    const newViz: Visualization = { id, name: `Chart ${vizs.length + 1}`, selectedType: "Bar" };
    this.sharedState = {
      ...this.sharedState,
      visualizations: [...vizs, newViz],
      activeVisualizationId: id,
    };
    this.showData = false;
    this.showChart = true;
    this.requestUpdate();
  }

  removeVisualization(id: string) {
    const vizs = this.sharedState.visualizations ?? [];
    if (vizs.length <= 1) return;
    const updated = vizs.filter((v) => v.id !== id);
    const activeId =
      this.sharedState.activeVisualizationId === id
        ? updated[updated.length - 1].id
        : this.sharedState.activeVisualizationId;
    this.sharedState = { ...this.sharedState, visualizations: updated, activeVisualizationId: activeId };
    if (updated.length === 0) {
      this.showData = true;
      this.showChart = false;
    }
    this.requestUpdate();
  }

  switchVisualization(id: string) {
    const selectedType =
      this.sharedState.visualizations.find((v) => v.id === id)?.selectedType ??
      this.sharedState.chart.selectedType;
    this.sharedState = {
      ...this.sharedState,
      activeVisualizationId: id,
      chart: {
        ...this.sharedState.chart,
        selectedType,
        optionDefinition: getOptionsDefinition(selectedType),
      },
    };
    this.requestUpdate();
  }

  changeVizType(id: string, newType: ChartType) {
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, selectedType: newType } : v)
    );
    this.sharedState = {
      ...this.sharedState,
      visualizations: updated,
      chart: {
        ...this.sharedState.chart,
        selectedType: newType,
        optionDefinition: getOptionsDefinition(newType),
      },
    };
    this.requestUpdate();
  }

  changeVizColumns(id: string, columns: unknown) {
    const normalizedColumns = this.normalizeColumns(columns);
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, visibleColumns: normalizedColumns } : v)
    );
    this.sharedState = { ...this.sharedState, visualizations: updated };
    this.requestUpdate();
  }

  clearChartData() {
    this.sharedState = {
      ...this.sharedState,
      chart: { ...this.sharedState.chart, datasets: { labels: [], sets: [] } },
    };
    this.requestUpdate();
  }

  startInlineTabRename(e: MouseEvent, id: string) {
    e.stopPropagation();
    const currentName =
      id === "data"
        ? this.dataTabName
        : id === WwChart.FIXED_SCATTERPLOT_TAB_ID
        ? this.scatterplotTabName
        : this.sharedState.visualizations?.find((v) => v.id === id)?.name;
    if (!currentName) return;
    this.editingVisualizationId = id;
    this.editingVisualizationName = currentName;
    requestAnimationFrame(() => {
      const label = this.renderRoot.querySelector<HTMLElement>(
        `.tab-label-editing[data-tab-id="${id}"]`
      );
      label?.focus();
      const selection = window.getSelection();
      if (label && selection) {
        const range = document.createRange();
        range.selectNodeContents(label);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  commitInlineTabRename(nextNameOverride?: string) {
    const editingId = this.editingVisualizationId;
    if (!editingId) return;
    const nextName = (nextNameOverride ?? this.editingVisualizationName).replace(/\s+/g, " ").trim();
    if (nextName.length > 0) {
      if (editingId === "data") {
        this.dataTabName = nextName;
      } else if (editingId === WwChart.FIXED_SCATTERPLOT_TAB_ID) {
        this.scatterplotTabName = nextName;
      } else {
        const currentViz = this.sharedState.visualizations?.find((v) => v.id === editingId);
        if (currentViz && nextName !== currentViz.name) {
          this.sharedState = {
            ...this.sharedState,
            visualizations: (this.sharedState.visualizations ?? []).map((viz) =>
              viz.id === editingId ? { ...viz, name: nextName } : viz
            ),
          };
        }
      }
    }
    this.editingVisualizationId = null;
    this.editingVisualizationName = "";
    this.requestUpdate();
  }

  cancelInlineTabRename() {
    this.editingVisualizationId = null;
    this.editingVisualizationName = "";
    this.requestUpdate();
  }

  handleInlineTabRenameKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      const nextName = (e.currentTarget as HTMLElement).textContent ?? "";
      this.commitInlineTabRename(nextName);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      this.cancelInlineTabRename();
    }
  }

  handleTabKeydownWhileEditing(e: KeyboardEvent, id: string) {
    if (this.editingVisualizationId === id) e.stopPropagation();
  }

  render() {
    this.sharedState.editable = this.isContentEditable;
    const vizs = this.sharedState.visualizations ?? [];
    const isFixedScatterplotTab =
      this.sharedState.activeVisualizationId === WwChart.FIXED_SCATTERPLOT_TAB_ID;
    const activeViz = isFixedScatterplotTab
      ? undefined
      : this.sharedState.visualizations?.find(
          (v) => v.id === this.sharedState.activeVisualizationId
        ) ?? this.sharedState.visualizations?.[0];

    if (isFixedScatterplotTab) {
      this.syncFixedScatterplotFromChartData();
      this.sharedState.chart.selectedType = "Scatterplot";
    } else if (activeViz) {
      this.sharedState.chart.selectedType = activeViz.selectedType;
    }

    const useScatterDatasetInput =
      this.sharedState.chart.selectedType === "Scatterplot" && !isFixedScatterplotTab;

    this.sharedState.chart.optionDefinition = getOptionsDefinition(this.sharedState.chart.selectedType);

    const canChangeOptions = this.sharedState.editable || this.sharedState.teacherOptions.changeOptions;
    const canAddRemoveData = this.sharedState.editable || this.sharedState.teacherOptions.addRemoveData;
    const hasChartData =
      (this.sharedState.chart.datasets.labels?.length ?? 0) > 0 &&
      (this.sharedState.chart.datasets.sets?.length ?? 0) > 0;

    return html`
      <div
        part="options"
        id="settings"
        class=${this.isContentEditable && !this.showData && hasChartData ? "" : "hidden"}
      >
        <div id="settings-wrapper">
          <wwci-chart-settings
            class="chart-settings-host"
            .sharedState=${this.sharedState}
            @wwci-state-change=${this.onStateChange}
          ></wwci-chart-settings>
        </div>
      </div>

      <div
        id="main"
        @selectstart=${(e: any) => e.stopPropagation()}
        @dragstart=${(e: any) => e.stopPropagation()}
        @click=${() => this.dispatchEvent(new FocusEvent("focus", { bubbles: true }))}
      >
        <sl-tab-group @sl-tab-show=${this.handleTabShow} @sl-close=${this.handleTabClose}>
          <sl-tab
            slot="nav"
            panel="data"
            ?active=${this.showData}
            @dblclick=${(e: MouseEvent) => this.startInlineTabRename(e, "data")}
            @keydown=${(e: KeyboardEvent) => this.handleTabKeydownWhileEditing(e, "data")}
          >
            ${this.editingVisualizationId === "data"
              ? html`<span
                  class="tab-label-text tab-label-editing"
                  data-tab-id="data"
                  contenteditable="true"
                  @mousedown=${(e: MouseEvent) => e.stopPropagation()}
                  @click=${(e: MouseEvent) => e.stopPropagation()}
                  @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                  @keydown=${this.handleInlineTabRenameKeydown}
                  @blur=${(e: FocusEvent) =>
                    this.commitInlineTabRename((e.currentTarget as HTMLElement).textContent ?? "")}
                >${this.editingVisualizationName}</span>`
              : html`<span class="tab-label-text">${this.dataTabName}</span>`}
          </sl-tab>

          <sl-tab
            slot="nav"
            panel=${WwChart.FIXED_SCATTERPLOT_TAB_ID}
            ?active=${this.showChart && isFixedScatterplotTab}
            @dblclick=${(e: MouseEvent) => this.startInlineTabRename(e, WwChart.FIXED_SCATTERPLOT_TAB_ID)}
            @keydown=${(e: KeyboardEvent) => this.handleTabKeydownWhileEditing(e, WwChart.FIXED_SCATTERPLOT_TAB_ID)}
          >
            ${this.editingVisualizationId === WwChart.FIXED_SCATTERPLOT_TAB_ID
              ? html`<span
                  class="tab-label-text tab-label-editing"
                  data-tab-id=${WwChart.FIXED_SCATTERPLOT_TAB_ID}
                  contenteditable="true"
                  @mousedown=${(e: MouseEvent) => e.stopPropagation()}
                  @click=${(e: MouseEvent) => e.stopPropagation()}
                  @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                  @keydown=${this.handleInlineTabRenameKeydown}
                  @blur=${(e: FocusEvent) =>
                    this.commitInlineTabRename((e.currentTarget as HTMLElement).textContent ?? "")}
                >${this.editingVisualizationName}</span>`
              : html`<span class="tab-label-text">${this.scatterplotTabName}</span>`}
          </sl-tab>

          ${vizs.map(
            (viz, index) => html`
              <sl-tab
                slot="nav"
                panel=${viz.id}
                ?active=${this.showChart && this.sharedState.activeVisualizationId === viz.id}
                ?closable=${index > 0}
                @dblclick=${(e: MouseEvent) => this.startInlineTabRename(e, viz.id)}
                @keydown=${(e: KeyboardEvent) => this.handleTabKeydownWhileEditing(e, viz.id)}
              >
                ${this.editingVisualizationId === viz.id
                  ? html`<span
                      class="tab-label-text tab-label-editing"
                      data-tab-id=${viz.id}
                      contenteditable="true"
                      @mousedown=${(e: MouseEvent) => e.stopPropagation()}
                      @click=${(e: MouseEvent) => e.stopPropagation()}
                      @dblclick=${(e: MouseEvent) => e.stopPropagation()}
                      @keydown=${this.handleInlineTabRenameKeydown}
                      @blur=${(e: FocusEvent) =>
                        this.commitInlineTabRename((e.currentTarget as HTMLElement).textContent ?? "")}
                    >${this.editingVisualizationName}</span>`
                  : html`<span class="tab-label-text">${viz.name}</span>`}
              </sl-tab>
            `
          )}

          <div slot="nav" class="tab-add-action">
            <sl-tooltip content="Add visualization">
              <sl-icon-button
                src=${IconPlus}
                label="Add visualization"
                @click=${this.addVisualization}
                class="tab-add-button"
              ></sl-icon-button>
            </sl-tooltip>
          </div>
        </sl-tab-group>

        ${this.showData && (this.sharedState.editable || this.sharedState.teacherOptions.showData)
          ? html`
              <div id="data-panel" class="panel-shell">
                ${canAddRemoveData && hasChartData
                  ? html`<div class="data-actions-row">
                      <sl-button size="small" variant="danger" outline @click=${() => this.clearChartData()}>
                        Clear Data
                      </sl-button>
                    </div>`
                  : ""}
                <div class="data-content">
                  ${useScatterDatasetInput
                    ? html`<wwci-scatterdataset-input
                        .sharedState=${this.sharedState}
                        @wwci-state-change=${this.onStateChange}
                      ></wwci-scatterdataset-input>`
                    : html`<wwci-dataset-input
                        .sharedState=${this.sharedState}
                        @wwci-state-change=${this.onStateChange}
                      ></wwci-dataset-input>`}
                </div>
              </div>
            `
          : html`
              <div id="chart-panel" class="panel-shell">
                ${hasChartData
                  ? html`
                      <div class="viz-type-row">
                        <span class="viz-type-label">Chart type</span>
                        <wwci-select
                          size="small"
                          .value=${isFixedScatterplotTab ? "Scatterplot" : (activeViz?.selectedType ?? "Bar")}
                          .selectOptions=${availableCharts}
                          ?disabled=${!canChangeOptions || isFixedScatterplotTab}
                          @wwci-change=${(e: CustomEvent) => {
                            e.stopPropagation();
                            e.cancelBubble = true;
                            if (activeViz) this.changeVizType(activeViz.id, (e.target as any).value);
                          }}
                        ></wwci-select>

                        <div class="viz-type-divider"></div>

                        ${isFixedScatterplotTab
                          ? html`
                              <span class="viz-type-label">X-Axis</span>
                              <sl-select
                                size="small"
                                class="axis-select"
                                placeholder="Select X-Axis"
                                .value=${String(this.scatterXAxis)}
                                @sl-change=${(e: Event) => {
                                  this.scatterXAxis = Number((e.target as any).value);
                                }}
                              >
                                ${this.sharedState.chart.datasets.labels.map(
                                  (label, i) =>
                                    html`<sl-option value=${String(i)}>${label}</sl-option>`
                                )}
                              </sl-select>

                              <span class="viz-type-label">Y-Axis</span>
                              <sl-select
                                size="small"
                                class="axis-select"
                                placeholder="Select Y-Axis"
                                .value=${String(this.scatterYAxis)}
                                @sl-change=${(e: Event) => {
                                  this.scatterYAxis = Number((e.target as any).value);
                                }}
                              >
                                ${this.sharedState.chart.datasets.labels.map(
                                  (label, i) =>
                                    html`<sl-option value=${String(i)}>${label}</sl-option>`
                                )}
                              </sl-select>
                            `
                          : html`
                              <span class="viz-type-label">Columns</span>
                              ${(() => {
                                const rawLabels = this.sharedState.chart.datasets.labels;
                                const selectedColumnIndexes = this.normalizeColumnIndexes(
                                  activeViz?.visibleColumns,
                                  rawLabels
                                );
                                return html`<sl-select
                                  size="small"
                                  multiple
                                  clearable
                                  max-options-visible="3"
                                  placeholder="All columns"
                                  .value=${selectedColumnIndexes.map((i) => String(i))}
                                  ?disabled=${!canChangeOptions}
                                  @sl-input=${(e: Event) => {
                                    if (!activeViz) return;
                                    const nextIndexes = this.normalizeColumnIndexes(
                                      (e.target as any).value,
                                      rawLabels
                                    );
                                    this.changeVizColumns(
                                      activeViz.id,
                                      nextIndexes.map((i) => String(i))
                                    );
                                  }}
                                  class="columns-select"
                                >
                                  ${rawLabels.map(
                                    (label, index) =>
                                      html`<sl-option value=${String(index)}>${label}</sl-option>`
                                  )}
                                </sl-select>`;
                              })()}
                            `}
                      </div>

                      <div id="display-chart" class="chart-display-wrap">
                        ${isFixedScatterplotTab
                          ? (() => {
                              const ls = this.sharedState.chart.datasets.labels ?? [];
                              if (ls.length < 2 || this.scatterXAxis === this.scatterYAxis) {
                                return html`<div class="chart-empty-state">
                                  Please select two different values for X and Y axis.
                                </div>`;
                              }
                              return html`
                                <div style="position:absolute; inset:0; padding:10px; box-sizing:border-box;">
                                  <scatter-chart-js
                                    style="display:block; width:100%; height:100%;"
                                    .datasets=${this.sharedState.chart.datasets}
                                    .xAxisIndex=${this.scatterXAxis}
                                    .yAxisIndex=${this.scatterYAxis}
                                    label=${this.sharedState.chart.title}
                                    .sharedState=${this.sharedState}
                                    @wwci-state-change=${this.onStateChange}
                                  ></scatter-chart-js>
                                </div>
                              `;
                            })()
                          : (() => {
                              const rawLabels = this.sharedState.chart.datasets.labels;
                              const selectedIndexes = this.normalizeColumnIndexes(
                                activeViz?.visibleColumns,
                                rawLabels
                              );
                              let filteredDatasets = this.sharedState.chart.datasets;
                              if (selectedIndexes.length > 0) {
                                filteredDatasets = {
                                  labels: selectedIndexes.map((i) => rawLabels[i]),
                                  sets: this.sharedState.chart.datasets.sets.map((set) => ({
                                    ...set,
                                    data: selectedIndexes.map((i) => set.data[i]),
                                    colors: selectedIndexes.map((i) => set.colors[i]),
                                  })),
                                };
                              }
                              const chartKey = `${activeViz?.id ?? "default"}-${selectedIndexes.join(",") || "all"}`;
                              return keyed(
                                chartKey,
                                getChart(
                                  activeViz?.selectedType ?? "Bar",
                                  filteredDatasets,
                                  this.sharedState.chart.selectedType === "Scatterplot"
                                    ? this.sharedState.scatterDatasets.title
                                    : this.sharedState.chart.title,
                                  this.sharedState.chart.options,
                                  this.sharedState.teacherOptions,
                                  this.onStateChange,
                                  this.sharedState
                                )
                              );
                            })()}
                      </div>
                    `
                  : html`
                      <div class="chart-empty-state">
                        Please add data first to display graph.
                      </div>
                    `}
              </div>
            `}
      </div>
    `;
  }
}
