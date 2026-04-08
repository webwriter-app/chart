import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import { LitElementWw } from "@webwriter/lit";
import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-limited-number-input": NumberField;
  }
}

@customElement("wwci-limited-number-input")
export class NumberField extends LitElementWw {
@property({ type: Number })
  accessor value = 0;

@property({ type: Number })
  accessor min = Number.MIN_SAFE_INTEGER;

@property({ type: Number })
  accessor max = Number.MAX_SAFE_INTEGER;

@property({ type: String })
  accessor label = "";

@property({ type: Boolean })
  accessor disabled = false;

public static get scopedElements() {
    return {
      "sl-input": SlInput,
    };
  }

handleInputChange(e: any) {
    const value = Number(e.target.value);
    this.value = value;

    if (isNaN(value)) this.value = 0;
    if (this.min !== undefined && value < this.min) this.value = this.min;
    if (this.max !== undefined && value > this.max) this.value = this.max;

    e.target.value = this.value;

    this.dispatchEvent(
      new CustomEvent("wwci-limited-number-input", {
        detail: { value: this.value },
        composed: true,
      })
    );
  }

render() {
    return html` <sl-input
      type="number"
      label=${this.label}
      value=${this.value}
      ?disabled=${this.disabled}
      @sl-input=${this.handleInputChange}
      @sl-change=${this.handleInputChange}
    ></sl-input>`;
  }
}