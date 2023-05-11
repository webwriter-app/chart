import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { converter } from "../functions";

import "@shoelace-style/shoelace/dist/components/switch/switch";

@customElement("wwci-switch")
export class Select extends LitElement {
  @property({ type: Boolean, converter })
  checked: boolean = false;

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
    if (this.checked)
      return html` <sl-switch checked @sl-change=${this.change}
        ><slot></slot
      ></sl-switch>`;
    else
      return html` <sl-switch @sl-change=${this.change}
        ><slot></slot
      ></sl-switch>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-switch": Select;
  }
}
