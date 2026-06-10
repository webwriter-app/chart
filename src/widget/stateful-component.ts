import { LitElementWw } from "@webwriter/lit";
import { property } from "lit/decorators.js";
import { ChartState } from "./state/models";

export default class StateComponent extends LitElementWw {
  @property({ type: Object })
  accessor sharedState: ChartState;

  dispatchStateChange() {
    this.dispatchEvent(
      new CustomEvent("wwci-state-change", {
        detail: { state: this.sharedState },
        bubbles: true, 
        composed: true, 
      })
    );
  }
}
