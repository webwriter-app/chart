import { html } from "lit";
import { property } from "lit/decorators.js";
import { converter } from "../../utils";
import { ChartDataSets } from "../../state/models";
import StateComponent from "../../stateful-component";

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
