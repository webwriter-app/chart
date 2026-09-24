import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { addAlphaToRGB, chartOption } from "../../utils";
import { ChartHelper, CHART_PALETTE, getContext, updateData, makeCircularLegendCallbacks } from "./chart-helpers";
import { createHtmlLegendPlugin } from "./html-legend";
import { GenericChart } from "./chart-base";

const POLAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scaling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 10, "Step Size", 1, undefined),
};

declare global {
  interface HTMLElementTagNameMap { "polar-chart": PolarChart; }
}

@customElement("polar-chart")
export class PolarChart extends GenericChart<typeof POLAR_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"polarArea", number[], string>> | undefined;

  protected getOptionDefinition() { return POLAR_OPTIONS; }
  
  private buildPolarData(): { sectorLabels: string[]; sectorData: number[] } {
    const { labels, sets } = this.datasets ?? {};
    if (!labels?.length || !sets?.length) return { sectorLabels: [], sectorData: [] };
    const norm = (s: string) => s.replace(/_/g, " ").trim();

    let sectorLabels: string[];
    let sectorData: number[];

    if (this.xAxisIndex === -2) {
      sectorLabels = labels.map(norm);
      sectorData = labels.map((_, ci) =>
        sets.reduce((sum, set) => sum + (Number(set.data[ci]) || 0), 0)
      );
    } else if (this.xAxisIndex >= 0) {
      const xIdx = Math.max(0, Math.min(this.xAxisIndex, labels.length - 1));
      sectorLabels = sets.map((set) => norm(set.name));
      sectorData = sets.map((set) => Number(set.data[xIdx]) || 0);
    } else {
      sectorLabels = sets.map((set) => norm(set.name));
      sectorData = sets.map((set) =>
        labels.reduce((sum, _, ci) => sum + (Number(set.data[ci]) || 0), 0)
      );
    }

    if (this.xCategories?.length) {
      const catNorm = this.xCategories.map(norm);
      const keepIdxs = sectorLabels.reduce((acc: number[], label, i) => {
        if (catNorm.includes(norm(label))) acc.push(i);
        return acc;
      }, []);
      sectorLabels = keepIdxs.map((i) => sectorLabels[i]);
      sectorData = keepIdxs.map((i) => sectorData[i]);
    }

    return { sectorLabels, sectorData };
  }

  firstUpdated() {
    const { sectorLabels, sectorData } = this.buildPolarData();
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "polarArea",
      data: { labels: sectorLabels, datasets: this.prepareDataset(sectorData) },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 8 },
        plugins: { legend: makeCircularLegendCallbacks() },
        interaction: { mode: "nearest", intersect: false, axis: "r" } as any,
      },
      plugins: [createHtmlLegendPlugin(() => this.shadowRoot?.getElementById("html-legend"))],
    });
    const opts0 = this.sharedState.chart.options;
    this.chartHelper = ChartHelper.create("polarArea", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setRScales(
      opts0.dynamicSize !== false,
      Number(opts0.scaleMin ?? 0),
      Number(opts0.scaleMax ?? 100),
      Number(opts0.scaleStepSize ?? 10),
      this.scaleLabel
    );
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    const { sectorLabels, sectorData } = this.buildPolarData();
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setRScales(
      opts.dynamicSize !== false,
      Number(opts.scaleMin ?? 0),
      Number(opts.scaleMax ?? 100),
      Number(opts.scaleStepSize ?? 10),
      this.scaleLabel
    );
    this.chartHelper.setXLabels(sectorLabels);
    updateData(this.prepareDataset(sectorData), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset(sectorData: number[]) {
    const opts = this.sharedState.chart.options;
    const borderWidth = Number(opts.borderWidth ?? 1);
    return [{
      data: sectorData,
      backgroundColor: sectorData.map((_, si) => CHART_PALETTE[si % CHART_PALETTE.length] + "33"),
      borderColor: sectorData.map((_, si) => CHART_PALETTE[si % CHART_PALETTE.length]),
      hoverBackgroundColor: sectorData.map((_, si) =>
        addAlphaToRGB(CHART_PALETTE[si % CHART_PALETTE.length], 0.7)
      ),
      hoverBorderWidth: borderWidth + 1,
      borderWidth,
      borderRadius: Number(opts.borderRadius ?? 0),
    }];
  }
}
