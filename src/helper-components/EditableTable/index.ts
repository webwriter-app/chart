import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  converter,
  randomColor,
  randomNumber,
  randomString,
} from "../../functions";

import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";

import style from "./index.css?inline";

@customElement("wwci-editable-table")
export class Select extends LitElement {
  @property({ type: Array, converter })
  headlines = ["Data", "data2"];

  @property({ type: Array, converter })
  dataTypes = ["text", "number", "color"];

  @property({ type: Boolean, converter })
  dimensions_fixed = false;

  @property({ type: Array, converter })
  data: Array<Array<string>> = this.headlines.map(() =>
    Array(5)
      .fill(0)
      .map(() => randomNumber().toString())
  );

  render() {
    console.log(this.data);
    return html`<div id="main">
      <table>
        <thead>
          <tr>
            ${this.headlines.map((headline) => html`<th>${headline}</th>`)}
            <th><slot></slot></th>
          </tr>
        </thead>
        <tbody>
          ${Array(this.data[0].length)
            .fill(0)
            .map(
              (_, i) => html`<tr>
                ${this.headlines.map(
                  (_, j) => html`<td>
                    <sl-input
                      id="input-${i}-${j}"
                      type="${this.dataTypes[j]}"
                      class="input"
                      value="${this.data[j][i]}"
                      @sl-input=${() => this.dataChanged(i, j)}
                    />
                  </td> `
                )}
                <td>
                  <sl-icon-button
                    class="delete"
                    @click=${() => this.removeRow(i)}
                    name="trash"
                    label="Delete Row"
                  />
                </td>
              </tr>`
            )}
        </tbody>
      </table>
      ${!this.dimensions_fixed
        ? html`<sl-button @click=${this.addRow} => Add Row </sl-button>`
        : html``}
    </div>`;
  }

  addRow() {
    this.data = this.data.map((row, i) => {
      switch (this.dataTypes[i]) {
        case "color":
          return [...row, randomColor()];
        case "number":
          return [...row, randomNumber().toString()];

        case "text":
          return [...row, randomString()];
        default:
          return [...row, ""];
      }
    });
    this.requestUpdate();
    this.dataChanged();
  }

  removeRow(i: number) {
    this.data = this.data.map((row) => row.filter((_, j) => j !== i));
    this.requestUpdate();
    this.dataChanged();
  }

  dataChanged(i?: number, j?: number) {
    if (i !== undefined && j !== undefined) {
      const value = (this.shadowRoot?.getElementById(`input-${i}-${j}`) as any)
        .value;
      this.data[j][i] = this.dataTypes[j] === "number" ? Number(value) : value;
    }
    console.log(this.data);
    this.dispatchEvent(
      new CustomEvent("wwci-table-change", {
        detail: { value: this.data },
        composed: true,
      })
    );
  }

  static styles = unsafeCSS(style);
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-editable-table": Select;
  }
}
