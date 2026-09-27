import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { ChartHelper, CHART_PALETTE, getContext, updateData } from "./chart-helpers";
import { createHtmlLegendPlugin } from "./html-legend";
import { GenericChart } from "./chart-base";
import { addAlphaToRGB, chartOption } from "../../utils";

const BAR_OPTIONS = {
  borderRadius: chartOption("number", 0, "Border Radius", 0, 10),
  borderWidth: chartOption("number", 1, "Border Width", 0, 5),
  filled: chartOption("boolean", false, "Filled"),
  dynamicSize: chartOption("boolean", true, "Dynamic Scaling"),
  scaleMin: chartOption("number", 0, "Scale Min", undefined, undefined),
  scaleMax: chartOption("number", 100, "Scale Max", undefined, undefined),
  scaleStepSize: chartOption("number", 5, "Step Size", 1, undefined),
};

declare global {
  interface HTMLElementTagNameMap { "bar-chart": BarChart; }
}

@customElement("bar-chart")
export class BarChart extends GenericChart<typeof BAR_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"bar", number[], string>> | undefined;

  protected getOptionDefinition() { return BAR_OPTIONS; }

  firstUpdated() {
    const { xLabels } = this.transformByXAxis();
    const opts = this.sharedState.chart.options;
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "bar",
      data: { labels: xLabels, datasets: this.prepareDataset() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false, axis: "x" },
      },
      plugins: [createHtmlLegendPlugin(() => this.shadowRoot?.getElementById("html-legend"))],
    });
    
    this.chartHelper = ChartHelper.create("bar", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number,
    );
    this.chartHelper.setHideExactValues(this.hide_excat_values);
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    const { xLabels } = this.transformByXAxis();
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number,
    );
    this.chartHelper.setHideExactValues(this.hide_excat_values);
    this.chartHelper.setXLabels(xLabels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    const { columns } = this.transformByXAxis();
    return columns.map((col, i) => {
      const color = col.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
      const borderWidth = Number(opts.borderWidth ?? 1);
      return {
        label: col.label,
        data: col.data,
        backgroundColor: col.data.map(() => addAlphaToRGB(color, opts.filled ? 1 : 0.2)),
        borderColor: col.data.map(() => color),
        hoverBackgroundColor: col.data.map(() => addAlphaToRGB(color, opts.filled ? 1 : 0.55)),
        hoverBorderColor: col.data.map(() => color),
        hoverBorderWidth: borderWidth + 1,
        borderWidth,
        borderRadius: Number(opts.borderRadius ?? 0),
      };
    });
  }
}
