import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { converter } from "../functions";

import "@shoelace-style/shoelace/dist/components/select/select.js";
import "@shoelace-style/shoelace/dist/components/option/option.js";

@customElement("wwci-select")
export class Select extends LitElement {
  @property({ type: Array<string>, converter })
  options: Array<string> = [];

  @property()
  label: string = "";

  @property()
  placeholder: string = "";

  @property()
  value: string = "";

  @property({ type: Number })
  selectedIndex = 0;

  changeSelected(e: any) {
    this.selectedIndex = this.options.findIndex(
      (v) => e.target.value === convertFriendlyNameToId(v)
    );
    this.value = this.options[this.selectedIndex];
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.value },
        composed: true,
      })
    );
  }

  render() {
    this.selectedIndex = this.value ? this.options.indexOf(this.value) : 0;
    return html`<sl-select
      placeholder="${this.placeholder}"
      label="${this.label}"
      @sl-change="${this.changeSelected}"
      value=${convertFriendlyNameToId(this.options[this.selectedIndex])}
    >
      ${this.options.map(
        (option) =>
          html`<sl-option value="${convertFriendlyNameToId(option)}"
            >${option}</sl-option
          >`
      )}
    </sl-select>`;
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
