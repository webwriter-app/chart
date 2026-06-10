import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { converter } from "../../utils";
import { ChartDataSets } from "../../state/models";
import StateComponent from "../../stateful-component";

export class GenericChart<
  T extends Record<string, OptionDef<keyof TypeMapping>>
> extends StateComponent {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }
  `;
  @property({ type: Array, converter })
  accessor datasets: ChartDataSets = {} as any;

  @property({ type: String })
  accessor label = "";

  @property({ type: Boolean, converter })
  accessor hide_excat_values: boolean = false;

  @property({ type: Object, converter })
  accessor optionsDefinition: T = {} as T;

  @property({ type: Number })
  accessor xAxisIndex: number = -1;

  @property({ type: Array, converter })
  accessor yColumns: string[] = [];

  @property({ type: Array, converter })
  accessor xCategories: string[] = [];

  @property({ type: String })
  accessor scaleLabel: string = "";

  // xAxisIndex = -2  → column names as X-axis, each row is a Y-dataset (original grouped behavior)
  // xAxisIndex = -1  → row names as X-axis, each column is a Y-dataset
  // xAxisIndex >= 0  → values from that column as X-axis, remaining columns as Y-datasets
  protected transformByXAxis(): {
    xLabels: string[];
    columns: Array<{ label: string; data: number[]; colIdx: number; color?: string; colors?: string[] }>;
  } {
    const { labels, sets } = this.datasets ?? {};
    if (!labels?.length || !sets?.length) return { xLabels: [], columns: [] };

    let xLabels: string[];
    let columns: Array<{ label: string; data: number[]; colIdx: number; color?: string; colors?: string[] }>;

    const normLabel = (s: string) => s.replace(/_/g, " ").trim();

    if (this.xAxisIndex === -2) {
      xLabels = labels.map(normLabel);
      columns = sets.map((set, i) => ({
        label: set.name,
        data: labels.map((_, j) => Number(set.data[j]) || 0),
        colIdx: i,
        color: set.color,
        colors: set.colors as string[],
      }));
    } else if (this.xAxisIndex < 0) {
      xLabels = sets.map((set) => set.name);
      columns = labels.map((label, colIdx) => ({
        label: normLabel(label),
        data: sets.map((set) => Number(set.data[colIdx]) || 0),
        colIdx,
      }));
    } else {
      const xIdx = Math.max(0, Math.min(this.xAxisIndex, labels.length - 1));
      xLabels = sets.map((set) => String(set.data[xIdx]));
      const yColIndexes = Array.from({ length: labels.length }, (_, i) => i).filter((i) => i !== xIdx);
      columns = yColIndexes.map((colIdx) => ({
        label: normLabel(labels[colIdx]),
        data: sets.map((set) => Number(set.data[colIdx]) || 0),
        colIdx,
      }));
    }

    if (this.yColumns?.length) {
      // Normalize underscores→spaces (WebWriter attribute serialization corrupts spaces)
      const norm = (s: string) => s.replace(/_/g, " ").trim();
      const yNorm = this.yColumns.map(norm);
      columns = columns.filter((col) => yNorm.includes(norm(col.label)));
    }

    // Deduplicate xLabels: merge rows with the same label (case-insensitive), summing values
    if (xLabels.length > 0) {
      const keyIdx = new Map<string, number>();
      const uniqueLabels: string[] = [];
      const mergedData: number[][] = columns.map(() => []);
      xLabels.forEach((label, i) => {
        const key = label.toLowerCase().trim();
        if (!keyIdx.has(key)) {
          keyIdx.set(key, uniqueLabels.length);
          uniqueLabels.push(label);
          columns.forEach((_, ci) => { mergedData[ci].push(0); });
        }
        const j = keyIdx.get(key)!;
        columns.forEach((col, ci) => { mergedData[ci][j] += col.data[i] ?? 0; });
      });
      if (uniqueLabels.length < xLabels.length) {
        xLabels = uniqueLabels;
        columns = columns.map((col, ci) => ({ ...col, data: mergedData[ci] }));
      }
    }

    if (this.xCategories?.length) {
      const norm = (s: string) => s.replace(/_/g, " ").trim();
      const catNorm = this.xCategories.map(norm);
      const keepIdxs = xLabels.reduce((acc: number[], label, i) => {
        if (catNorm.includes(norm(label))) acc.push(i);
        return acc;
      }, []);
      xLabels = keepIdxs.map((i) => xLabels[i]);
      columns = columns.map((col) => ({
        ...col,
        data: keepIdxs.map((i) => col.data[i]),
      }));
    }

    return { xLabels, columns };
  }

  // Subclasses override this to declare their chart options. The base class
  // handles merging defaults into sharedState on connectedCallback.
  protected getOptionDefinition(): Record<string, OptionDef<any>> {
    return {};
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.sharedState?.chart) return;
    const optDef = this.getOptionDefinition();
    if (Object.keys(optDef).length === 0) return;
    this.sharedState.chart.optionDefinition = optDef;
    this.sharedState.chart.options = Object.entries(optDef).reduce(
      (acc: Record<string, any>, [key, value]) => {
        acc[key] = this.sharedState.chart.options?.[key] ?? value.default;
        return acc;
      },
      {}
    ) as any;
    this.requestUpdate();
  }

  exportCanvasContent() {
    const canvas = this.shadowRoot?.getElementById("chart-canvas") as
      | HTMLCanvasElement
      | undefined;
    if (!canvas) return "";
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    return canvas.toDataURL();
  }

  render() {
    return html`<canvas id="chart-canvas"></canvas>`;
  }
}
