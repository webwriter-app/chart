import { html } from "lit";
import { property } from "lit/decorators.js";
import { converter } from "../../utils";
import { ChartDataSets } from "../../chart-models";
import StateComponent from "../../stateful-component";

/**WebWriter API: Minimal base class for a widget implemented in Lit. Implements the core properties required by WebWriter, initializes the component when loaded and provides a Scoped Custom Element Registry (@open-wc/scoped-elements) to help with namespace conflicts when using other components in this widget. */
export class GenericChart<
  T extends Record<string, OptionDef<keyof TypeMapping>>
> extends StateComponent {
  @property({ type: Array, converter })
  accessor datasets: ChartDataSets = {} as any;

  @property({ type: String })
  accessor label = "";

  @property({ type: Boolean, converter })
  accessor hide_excat_values: boolean = false;

  @property({ type: Object, converter })
  accessor optionsDefinition: T = {} as T;

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
}
