import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { addAlphaToRGB, chartOption } from "../../utils";
import { ChartHelper, CHART_PALETTE, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const RADAR_OPTIONS = {
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  pointRadius: chartOption("number", 3, "Point Radius", 0, 10),
  fill: chartOption("boolean", false, "Fill"),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

declare global {
  interface HTMLElementTagNameMap { "radar-chart": RadarChart; }
}

@customElement("radar-chart")
export class RadarChart extends GenericChart<typeof RADAR_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"radar", number[], string>> | undefined;

  protected getOptionDefinition() { return RADAR_OPTIONS; }

  // xAxisIndex < 0: row names as series labels, all columns as spokes.
  // xAxisIndex >= 0: values from that column as series labels, remaining columns as spokes.
  private buildChartData() {
    const { labels, sets } = this.datasets ?? {};
    if (!labels?.length || !sets?.length) return { radarLabels: [] as string[], datasets: [] as any[] };
    const opts = this.sharedState.chart.options;

    const makeDataset = (rowLabel: string, data: number[], rowIdx: number) => {
      const color = CHART_PALETTE[rowIdx % CHART_PALETTE.length];
      return {
        label: rowLabel,
        data,
        backgroundColor: addAlphaToRGB(color, 0.2), 
        pointBackgroundColor: color,
        borderColor: color,
        borderWidth: Number(opts.borderWidth ?? 1),
        pointBorderColor: "transparent",
        pointRadius: Number(opts.pointRadius ?? 3),
        pointHitRadius: 20,
      };
    };

    let radarLabels: string[];
    let datasets: ReturnType<typeof makeDataset>[];

    const normLabel = (s: string) => s.replace(/_/g, " ").trim();
    if (this.xAxisIndex < 0) {
      radarLabels = labels.map(normLabel);
      datasets = sets.map((set, rowIdx) =>
        makeDataset(set.name, labels.map((_, ci) => Number(set.data[ci]) || 0), rowIdx)
      );
    } else {
      const xIdx = Math.max(0, Math.min(this.xAxisIndex, labels.length - 1));
      const yColIndexes = Array.from({ length: labels.length }, (_, i) => i).filter((i) => i !== xIdx);
      radarLabels = yColIndexes.map((i) => normLabel(labels[i]));
      datasets = sets.map((set, rowIdx) =>
        makeDataset(
          String(set.data[xIdx]),
          yColIndexes.map((ci) => Number(set.data[ci]) || 0),
          rowIdx
        )
      );
    }

    if (this.xCategories?.length) {
      const norm = (s: string) => s.replace(/_/g, " ").trim();
      const catNorm = this.xCategories.map(norm);
      const keepIdxs = radarLabels.reduce((acc: number[], label, i) => {
        if (catNorm.includes(norm(label))) acc.push(i);
        return acc;
      }, []);
      radarLabels = keepIdxs.map((i) => radarLabels[i]);
      datasets = datasets.map((ds) => ({ ...ds, data: keepIdxs.map((i) => ds.data[i]) }));
    }

    datasets.sort((a, b) => {
      const sum = (ds: typeof a) => (ds.data as number[]).reduce((s, v) => s + (v || 0), 0);
      return sum(b) - sum(a);
    });

    const n = datasets.length;
    const baseAlpha = opts.fill ? 0.7 : 0.2;
    const minAlpha  = opts.fill ? 0.35 : 0.08;
    datasets.forEach((ds, idx) => {
      const alpha = n > 1 ? baseAlpha - (idx / (n - 1)) * (baseAlpha - minAlpha) : baseAlpha;
      ds.backgroundColor = addAlphaToRGB(ds.borderColor as string, alpha);
    });

    return { radarLabels, datasets };
  }

  firstUpdated() {
    const { radarLabels, datasets } = this.buildChartData();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "radar",
      data: { labels: radarLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
      },
    });
    this.chartHelper = ChartHelper.create("radar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(this.sharedState.chart.options.smoothTheLine as boolean);
    this.chartHelper.setRScalePadding();
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    const { radarLabels, datasets } = this.buildChartData();
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(opts.smoothTheLine as boolean);
    this.chartHelper.setXLabels(radarLabels);
    updateData(datasets, this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }
}
