import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { converter } from "../functions";
import { ChartOptions } from "../interfaces";

@customElement("wwci-chart-options")
export class Select extends LitElement {
  @property({ type: Object, converter })
  options: ChartOptions = {};

  dispatchUpdateEvent() {
    this.dispatchEvent(
      new CustomEvent("wwci-chart-options", {
        detail: { value: this.options },
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="options">
        <sl-input
          label="Border Radius"
          type="number"
          value=${this.options.borderRadius}
          @sl-input=${(e: any) => {
            this.options.borderRadius = Number(e.target.value);
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
        ></sl-input>
        <sl-input
          label="Border Width"
          type="number"
          value=${this.options.borderWidth}
          @sl-input=${(e: any) => {
            this.options.borderWidth = Number(e.target.value);
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
        ></sl-input>
        <wwci-switch
          checked=${this.options.horizontal}
          @wwci-change=${(e: any) => {
            this.options.horizontal = e.detail.value;
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
          >Horizontal</wwci-switch
        >
        <wwci-switch
          checked=${this.options.filled}
          @wwci-change=${(e: any) => {
            this.options.filled = e.target.checked;
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
          >Filled</wwci-switch
        >
        <wwci-switch
          checked=${this.options.dynamicSize}
          @wwci-change=${(e: any) => {
            this.options.dynamicSize = e.target.checked;
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
          >Dynamic Size</wwci-switch
        >

        <sl-input
          label="Scale Min"
          type="number"
          value=${this.options.scaleMin}
          @sl-input=${(e: any) => {
            this.options.scaleMin = Number(e.target.value);
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
        ></sl-input>
        <sl-input
          label="Scale Max"
          type="number"
          value=${this.options.scaleMax}
          @sl-input=${(e: any) => {
            this.options.scaleMax = Number(e.target.value);
            this.dispatchUpdateEvent();
            this.requestUpdate();
          }}
        ></sl-input>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-chart-options": Select;
  }
}
