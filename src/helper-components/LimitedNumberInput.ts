import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("wwci-limited-number-input")
export class NumberInput extends LitElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  min = Number.MIN_SAFE_INTEGER;

  @property({ type: Number })
  max = Number.MAX_SAFE_INTEGER;

  @property({ type: String })
  label = "";

  @property({ type: Boolean })
  disabled = false;

  inputEvent(e: any) {
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
      }),
    );
  }

  render() {
    return html` <sl-input
      type="number"
      label=${this.label}
      value=${this.value}
      ?disabled=${this.disabled}
      @sl-input=${this.inputEvent}
      sl-change=${this.inputEvent}
    ></sl-input>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-limited-number-input": NumberInput;
  }
}
