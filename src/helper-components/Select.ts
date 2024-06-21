import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { converter } from "../functions";

import "@shoelace-style/shoelace/dist/components/select/select.js";
import "@shoelace-style/shoelace/dist/components/option/option.js";
import { LitElementWw } from "@webwriter/lit";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";

@customElement("wwci-select")
export class Select extends LitElementWw {
  @property({ type: Array<string>, converter })
  selectOptions: Array<string> = [];

  @property()
  label: string = "";

  @property()
  placeholder: string = "";

  @property()
  value: string = "";

  @property({ type: Number })
  selectedIndex = 0;

  @property({ type: Boolean })
  disabled: boolean = false;

  changeSelected(e: any) {
    this.selectedIndex = this.selectOptions.findIndex(
      (v) => e.target.value === convertFriendlyNameToId(v)
    );
    this.value = this.selectOptions[this.selectedIndex];
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.value },
        composed: true,
      })
    );
  }

  render() {
    this.selectedIndex = this.value
      ? this.selectOptions.indexOf(this.value)
      : 0;
    return html`
      <sl-select
        ?disabled="${this.disabled}"
        placeholder="${this.placeholder}"
        label="${this.label}"
        @sl-change="${this.changeSelected}"
        value=${convertFriendlyNameToId(this.selectOptions[this.selectedIndex])}
      >
        ${this.selectOptions.map(
          (option) =>
            html`<sl-option value="${convertFriendlyNameToId(option)}"
              >${option}</sl-option
            >`
        )}
      </sl-select>
    `;
  }

  public static get scopedElements() {
    return {
      "sl-select": SlSelect,
      "sl-option": SlOption,
    };
  }
}

function convertFriendlyNameToId(name: string): string {
  return name.toLowerCase().replace(/ /g, "-");
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-select": Select;
  }
}
