import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/components/switch/switch.js";

@customElement("wwci-switch")
export class Select extends LitElement {
  @property({ type: Boolean })
  checked: boolean = false;

  @property({ type: Boolean })
  disabled: boolean = false;

  change(e: any) {
    this.checked = e.target.checked;

    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.checked },
        composed: true,
      })
    );
  }

  render() {
    return html` <sl-switch
      ?checked=${this.checked}
      ?disabled=${this.disabled}
      @sl-change=${this.change}
      ><slot></slot
    ></sl-switch>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-switch": Select;
  }
}
