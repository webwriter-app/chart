import { html } from "lit";
import { property } from "lit/decorators.js";
import { LitElementWw } from "@webwriter/lit";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.component.js";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-switch": ToggleSwitch;
  }
}

export class ToggleSwitch extends LitElementWw {
  @property({ type: Boolean })
  accessor checked: boolean = false;

  @property({ type: Boolean })
  accessor disabled: boolean = false;

  static scopedElements = { "sl-switch": SlSwitch };

  private handleToggleChange(e: Event) {
    this.checked = (e.target as SlSwitch).checked;
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.checked },
        composed: true,
        bubbles: true,
      })
    );
  }

  render() {
    return html`
      <sl-switch ?checked=${this.checked} ?disabled=${this.disabled} @sl-change=${this.handleToggleChange}>
        <slot></slot>
      </sl-switch>
    `;
  }
}
