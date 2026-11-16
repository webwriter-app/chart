import { html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { LitElementWw } from "@webwriter/lit";
import { Permissions } from "@webwriter/lit/permissions";
import { str, type MsgFn } from "@lit/localize";
import { localizer } from "@webwriter/lit/localize";
import { jsonData } from "@webwriter/lit/data";
import { Shortcuts } from "@webwriter/lit/shortcuts";
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes";

// Components
import { DatasetInput } from "../components/dataset-input";
import { ChartSettingsPanel } from "../components/chart-settings-panel";
import { renderChartTabs, SCATTER_TAB_ID } from "../components/chart-tabs";
import { renderChartPanel, renderDataPanel } from "../components/chart-panels";
import { OptionSelect } from "../components/controls/option-select";

// Shoelace Components & Styles
import style from "../components/webwriter-chart.styles";
import "@shoelace-style/shoelace/dist/themes/light.css";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlTabGroup from "@shoelace-style/shoelace/dist/components/tab-group/tab-group.component.js";
import SlTab from "@shoelace-style/shoelace/dist/components/tab/tab.component.js";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";

// Icons
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";

// Charts & types
import { getOptionsDefinition, normalizeChartType } from "../components/charts/chart-registry";
import type { ChartType } from "../components/charts/chart-registry";
import { BarChart } from "../components/charts/bar-chart";
import { DoughnutChart } from "../components/charts/doughnut-chart";
import { PieChart } from "../components/charts/pie-chart";
import { LineChart } from "../components/charts/line-chart";
import { PolarChart } from "../components/charts/polar-area-chart";
import { RadarChart } from "../components/charts/radar-chart";
import { ScatterChartJs } from "../components/charts/scatter-chart";
import type { ChartState, OptionDefinitions, OptionValues, Visualization } from "../model/models";
import {
  deriveFixedScatterDatasets,
  migrateLegacyScatterDatasets,
  normalizeColumnIndexesInput,
  normalizeColumnsInput,
} from "../model/scatter-data";

declare global {
  interface HTMLElementTagNameMap {
    "webwriter-chart": WebwriterChart;
  }
}

/**
 * An interactive data visualization widget with several chart types, CSV and Excel import, axis controls per visualization and a scatter plot with regression analysis.
 *
 * Authors enter or import data in the Data tab, then use the chart tabs to configure visualizations. Each chart tab has its own type and axis settings. The fixed Scatter plot tab lets learners drag points, draw lines and show regression models with correlation measures.
 *
 * The widget keeps its state (visualizations, data, options and the teacher options that decide what learners may change) in a JSON data block.
 *
 * Chart types: Pie, Doughnut, Bar, Line, Polar Area, Radar and the Scatter plot, all drawn with Chart.js. Spreadsheet files are read with SheetJS, which is loaded when the first file is imported.
 *
 * The Delete and Backspace keys remove the selected point or line of the scatter plot while it has the focus.
 */
@customElement("webwriter-chart")
export class WebwriterChart extends LitElementWw {
  static styles = style;

  static scopedElements = {
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

  // The Delete key removes the selection of the scatter plot; the action stays out of the drawer.
  static override actions = {
    configureChart: { label: (widget: { msg: MsgFn }) => widget.msg("Chart settings") },
    deleteSelection: { hidden: true, shortcut: ["Delete", "Backspace"] },
  };

  localize = localizer(this, {
    sourceLocale,
    targetLocales,
    prefer: { zh: "zh-Hans", no: "nb", pt: "pt-PT", sr: "sr-Cyrl", "sr-ijekavsk": "sr-Cyrl", cnr: "sr-Latn" },
    load: (locale) => import(`../../localization/generated/${locale}.ts`),
    drawer: true,
  });
  readonly msg = this.localize.msg;

  readonly #permissions = new Permissions(this);

  readonly #shortcuts = new Shortcuts(this);

  readonly #data = jsonData<Partial<ChartState>>(this, {
    defaults: {},
    changed: () => this.requestUpdate("sharedState", this.#merged?.state),
  });
  #merged?: { source: object; locale: string; state: ChartState };

  /** Whether a chart tab is active. */
  @property({ type: Boolean, attribute: true, reflect: true }) accessor showChart: boolean = false;
  /** Whether the Data tab is active. */
  @property({ type: Boolean, attribute: true, reflect: true }) accessor showData: boolean = true;

  /** Column index of the x axis of the Scatter plot tab. */
  @property({ type: Number, attribute: "scatter-x", reflect: true })
  accessor scatterXAxis: number = 0;

  /** Column index of the y axis of the Scatter plot tab. */
  @property({ type: Number, attribute: "scatter-y", reflect: true })
  accessor scatterYAxis: number = 1;

  @state() accessor dataTabName = "Data";
  @state() accessor scatterplotTabName = "Scatter plot";
  @state() accessor editingVisualizationId: string | null = null;
  @state() accessor editingVisualizationName = "";

  get sharedState(): ChartState {
    const saved = this.#data.get();
    // Without a data block the defaults carry localized titles, so they follow the language.
    const locale = Object.keys(saved).length === 0 ? this.localize.getLocale() : "";
    if (this.#merged?.source !== saved || this.#merged.locale !== locale) {
      const defaults = this.defaultChartState();
      this.#merged = {
        source: saved,
        locale,
        state: {
          ...defaults,
          ...saved,
          teacherOptions: { ...defaults.teacherOptions, ...saved.teacherOptions },
          chart: { ...defaults.chart, ...saved.chart },
        },
      };
    }
    return this.#merged.state;
  }

  set sharedState(value: ChartState) {
    const { chart: { optionDefinition, ...chart }, ...authored } = value;
    const previous = this.#merged?.state;
    const next = { ...authored, chart } as Partial<ChartState>;
    const removed = Object.fromEntries(Object.keys(this.#data.get()).filter((key) => !(key in next)).map((key) => [key, undefined]));
    this.#data.set({ ...removed, ...next }, { force: this.#data.invalid });
    const saved = this.#data.get();
    this.#merged = { source: saved, locale: Object.keys(saved).length === 0 ? this.localize.getLocale() : "", state: value };
    this.requestUpdate("sharedState", previous);
  }

  private defaultChartState(): ChartState {
    return {
      teacherOptions: { showOptions: true, showData: true, showLockedOptions: true, changeData: true, changeOptions: true, addRemoveData: true },
      scatterDatasets: { title: this.msg("My scatter plot"), sets: [], selected: { axis: { x: "None", y: "None" }, dataset_indexes: [] } },
      regressionType: "none",
      scatterLines: [],
      visualizations: [{ id: "viz-1", name: this.msg(str`Chart ${1}`), selectedType: "Bar" }],
      activeVisualizationId: "viz-1",
      chart: { selectedType: "Bar", title: this.msg("My Chart"), datasets: { labels: [], sets: [] }, options: {}, optionsLocked: {}, optionDefinition: {} },
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate("sharedState", undefined);
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

  protected firstUpdated(): void {
    this.tabIndex = -1;
  }

  protected override willUpdate(_changed: PropertyValues): void {
    super.willUpdate(_changed);

    if (this.showChart && this.showData) this.showData = false;

    const activeId = this.sharedState.activeVisualizationId;
    const vizs = this.sharedState.visualizations ?? [];
    if (
      activeId !== SCATTER_TAB_ID &&
      vizs.length > 0 &&
      !vizs.some((v) => v.id === activeId)
    ) {
      this.sharedState = { ...this.sharedState, activeVisualizationId: vizs[0].id };
    }

    if (
      _changed.has("sharedState") &&
      this.sharedState.activeVisualizationId === SCATTER_TAB_ID
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

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (!changedProperties.has("sharedState")) return;
    if (this.sharedState.activeVisualizationId === SCATTER_TAB_ID) {
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

  #scatter() {
    return this.renderRoot?.querySelector<ScatterChartJs>("scatter-chart-js") ?? null;
  }

  /** Declines the key unless the scatter plot holds the focus and a selection. */
  deleteSelection() {
    const scatter = this.#scatter();
    if (!scatter?.hasSelection || !scatter.matches(":focus-within")) return false;
    scatter.deleteSelection();
  }

  /** Moves the edits made in the scatter plot into the data table. */
  applyScatterChanges() {
    this.#scatter()?.applyToData();
  }

  configureChart() {
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>("#settings");
    if (dialog && !dialog.open) dialog.showModal();
  }

  normalizeColumns(value: unknown): string[] {
    return normalizeColumnsInput(value);
  }

  normalizeColumnIndexes(value: unknown, labels: string[]): number[] {
    return normalizeColumnIndexesInput(value, labels);
  }

  private syncFixedScatterplotFromChartData() {
    const nextScatterDatasets = deriveFixedScatterDatasets(this.sharedState, (index) => this.msg(str`Series ${index}`));
    if (JSON.stringify(nextScatterDatasets) !== JSON.stringify(this.sharedState.scatterDatasets)) {
      this.sharedState = { ...this.sharedState, scatterDatasets: nextScatterDatasets };
    }
  }

  private defaultOptions(definition: OptionDefinitions): OptionValues {
    return Object.fromEntries(Object.entries(definition).map(([key, def]) => [key, def.default]));
  }

  private refreshVisibleChart() {
    requestAnimationFrame(() => {
      const el = this.renderRoot.querySelector(
        "bar-chart, line-chart, pie-chart, doughnut-chart, polar-chart, radar-chart"
      ) as { refreshChart?: () => void } | null;
      el?.refreshChart?.();
    });
  }

  onStateChange = (e: CustomEvent) => {
    if (!e.detail || !e.detail.state) return;
    const incoming = e.detail.state;
    let nextState = { ...this.sharedState, ...incoming };

    if (incoming.chart?.options) {
      const activeVizId = this.sharedState.activeVisualizationId;
      const isScatter = activeVizId === SCATTER_TAB_ID;
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

  handleTabShow(e: CustomEvent) {
    const panelId = e.detail.name;
    if (panelId === "data") {
      this.showData = true;
      this.showChart = false;
    } else if (panelId === SCATTER_TAB_ID) {
      this.showData = false;
      this.showChart = true;
      const optDef = getOptionsDefinition("Scatter plot");
      // Merge existing option values with defaults so toggles reflect correct initial state
      const options = Object.entries(optDef).reduce((acc: OptionValues, [key, def]) => {
        acc[key] = this.sharedState.chart.options?.[key] !== undefined
          ? this.sharedState.chart.options[key]
          : def.default;
        return acc;
      }, {});
      this.sharedState = {
        ...this.sharedState,
        activeVisualizationId: SCATTER_TAB_ID,
        chart: {
          ...this.sharedState.chart,
          selectedType: "Scatter plot",
          optionDefinition: optDef,
          options,
        },
      };
      this.requestUpdate();
    } else {
      this.showData = false;
      this.showChart = true;
      this.switchVisualization(panelId);
      this.refreshVisibleChart();
    }
    requestAnimationFrame(() => window.getSelection()?.empty());
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
    const defaultOptions = this.defaultOptions(optDef);
    const newViz: Visualization = { id, name: this.msg(str`Chart ${vizs.length + 1}`), selectedType: defaultType, options: defaultOptions };
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
    const options = viz?.options ?? this.defaultOptions(optionDefinition);
    this.sharedState = {
      ...this.sharedState,
      activeVisualizationId: id,
      chart: { ...this.sharedState.chart, selectedType, optionDefinition, options },
    };
    this.requestUpdate();
  }

  changeVizType(id: string, newType: ChartType) {
    const optionDefinition = getOptionsDefinition(newType);
    const defaultOptions = this.defaultOptions(optionDefinition);
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

  /** Changes fields of one visualization. */
  private patchViz(id: string, patch: Partial<Visualization>) {
    const updated: Visualization[] = (this.sharedState.visualizations ?? []).map((v) => (v.id === id ? { ...v, ...patch } : v));
    this.sharedState = { ...this.sharedState, visualizations: updated };
    this.requestUpdate();
  }

  changeVizColumns(id: string, columns: unknown) {
    this.patchViz(id, { visibleColumns: this.normalizeColumns(columns) });
  }

  changeVizXAxis(id: string, xIdx: number) {
    this.patchViz(id, { xAxisIndex: xIdx, yColumns: [], xCategories: [] });
  }

  changeVizYColumns(id: string, columns: string[]) {
    this.patchViz(id, { yColumns: columns });
  }

  changeVizXCategories(id: string, categories: string[]) {
    this.patchViz(id, { xCategories: categories });
  }

  changeVizScaleLabel(id: string, label: string) {
    this.patchViz(id, { scaleLabel: label });
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
  setScatterOption(key: string, value: string | number | boolean) {
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        options: { ...this.sharedState.chart.options, [key]: value },
      },
    };
  }

  startInlineTabRename(e: MouseEvent, id: string) {
    e.stopPropagation();
    const currentName =
      id === "data"
        ? this.dataTabName
        : id === SCATTER_TAB_ID
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
      } else if (editingId === SCATTER_TAB_ID) {
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
    const state = this.sharedState;
    const isScatterTab = state.activeVisualizationId === SCATTER_TAB_ID;
    const activeViz = isScatterTab
      ? undefined
      : state.visualizations?.find((v) => v.id === state.activeVisualizationId) ?? state.visualizations?.[0];

    if (isScatterTab) {
      state.chart.selectedType = "Scatter plot";
    } else if (activeViz) {
      state.chart.selectedType = normalizeChartType(activeViz.selectedType);
    } else {
      state.chart.selectedType = normalizeChartType(state.chart.selectedType ?? "Bar");
    }

    state.chart.optionDefinition = getOptionsDefinition(state.chart.selectedType);

    const editing = this.#permissions.editing;
    const canChangeOptions = editing || state.teacherOptions.changeOptions;
    const canAddRemoveData = editing || state.teacherOptions.addRemoveData;
    const hasChartData = (state.chart.datasets.labels?.length ?? 0) > 0;
    const showDataPanel = this.showData && (editing || state.teacherOptions.showData);
    return html`
      <dialog id="settings" aria-label=${this.msg("Chart settings")}>
        <form method="dialog"><button>${this.msg("Close")}</button></form>
        <div id="settings-wrapper">
          <wwci-chart-settings
            class="chart-settings-host"
            .sharedState=${state}
            .lang=${this.lang}
            @wwci-state-change=${this.onStateChange}
          ></wwci-chart-settings>
        </div>
      </dialog>

      <div
        id="main"
        @selectstart=${(e: Event) => e.stopPropagation()}
        @dragstart=${(e: Event) => e.stopPropagation()}
        @click=${() => this.dispatchEvent(new FocusEvent("focus", { bubbles: true }))}
      >
        ${renderChartTabs(this, isScatterTab)}
        ${renderDataPanel(this, showDataPanel, canAddRemoveData, hasChartData)}
        ${renderChartPanel(this, !showDataPanel, activeViz, isScatterTab, canChangeOptions, editing, hasChartData)}
      </div>
    `;
  }
}
