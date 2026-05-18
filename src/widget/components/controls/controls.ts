// Consolidated UI controls: OptionSelect, ToggleSwitch, NumberField
import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { converter } from "../../utils";
import { LitElementWw } from "@webwriter/lit";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";

// ─── OptionSelect ────────────────────────────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap {
    "wwci-select": OptionSelect;
  }
}

@customElement("wwci-select")
export class OptionSelect extends LitElementWw {
  @property({ type: Array, converter })
  accessor selectOptions: Array<string> = [];

  @property()
  accessor label: string = "";

  @property()
  accessor placeholder: string = "";

  @property()
  accessor value: string = "";

  @property({ type: Number })
  accessor selectedIndex = 0;

  @property({ type: Boolean })
  accessor disabled: boolean = false;

  @property()
  accessor size: "small" | "medium" | "large" = "medium";

  public static get scopedElements() {
    return { "sl-select": SlSelect, "sl-option": SlOption };
  }

  private handleSelectChange(e: any) {
    this.selectedIndex = this.selectOptions.findIndex(
      (v) => e.target.value === toId(v)
    );
    this.value = this.selectOptions[this.selectedIndex];
    this.dispatchEvent(
      new CustomEvent("wwci-change", { detail: { value: this.value }, composed: true })
    );
  }

  render() {
    this.selectedIndex = this.value ? this.selectOptions.indexOf(this.value) : 0;
    return html`
      <sl-select
        size=${this.size}
        ?disabled="${this.disabled}"
        placeholder="${this.placeholder}"
        label="${this.label}"
        @sl-change="${this.handleSelectChange}"
        value=${toId(this.selectOptions[this.selectedIndex])}
        hoist
      >
        ${this.selectOptions.map(
          (option) => html`<sl-option value="${toId(option)}">${option}</sl-option>`
        )}
      </sl-select>
    `;
  }
}

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

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
    return { "sl-switch": SlSwitch };
  }

  private handleToggleChange(e: any) {
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
    return html`
      <sl-switch ?checked=${this.checked} ?disabled=${this.disabled} @sl-change=${this.handleToggleChange}>
        <slot></slot>
      </sl-switch>
    `;
  }
}

// ─── NumberField ──────────────────────────────────────────────────────────────

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
    return { "sl-input": SlInput };
  }

  private handleInputChange(e: any) {
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
    return html`
      <sl-input
        type="number"
        label=${this.label}
        value=${this.value}
        ?disabled=${this.disabled}
        @sl-input=${this.handleInputChange}
        @sl-change=${this.handleInputChange}
      ></sl-input>
    `;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toId(name: string): string {
  return name?.toLowerCase().replace(/ /g, "-") ?? "";
}
