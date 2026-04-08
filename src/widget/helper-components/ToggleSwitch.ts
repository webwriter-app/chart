import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/components/switch/switch.js";
import { LitElementWw } from "@webwriter/lit";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-switch": ToggleSwitch;
  }
}

@customElement("wwci-switch")
export class ToggleSwitch extends LitElementWw {
@property({ type: Boolean })
  accessor checked: boolean = false;

@property({ type: Boolean })
  accessor disabled: boolean = false;

public static get scopedElements() {
    return {
      "sl-switch": SlSwitch,
    };
  }

handleToggleChange(e: any) {
    this.checked = e.target.checked;

    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.checked },
        composed: true,
        bubbles: true,
      })
    );
  }

render() {
    return html` <sl-switch
      ?checked=${this.checked}
      ?disabled=${this.disabled}
      @sl-change=${this.handleToggleChange}
      ><slot></slot
    ></sl-switch>`;
  }
}