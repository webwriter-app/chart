import { customElement, state } from "lit/decorators.js";
import Chart from "chart.js/auto";
import { chartOption } from "../../utils";
import { ChartHelper, LINE_PALETTE, getContext, updateData } from "./chart-helpers";
import { GenericChart } from "./chart-base";

const LINE_OPTIONS = {
  borderWidth: chartOption("number", 2, "Line Width", 0, 5),
  pointRadius: chartOption("number", 3, "Point Size", 0, 10),
  dynamicSize: chartOption("boolean", true, "Dynamic Scalling"),
  scaleMin: chartOption("number", 0, "Scale Min", Infinity, Infinity),
  scaleMax: chartOption("number", 100, "Scale Max", Infinity, Infinity),
  scaleStepSize: chartOption("number", 5, "Step Size", Infinity, Infinity),
  smoothTheLine: chartOption("boolean", false, "Smooth The Line"),
};

declare global {
  interface HTMLElementTagNameMap { "line-chart": LineChart; }
}

@customElement("line-chart")
export class LineChart extends GenericChart<typeof LINE_OPTIONS> {
  @state()
  accessor chartHelper: ChartHelper<Chart<"line", number[], string>> | undefined;

  protected getOptionDefinition() { return LINE_OPTIONS; }

  firstUpdated() {
    const { xLabels } = this.transformByXAxis();
    const opts = this.sharedState.chart.options;
    const ctx = getContext(this);
    const chart = new Chart(ctx, {
      type: "line",
      data: { labels: xLabels, datasets: this.prepareDataset() },
      options: { responsive: true, maintainAspectRatio: false },
    });
    // @ts-ignore
    this.chartHelper = ChartHelper.create("line", chart);
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(opts.smoothTheLine as boolean);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number,
    );
    this.chartHelper.update();
  }

  updated(): void {
    if (!this.chartHelper) return;
    const opts = this.sharedState.chart.options;
    const { xLabels } = this.transformByXAxis();
    this.chartHelper.setTitle(this.label);
    this.chartHelper.setLineSmooth(opts.smoothTheLine as boolean);
    this.chartHelper.setYScales(
      opts.dynamicSize as boolean,
      opts.scaleMin as number,
      opts.scaleMax as number,
      opts.scaleStepSize as number,
    );
    this.chartHelper.setXLabels(xLabels);
    updateData(this.prepareDataset(), this.chartHelper.chart.data.datasets);
    this.chartHelper.update();
  }

  private prepareDataset() {
    const opts = this.sharedState.chart.options;
    const { columns } = this.transformByXAxis();
    return columns.map((col, i) => {
      const color = col.color ?? LINE_PALETTE[i % LINE_PALETTE.length];
      return {
        label: col.label,
        data: col.data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: Number(opts.borderWidth ?? 1),
        pointBorderColor: "transparent",
        pointRadius: Number(opts.pointRadius ?? 0),
      };
    });
  }
}
