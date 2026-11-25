import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { widgetPermissions } from "@webwriter/lit/permissions";
import { property } from "lit/decorators.js";
import { ChartState } from "../model/models";

export class StateComponent extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  readonly #permissions = widgetPermissions(this);
  @property({ type: Object })
  accessor sharedState: ChartState;

  /** True in edit mode, as the surrounding widget's Permissions answer it. */
  protected get editing() {
    return this.#permissions.editing;
  }

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
