import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { addAlphaToRGB, chartOption } from "../../utils";
import { ChartHelper, CHART_PALETTE, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const RADAR_OPTIONS = {
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  pointRadius: chartOption("number", 1, "Point Radius", 0, 10),
  fill: chartOption("boolean", false, "Fill"),
  pointColors: chartOption("boolean", false, "Point Colors"),
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
        backgroundColor: opts.fill ? color : addAlphaToRGB(color, 0.2),
        pointBackgroundColor: color,
        borderColor: color,
        borderWidth: Number(opts.borderWidth ?? 1),
        pointBorderColor: "transparent",
        pointRadius: Number(opts.pointRadius ?? 0),
      };
    };

    let radarLabels: string[];
    let datasets: ReturnType<typeof makeDataset>[];

    if (this.xAxisIndex < 0) {
      radarLabels = [...labels];
      datasets = sets.map((set, rowIdx) =>
        makeDataset(set.name, labels.map((_, ci) => Number(set.data[ci]) || 0), rowIdx)
      );
    } else {
      const xIdx = Math.max(0, Math.min(this.xAxisIndex, labels.length - 1));
      const yColIndexes = Array.from({ length: labels.length }, (_, i) => i).filter((i) => i !== xIdx);
      radarLabels = yColIndexes.map((i) => labels[i]);
      datasets = sets.map((set, rowIdx) =>
        makeDataset(
          String(set.data[xIdx]),
          yColIndexes.map((ci) => Number(set.data[ci]) || 0),
          rowIdx
        )
      );
    }

    // Filter spokes to only those in xCategories (if set)
    if (this.xCategories?.length) {
      const keepIdxs = radarLabels.reduce((acc: number[], label, i) => {
        if (this.xCategories.includes(label)) acc.push(i);
        return acc;
      }, []);
      radarLabels = keepIdxs.map((i) => radarLabels[i]);
      datasets = datasets.map((ds) => ({ ...ds, data: keepIdxs.map((i) => ds.data[i]) }));
    }

    // Render highest-value datasets first (behind) so smaller values stay visible on top
    datasets.sort((a, b) => Math.max(...b.data) - Math.max(...a.data));

    return { radarLabels, datasets };
  }

  firstUpdated() {
    const { radarLabels, datasets } = this.buildChartData();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "radar",
      data: { labels: radarLabels, datasets },
      options: { responsive: true, maintainAspectRatio: false },
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
