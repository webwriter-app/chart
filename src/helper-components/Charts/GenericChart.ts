import { html } from "lit";
import { property } from "lit/decorators.js";
import { converter } from "../../functions";
import { SharedTestStateMixin } from "../../state";
import { ChartDataSets } from "../../interfaces";
import { LitElementWw } from "@webwriter/lit";

/**WebWriter API: Minimal base class for a widget implemented in Lit. Implements the core properties required by WebWriter, initializes the component when loaded and provides a Scoped Custom Element Registry (@open-wc/scoped-elements) to help with namespace conflicts when using other components in this widget. */
export class GenericChart<
  T extends Record<string, OptionDef<keyof TypeMapping>>
> extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  @property({ type: Array, converter })
  datasets: ChartDataSets = {} as any;

  @property({ type: String })
  label = "";

  @property({ type: Object, converter })
  options: ChartOptions<T> = {} as ChartOptions<T>;

  @property({ type: Boolean, converter })
  hide_excat_values: boolean = false;

  exportCanvasContent() {
    var canvas = this.shadowRoot?.getElementById("chart-canvas") as
      | HTMLCanvasElement
      | undefined;

    if (!canvas) return "";

    var ctx = canvas.getContext("2d");
    if (!ctx) return "";

    return canvas.toDataURL();
  }

  render() {
    return html`<canvas id="chart-canvas"></canvas>`;
  }
  //TODO: see fix This ChartTypeRegistry
  constructor(optionsDefinition: T) {
    super();
    this.sharedState.chart.options = Object.entries(optionsDefinition).reduce(
      (acc, [key, value]) => {
        acc[key] = this.sharedState.chart.options[key] ?? value.default;
        return acc;
      },
      {} as any
    ) as ChartOptions<T>;
  }
}
