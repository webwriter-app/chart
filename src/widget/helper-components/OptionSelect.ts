import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { converter } from "../utils";

import "@shoelace-style/shoelace/dist/components/select/select.js";
import "@shoelace-style/shoelace/dist/components/option/option.js";
import { LitElementWw } from "@webwriter/lit";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";

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
    return {
      "sl-select": SlSelect,
      "sl-option": SlOption,
    };
  }

handleSelectChange(e: any) {
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
        size=${this.size}
        ?disabled="${this.disabled}"
        placeholder="${this.placeholder}"
        label="${this.label}"
        @sl-change="${this.handleSelectChange}"
        value=${convertFriendlyNameToId(this.selectOptions[this.selectedIndex])}
        hoist
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
}

function convertFriendlyNameToId(name: string): string {
  return name.toLowerCase().replace(/ /g, "-");
}