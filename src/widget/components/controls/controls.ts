// Consolidated UI controls: OptionSelect, ToggleSwitch, NumberField
import { css, html, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { converter } from "../../utils";
import { LitElementWw } from "@webwriter/lit";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";

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

  /** SVG url shown as prefix icon inside the select. On small screens the
   *  select collapses to just this icon (reflected for the :host([icon])
   *  selector); tapping it opens the regular dropdown. */
  @property({ reflect: true })
  accessor icon: string = "";

  static styles = css`
    sl-icon[slot="prefix"] {
      font-size: 1.1em;
      flex-shrink: 0;
    }
    @media (max-width: 600px) {
      /* Icon-only mode: hide the value text and caret, keep a square
         trigger that still opens the dropdown on tap */
      :host([icon]) sl-select::part(display-input),
      :host([icon]) sl-select::part(expand-icon) {
        display: none;
      }
      :host([icon]) sl-select::part(combobox) {
        min-width: 0;
        padding-inline: 0;
        justify-content: center;
      }
      :host([icon]) sl-select::part(prefix) {
        margin: 0 auto;
      }
    }
  `;

  public static get scopedElements() {
    return { "sl-select": SlSelect, "sl-option": SlOption, "sl-icon": SlIcon };
  }

  override updated(_changed: PropertyValues) {
    super.updated(_changed);
    const slSelect = this.renderRoot.querySelector("sl-select") as any;
    if (!slSelect) return;
    const idx = this.value ? this.selectOptions.indexOf(this.value) : 0;
    (slSelect.updateComplete ?? Promise.resolve()).then(() => {
      slSelect.value = idx >= 0 ? String(idx) : "";
    });
  }

  private handleSelectChange(e: any) {
  
    const idx = Number(e.target.value);
    if (!Number.isInteger(idx) || idx < 0 || idx >= this.selectOptions.length) return;
    this.selectedIndex = idx;
    this.value = this.selectOptions[idx];
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.value, index: idx },
        composed: true,
      })
    );
  }

  render() {
    this.selectedIndex = this.value ? this.selectOptions.indexOf(this.value) : 0;
    return html`
      <sl-select
        size=${this.size}
        ?disabled="${this.disabled}"
        placeholder="${this.selectOptions[this.selectedIndex] ?? this.placeholder}"
        label="${this.label}"
        @sl-change="${this.handleSelectChange}"
        .value=${this.selectedIndex >= 0 ? String(this.selectedIndex) : ""}
        hoist
      >
        ${this.icon ? html`<sl-icon slot="prefix" src=${this.icon}></sl-icon>` : ""}
        ${this.selectOptions.map(
          (option, i) => html`<sl-option value=${String(i)}>${option}</sl-option>`
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
