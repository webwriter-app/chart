import { PropertyValueMap, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { customElement, property, state } from "lit/decorators.js";
import { LitElementWw } from "@webwriter/lit";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import LOCALIZE from "../../localization/generated";

// Components
import { DatasetInput } from "./components/data-entry/dataset-input";
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

if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption);
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect);

// Icons
import IconPlus from "@tabler/icons/outline/plus.svg";
import IconArrowsRightLeft from "@tabler/icons/outline/arrows-right-left.svg";
import IconTrash from "@tabler/icons/outline/trash.svg";
import IconAxisX from "@tabler/icons/outline/axis-x.svg";
import IconAxisY from "@tabler/icons/outline/axis-y.svg";
import IconChartDots2 from "@tabler/icons/outline/chart-dots-2.svg";
import IconPercentage80 from "@tabler/icons/outline/percentage-80.svg";
import IconTarget from "@tabler/icons/outline/target.svg";
import IconTableShortcut from "@tabler/icons/outline/table-shortcut.svg";
import IconRegexOff from "@tabler/icons/outline/regex-off.svg";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";

// Charts & types
import { availableCharts, availableRegressions, getChart, getOptionsDefinition, normalizeChartType } from "./components/charts/chart-registry";
import type { ChartType } from "./components/charts/chart-registry";
import { BarChart } from "./components/charts/bar-chart";
import { DoughnutChart, PieChart } from "./components/charts/circular-chart";
import { LineChart } from "./components/charts/line-chart";
import { PolarChart } from "./components/charts/polar-area-chart";
import { RadarChart } from "./components/charts/radar-chart";
import { ScatterChartJs } from "./components/charts/scatter/scatter-chart";
import { ChartState, Visualization } from "./state/models";
import {
  deriveFixedScatterDatasets,
  migrateLegacyScatterDatasets,
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
    scatterDatasets: { title: "My Scatter plot", sets: [], selected: { axis: { x: "None", y: "None" }, dataset_indexes: [] } },
    regressionType: "none",
    scatterLines: [],
    visualizations: [{ id: "viz-1", name: "Chart 1", selectedType: "Bar" }],
    activeVisualizationId: "viz-1",
    chart: { selectedType: "Bar", title: "My Chart", datasets: { labels: [], sets: [] }, options: {}, optionsLocked: {}, optionDefinition: {} },
    editable: true,
  };

  @property({ type: Boolean, attribute: true, reflect: true }) accessor showChart: boolean = false;
  @property({ type: Boolean, attribute: true, reflect: true }) accessor showData: boolean = true;

  @property({ type: Number, attribute: "scatter-x", reflect: true })
  accessor scatterXAxis: number = 0;

  @property({ type: Number, attribute: "scatter-y", reflect: true })
  accessor scatterYAxis: number = 1;

  @state() accessor dataTabName = "Data";
  @state() accessor scatterplotTabName = "Scatter plot";
  @state() accessor editingVisualizationId: string | null = null;
  @state() accessor editingVisualizationName = "";

  localize = LOCALIZE;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

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
      "sl-tab-group": SlTabGroup,
      "sl-tab": SlTab,
      "sl-alert": SlAlert,
      "sl-select": SlSelect,
      "sl-option": SlOption,
      "wwci-select": OptionSelect,
      "sl-icon": SlIcon,
    };
  }

  protected onStateChange = (e: CustomEvent) => {
    if (!e.detail || !e.detail.state) return;
    const incoming = e.detail.state;
    let nextState = { ...this.sharedState, ...incoming };

    if (incoming.chart?.options) {
      const activeVizId = this.sharedState.activeVisualizationId;
      const isScatter = activeVizId === WwChart.FIXED_SCATTERPLOT_TAB_ID;
      if (!isScatter) {
        nextState = {
          ...nextState,
          visualizations: (nextState.visualizations ?? []).map((v: Visualization) =>
            v.id === activeVizId ? { ...v, options: nextState.chart.options } : v
          ),
        };
      }
    }

    this.sharedState = nextState;
    e.stopPropagation();
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("wwci-state-change", this.onStateChange as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("wwci-state-change", this.onStateChange as EventListener);
  }
 protected override async scheduleUpdate(): Promise<unknown> {
    await new Promise<void>(res => requestAnimationFrame(() => res()));
    return super.scheduleUpdate();
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.tabIndex = -1;
  }

  protected override willUpdate(_changed: PropertyValueMap<any>): void {
    super.willUpdate(_changed);

    if (this.showChart && this.showData) this.showData = false;

    const activeId = this.sharedState.activeVisualizationId;
    const vizs = this.sharedState.visualizations ?? [];
    if (
      activeId !== WwChart.FIXED_SCATTERPLOT_TAB_ID &&
      vizs.length > 0 &&
      !vizs.some((v) => v.id === activeId)
    ) {
      this.sharedState = { ...this.sharedState, activeVisualizationId: vizs[0].id };
    }

    if (
      _changed.has("sharedState") &&
      this.sharedState.activeVisualizationId === WwChart.FIXED_SCATTERPLOT_TAB_ID
    ) {
      const migrated = migrateLegacyScatterDatasets(this.sharedState);
      if (migrated) {
        this.sharedState = {
          ...this.sharedState,
          chart: { ...this.sharedState.chart, datasets: migrated.datasets },
        };
        this.scatterXAxis = migrated.xAxisIndex;
        this.scatterYAxis = migrated.yAxisIndex;
      }
    }
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
    if (changedProperties.has("lang")) {
      const locale = this.lang || "en";
      this.localize.setLocale(locale).catch((err: unknown) => {
        console.error("[webwriter-chart] setLocale failed:", err);
      });
    }
    if (!changedProperties.has("sharedState")) return;
    if (this.sharedState.activeVisualizationId === WwChart.FIXED_SCATTERPLOT_TAB_ID) {
      this.syncFixedScatterplotFromChartData();
    }
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

  private refreshVisibleChart() {
    requestAnimationFrame(() => {
      const el = this.renderRoot.querySelector(
        "bar-chart, line-chart, pie-chart, doughnut-chart, polar-chart, radar-chart"
      ) as { refreshChart?: () => void } | null;
      el?.refreshChart?.();
    });
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
      const optDef = getOptionsDefinition("Scatter plot");
      // Merge existing option values with defaults so toggles reflect correct initial state
      const options = Object.entries(optDef).reduce((acc: any, [key, def]) => {
        acc[key] = this.sharedState.chart.options?.[key] !== undefined
          ? this.sharedState.chart.options[key]
          : (def as any).default;
        return acc;
      }, {});
      this.sharedState = {
        ...this.sharedState,
        activeVisualizationId: WwChart.FIXED_SCATTERPLOT_TAB_ID,
        chart: {
          ...this.sharedState.chart,
          selectedType: "Scatter plot",
          optionDefinition: optDef,
          options,
        },
      };
      this.requestUpdate();
      requestAnimationFrame(() => window.getSelection()?.empty());
    } else {
      this.showData = false;
      this.showChart = true;
      this.switchVisualization(panelId);
      this.refreshVisibleChart();
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
    const defaultType: ChartType = "Pie";
    const optDef = getOptionsDefinition(defaultType);
    const defaultOptions: Record<string, any> =
      Object.fromEntries(Object.entries(optDef).map(([k, d]) => [k, (d as any).default]));
    const newViz: Visualization = { id, name: `Chart ${vizs.length + 1}`, selectedType: defaultType, options: defaultOptions };
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
    const viz = this.sharedState.visualizations.find((v) => v.id === id);
    const selectedType = normalizeChartType(viz?.selectedType ?? this.sharedState.chart.selectedType ?? "Bar");
    const optionDefinition = getOptionsDefinition(selectedType);
    // Restore this tab's saved options, falling back to chart-type defaults
    const options: Record<string, any> = viz?.options ??
      Object.fromEntries(Object.entries(optionDefinition).map(([k, d]) => [k, (d as any).default]));
    this.sharedState = {
      ...this.sharedState,
      activeVisualizationId: id,
      chart: { ...this.sharedState.chart, selectedType, optionDefinition, options },
    };
    this.requestUpdate();
  }

  changeVizType(id: string, newType: ChartType) {
    const optionDefinition = getOptionsDefinition(newType);
    const defaultOptions: Record<string, any> =
      Object.fromEntries(Object.entries(optionDefinition).map(([k, d]) => [k, (d as any).default]));
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, selectedType: newType, options: defaultOptions } : v)
    );
    this.sharedState = {
      ...this.sharedState,
      visualizations: updated,
      chart: { ...this.sharedState.chart, selectedType: newType, optionDefinition, options: defaultOptions },
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

  changeVizXAxis(id: string, xIdx: number) {
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, xAxisIndex: xIdx, yColumns: [], xCategories: [] } : v)
    );
    this.sharedState = { ...this.sharedState, visualizations: updated };
    this.requestUpdate();
  }

  changeVizYColumns(id: string, columns: string[]) {
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, yColumns: columns } : v)
    );
    this.sharedState = { ...this.sharedState, visualizations: updated };
    this.requestUpdate();
  }

  changeVizXCategories(id: string, categories: string[]) {
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, xCategories: categories } : v)
    );
    this.sharedState = { ...this.sharedState, visualizations: updated };
    this.requestUpdate();
  }

  changeVizScaleLabel(id: string, label: string) {
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map(
      (v) => (v.id === id ? { ...v, scaleLabel: label } : v)
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

  /** Update a single scatter chart option (reactive: the new sharedState
   * reference re-renders the scatter chart immediately). */
  private setScatterOption(key: string, value: string | number | boolean) {
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        options: { ...this.sharedState.chart.options, [key]: value },
      },
    };
  }

  /** Warning text when the dataset is too small for the selected regression
   * model (a degree-d polynomial needs d + 1 points, LOESS needs 3). */
  private regressionPointsWarning(): string | null {
    const type = this.sharedState.regressionType;
    if (type === "none") return null;
    let required = 2;
    if (type === "Polynomial Regression") {
      const degree = Number(this.sharedState.chart.options?.polynomialDegree ?? 2);
      required = Math.max(2, Math.round(degree) + 1);
    } else if (type === "Local Regression") {
      required = 3;
    }
    const n = this.sharedState.chart.datasets.sets?.length ?? 0;
    if (n >= required) return null;
    return `${msg("Not enough data points for this regression model:")} ${n}/${required}`;
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
      this.sharedState.chart.selectedType = "Scatter plot";
    } else if (activeViz) {
      this.sharedState.chart.selectedType = normalizeChartType(activeViz.selectedType);
    } else {
       this.sharedState.chart.selectedType = normalizeChartType(this.sharedState.chart.selectedType ?? "Bar");
    }

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
            .lang=${this.lang}
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
              : html`<span class="tab-label-text">${this.dataTabName === "Data" ? msg("Data") : this.dataTabName}</span>`}
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
              : html`<span class="tab-label-text">${this.scatterplotTabName === "Scatter plot" ? msg("Scatter plot") : this.scatterplotTabName}</span>`}
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
                  : html`<span class="tab-label-text">${viz.name.replace(/^Chart\b/, msg("Chart"))}</span>`}
              </sl-tab>
            `
          )}

          <div slot="nav" class="tab-add-action">
            <sl-tooltip content=${msg("Add visualization")}>
              <sl-icon-button
                src=${IconPlus}
                label=${msg("Add visualization")}
                @click=${this.addVisualization}
                class="tab-add-button"
              ></sl-icon-button>
            </sl-tooltip>
          </div>
        </sl-tab-group>

        ${(() => {
          const showDataPanel = this.showData && (this.sharedState.editable || this.sharedState.teacherOptions.showData);
          return html`
            <div id="data-panel" class="panel-shell ${showDataPanel ? '' : 'hidden'}">
              ${canAddRemoveData && hasChartData
                ? html`<div class="data-actions-row">
                    <sl-button
                      size="small"
                      variant="danger"
                      outline
                      aria-label=${msg("Clear Data")}
                      @click=${() => this.clearChartData()}
                    >
                      <sl-icon slot="prefix" src=${IconTrash}></sl-icon>
                      <span class="btn-label">${msg("Clear Data")}</span>
                    </sl-button>
                  </div>`
                : ""}
              <div class="data-content">
                <wwci-dataset-input
                  .sharedState=${this.sharedState}
                  .lang=${this.lang}
                  @wwci-state-change=${this.onStateChange}
                ></wwci-dataset-input>
              </div>
            </div>

            <div id="chart-panel" class="panel-shell ${!showDataPanel ? '' : 'hidden'}">
                ${hasChartData
                  ? html`
                      <div class="viz-type-row">
                        ${isFixedScatterplotTab ? "" : html`
                          <span class="viz-type-label">${msg("Chart type")}</span>
                          <wwci-select
                            class="select-chart-type"
                            size="small"
                            title=${msg("Chart type")}
                            .icon=${IconChartDots2}
                            .value=${activeViz?.selectedType ?? "Bar"}
                            .selectOptions=${availableCharts}
                            ?disabled=${!canChangeOptions}
                            @wwci-change=${(e: CustomEvent) => {
                              e.stopPropagation();
                              if (activeViz) this.changeVizType(activeViz.id, (e.target as any).value);
                            }}
                          ></wwci-select>
                        `}

                        ${isFixedScatterplotTab
                          ? html`
                              ${(() => {
                                const labels = this.sharedState.chart.datasets.labels;
                                return html`
                                  <span class="viz-type-label">${msg("X-Axis")}</span>
                                  <wwci-select
                                    size="small"
                                    class="select-axis"
                                    title=${msg("X-Axis")}
                                    .icon=${IconAxisX}
                                    .selectOptions=${labels}
                                    .value=${labels[this.scatterXAxis] ?? labels[0] ?? ""}
                                    @wwci-change=${(e: CustomEvent) => {
                                      const idx = e.detail.index;
                                      if (idx >= 0 && idx < labels.length) this.scatterXAxis = idx;
                                    }}
                                  ></wwci-select>

                                  <span class="viz-type-label">${msg("Y-Axis")}</span>
                                  <wwci-select
                                    size="small"
                                    class="select-axis"
                                    title=${msg("Y-Axis")}
                                    .icon=${IconAxisY}
                                    .selectOptions=${labels}
                                    .value=${labels[this.scatterYAxis] ?? labels[1] ?? ""}
                                    @wwci-change=${(e: CustomEvent) => {
                                      const idx = e.detail.index;
                                      if (idx >= 0 && idx < labels.length) this.scatterYAxis = idx;
                                    }}
                                  ></wwci-select>
                                `;
                              })()}

                              <sl-tooltip
                                hoist
                                content=${this.sharedState.hasPendingScatterChanges
                                  ? msg("Transfer your plot changes into the data table")
                                  : msg("No unsaved plot changes — move or add points first")}
                              >
                                <sl-button
                                  size="small"
                                  variant="primary"
                                  style="margin-left: auto;"
                                  aria-label=${msg("Apply Changes to Data")}
                                  ?outline=${!this.sharedState.hasPendingScatterChanges}
                                  ?disabled=${!this.sharedState.hasPendingScatterChanges}
                                  @click=${() => {
                                    const scatter = this.renderRoot.querySelector("scatter-chart-js") as ScatterChartJs | null;
                                    scatter?.applyToData();
                                  }}
                                >
                                  <sl-icon slot="prefix" src=${IconArrowsRightLeft}></sl-icon>
                                  <span class="btn-label">${msg("Apply Changes to Data")}</span>
                                </sl-button>
                              </sl-tooltip>
                            `
                          : html`
                              ${(() => {
                                const rawLabels = (this.sharedState.chart.datasets.labels ?? []).map(l => l.replace(/_/g, " ").trim());
                                const rawSets = this.sharedState.chart.datasets.sets ?? [];
                                const selectedType = activeViz?.selectedType ?? "Bar";
                                const showXYAxis = (selectedType === "Bar" || selectedType === "Line") && rawLabels.length >= 1;
                                const showCategoryAxis = selectedType === "Polar Area" && rawLabels.length >= 1;
                                const showYAxisOnly = (selectedType === "Pie" || selectedType === "Doughnut") && rawLabels.length >= 1;
                                const showRadarSpokes = selectedType === "Radar" && rawLabels.length >= 1;
                                if (!showXYAxis && !showCategoryAxis && !showYAxisOnly && !showRadarSpokes) return "";

                                const currentXAxis = activeViz?.xAxisIndex ?? -1;
                                const ROW_LABELS = "Row Labels";
                                const COL_LABELS = "Column Labels";
                                const xAxisOptions = [ROW_LABELS, COL_LABELS, ...rawLabels];
                                let currentXValue: string;
                                if (currentXAxis === -2) currentXValue = COL_LABELS;
                                else if (currentXAxis < 0) currentXValue = ROW_LABELS;
                                else currentXValue = rawLabels[Math.min(currentXAxis, rawLabels.length - 1)] ?? ROW_LABELS;

                                // Compute available Y series for bar/line/pie/doughnut
                                let availableYSeries: string[] = [];
                                if (showXYAxis || showYAxisOnly) {
                                  if (currentXAxis === -2) {
                                    availableYSeries = rawSets.map((s) => s.name.replace(/_/g, " ").trim());
                                  } else if (currentXAxis < 0) {
                                    availableYSeries = [...rawLabels];
                                  } else {
                                    const xIdx = Math.min(currentXAxis, rawLabels.length - 1);
                                    availableYSeries = rawLabels.filter((_, i) => i !== xIdx);
                                  }
                                }

                                const currentYColumns = (activeViz?.yColumns ?? []).map(c => c.replace(/_/g, " ").trim());
                                const validYColumns = currentYColumns.filter((c) => availableYSeries.includes(c));
                                const selectedYSeries = validYColumns.length > 0 ? validYColumns : [];

                                const currentXCategories = (activeViz?.xCategories ?? []).map(c => c.replace(/_/g, " ").trim());

                                const availableSpokes = [...rawLabels];
                                const validSpokes = currentXCategories.filter((s) => availableSpokes.includes(s));
                                const selectedSpokes = validSpokes.length > 0 ? validSpokes : [];

                                const xAxisLabel = showCategoryAxis ? msg("Selected Series") : showYAxisOnly ? msg("Segments") : msg("X-Axis");
                                const xAxisIcon = showCategoryAxis ? IconTableShortcut : showYAxisOnly ? IconPercentage80 : IconAxisX;
                                const yAxisLabel = showYAxisOnly ? msg("Levels") : msg("Selected Series");
                                const yAxisIcon = showYAxisOnly ? IconTarget : IconTableShortcut;

                                return html`
                                  <div class="viz-type-divider"></div>

                                  ${showRadarSpokes ? html`
                                    <span class="viz-type-label">${msg("Spokes")}</span>
                                    ${keyed(availableSpokes.join('|'), html`<sl-select
                                      class="select-axis"
                                      size="small"
                                      title=${msg("Spokes")}
                                      ?multiple=${true}
                                      max-options-visible="2"
                                      placeholder=${msg("All spokes")}
                                      clearable
                                      .value=${selectedSpokes.map(s => String(availableSpokes.indexOf(s))).filter(i => i !== "-1")}
                                      ?disabled=${!canChangeOptions}
                                      hoist
                                      @sl-change=${(e: Event) => {
                                        if (!activeViz) return;
                                        const sl = e.target as any;
                                        const values: string[] = Array.isArray(sl.value) ? sl.value : [sl.value];
                                        const selected = values.map(v => availableSpokes[Number(v)]).filter(Boolean);
                                        this.changeVizXCategories(activeViz.id, selected);
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
                                      .selectOptions=${xAxisOptions}
                                      .value=${currentXValue}
                                      ?disabled=${!canChangeOptions}
                                      @wwci-change=${(e: CustomEvent) => {
                                        if (!activeViz) return;
                                        const val = e.detail.value;
                                        if (val === ROW_LABELS) this.changeVizXAxis(activeViz.id, -1);
                                        else if (val === COL_LABELS) this.changeVizXAxis(activeViz.id, -2);
                                        else {
                                          const idx = rawLabels.indexOf(val);
                                          if (idx >= 0) this.changeVizXAxis(activeViz.id, idx);
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
                                        placeholder=${msg("All series")}
                                        clearable
                                        .value=${selectedYSeries.map(s => String(availableYSeries.indexOf(s))).filter(i => i !== "-1")}
                                        ?disabled=${!canChangeOptions}
                                        hoist
                                        @sl-change=${(e: Event) => {
                                          if (!activeViz) return;
                                          const sl = e.target as any;
                                          const values: string[] = Array.isArray(sl.value) ? sl.value : [sl.value];
                                          const selected = values.map(v => availableYSeries[Number(v)]).filter(Boolean);
                                          this.changeVizYColumns(activeViz.id, selected);
                                        }}
                                      >
                                        <sl-icon slot="prefix" src=${yAxisIcon}></sl-icon>
                                        ${availableYSeries.map((s, i) => html`<sl-option value=${String(i)}>${s}</sl-option>`)}
                                      </sl-select>`)}
                                    ` : ""}
                                  `}
                                `;
                              })()}
                            `}
                      </div>

                      ${isFixedScatterplotTab ? (() => {
                        const opts = this.sharedState.chart.options ?? {};
                        const locked = this.sharedState.chart.optionsLocked ?? {};
                        const mayChange = (key: string) =>
                          this.sharedState.editable ||
                          (this.sharedState.teacherOptions.changeOptions && !locked[key]);
                        const regressionType = this.sharedState.regressionType;
                        const warning = this.regressionPointsWarning();
                        return html`
                          <div class="viz-type-row analysis-row">
                            <span class="viz-type-label">${msg("Regression Model")}</span>
                            
                            <sl-select
                              class="select-regression"
                              size="small"
                              title=${msg("Regression Model")}
                              .value=${regressionType}
                              ?disabled=${!mayChange("listRegressionLine")}
                              hoist
                              @sl-change=${(e: Event) => {
                                e.stopPropagation();
                                this.sharedState = {
                                  ...this.sharedState,
                                  regressionType: (e.target as any).value,
                                };
                              }}
                            >
                              <sl-icon slot="prefix" src=${IconRegexOff}></sl-icon>
                              ${availableRegressions.map(
                                (r) => html`<sl-option value=${r}>${r}</sl-option>`
                              )}
                            </sl-select>

                            ${warning ? html`
                              <sl-tooltip hoist content=${warning}>
                                <span class="analysis-warning">⚠</span>
                              </sl-tooltip>` : ""}
                            <sl-checkbox
                              size="small"
                              ?checked=${Boolean(opts.showCorrelation)}
                              ?disabled=${regressionType === "none" || !mayChange("showCorrelation")}
                              @sl-change=${(e: Event) =>
                                this.setScatterOption("showCorrelation", (e.target as any).checked)}
                            >${msg("Show Correlation")}</sl-checkbox>
                            <sl-checkbox
                              size="small"
                              ?checked=${Boolean(opts.showOutliers)}
                              ?disabled=${regressionType === "none" || !mayChange("showOutliers")}
                              @sl-change=${(e: Event) =>
                                this.setScatterOption("showOutliers", (e.target as any).checked)}
                            >${msg("Show Outliers")}</sl-checkbox>
                          </div>`;
                      })() : ""}

                      <div id="display-chart" class="chart-display-wrap">
                        ${(() => {
                          const ls = this.sharedState.chart.datasets.labels ?? [];
                          const validScatterAxes = ls.length >= 2 && this.scatterXAxis !== this.scatterYAxis;

                          return html`
                            <div class="chart-host-wrap"
                                 style="display:${isFixedScatterplotTab && validScatterAxes ? 'block' : 'none'};">
                              <scatter-chart-js
                                style="display:block; width:100%; height:100%;"
                                .datasets=${this.sharedState.chart.datasets}
                                .xAxisIndex=${this.scatterXAxis}
                                .yAxisIndex=${this.scatterYAxis}
                                label=${this.sharedState.chart.title}
                                .sharedState=${this.sharedState}
                                .lang=${this.lang}
                                @wwci-state-change=${this.onStateChange}
                              ></scatter-chart-js>
                            </div>

                            ${isFixedScatterplotTab && !validScatterAxes ? html`
                              <div class="chart-empty-state">
                                ${msg("Please select two different values for X and Y axis.")}
                              </div>
                            ` : ""}

                            ${!isFixedScatterplotTab ? (() => {
                              const _xai = activeViz?.xAxisIndex ?? -1;
                              const chartXAxis = _xai < 0
                                ? _xai
                                : Math.min(_xai, (this.sharedState.chart.datasets.labels?.length ?? 1) - 1);
                              const _cRawLabels = (this.sharedState.chart.datasets.labels ?? []).map(l => l.replace(/_/g, " ").trim());
                              const _cRawSets = (this.sharedState.chart.datasets.sets ?? []) as any[];
                              const _cAvailSeries = _xai === -2
                                ? _cRawSets.map((s) => s.name.replace(/_/g, " ").trim())
                                : [..._cRawLabels];
                              const chartYColumns = (activeViz?.yColumns ?? []).map(c => c.replace(/_/g, " ").trim()).filter((c) => _cAvailSeries.includes(c));
                              const chartXCategories = (activeViz?.xCategories ?? []).map(c => c.replace(/_/g, " ").trim()).filter((s) => _cRawLabels.includes(s));
                              const chartScaleLabel = activeViz?.scaleLabel ?? "";
                              const chartKey = `${activeViz?.id ?? "default"}-${activeViz?.selectedType ?? "Bar"}`;
                              return keyed(
                                chartKey,
                                getChart(
                                  activeViz?.selectedType ?? "Bar",
                                  this.sharedState.chart.datasets,
                                  this.sharedState.chart.title,
                                  this.sharedState.chart.options,
                                  this.sharedState.teacherOptions,
                                  this.onStateChange,
                                  this.sharedState,
                                  chartXAxis,
                                  chartYColumns,
                                  chartXCategories,
                                  chartScaleLabel,
                                )
                              );
                            })() : ""}
                          `;
                        })()}
                      </div>
                    `
                  : html`
                      <div class="chart-empty-state">
                        ${msg("Please add data first to display the graph.")}
                      </div>
                    `}
              </div>
            `;
        })()}
      </div>
    `;
  }
}
