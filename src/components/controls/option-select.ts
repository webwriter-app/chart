import { css, html, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { converter } from "../../model/chart-options";
import { LitElementWw } from "@webwriter/lit";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-select": OptionSelect;
  }
}

export class OptionSelect extends LitElementWw {
  @property({ type: Array, converter })
  accessor selectOptions: Array<string> = [];

  @property({ attribute: false })
  accessor selectLabels: readonly string[] = [];

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

  static scopedElements = { "sl-select": SlSelect, "sl-option": SlOption, "sl-icon": SlIcon };

  override updated(_changed: PropertyValues) {
    super.updated(_changed);
    const slSelect = this.renderRoot.querySelector<SlSelect>("sl-select");
    if (!slSelect) return;
    const idx = this.value ? this.selectOptions.indexOf(this.value) : 0;
    slSelect.updateComplete.then(() => {
      slSelect.value = idx >= 0 ? String(idx) : "";
    });
  }

  private handleSelectChange(e: Event) {
    const idx = Number((e.target as SlSelect).value);
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
        placeholder="${this.selectLabels[this.selectedIndex] ?? this.selectOptions[this.selectedIndex] ?? this.placeholder}"
        label="${this.label}"
        @sl-change="${this.handleSelectChange}"
        .value=${this.selectedIndex >= 0 ? String(this.selectedIndex) : ""}
        hoist
      >
        ${this.icon ? html`<sl-icon slot="prefix" src=${this.icon}></sl-icon>` : ""}
        ${this.selectOptions.map(
          (option, i) => html`<sl-option value=${String(i)}>${this.selectLabels[i] ?? option}</sl-option>`
        )}
      </sl-select>
    `;
  }
}
