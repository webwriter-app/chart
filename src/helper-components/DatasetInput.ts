import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  attribute,
  converter,
  randomColor,
  randomNumber,
  randomString,
} from "../functions";

import "./EditableTable";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import { Dataset } from "../interfaces";

@customElement("wwci-dataset-input")
export class Select extends LitElement {
  @property({ type: Boolean, converter })
  dimensions_fixed = false;

  @property({ type: Boolean, converter })
  add_datasets = false;

  @property({ type: Object, converter })
  datasets: Dataset[] = [];

  render() {
    return html`${this.datasets.map((dataset, i) => {
      const headlines = ["Label", "Data", "Color"];
      const data = [dataset.labels, dataset.data, dataset.colors];
      const dataTypes = ["text", "number", "color"];
      return html`<div>
        <sl-input
          value=${dataset.label}
          @sl-input=${(e: CustomEvent) => this.updateLabel(e, i)}
        ></sl-input>
        <wwci-editable-table
          headlines="${attribute(headlines)}"
          data="${attribute(data)}"
          dataTypes="${attribute(dataTypes)}"
          dimensions_fixed="${attribute(this.dimensions_fixed)}"
          @wwci-table-change="${(e: CustomEvent) => this.updateData(e, i)}"
        >
          <sl-icon-button
            class="delete"
            @click=${() => this.removeDataset(i)}
            name="trash"
            label="Delete Row"
          />
        </wwci-editable-table>
      </div> `;
    })}
    ${this.add_datasets
      ? html`<sl-button @click=${this.addDataset}>Add Dataset</sl-button>`
      : ""}`;
  }

  updateLabel(e: any, index: number) {
    this.datasets[index].label = e.target.value;
    this.dispatchUpdateEvent();
    this.requestUpdate();
  }

  addDataset() {
    this.datasets.push({
      label: randomString(),
      labels: Array(6)
        .fill("")
        .map(() => randomString()),
      data: Array(6)
        .fill("")
        .map(() => randomNumber()),
      colors: Array(6)
        .fill("")
        .map(() => randomColor()),
    });
    this.dispatchUpdateEvent();
    this.requestUpdate();
  }

  removeDataset(index: number) {
    this.datasets.splice(index, 1);
    this.dispatchUpdateEvent();
    this.requestUpdate();
  }

  updateData(e: any, index: number) {
    this.datasets[index] = {
      label: this.datasets[index].label,
      labels: e.detail.value[0],
      data: e.detail.value[1],
      colors: e.detail.value[2],
    };
    this.dispatchUpdateEvent();
  }

  dispatchUpdateEvent() {
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: { value: this.datasets },
        bubbles: false,
        composed: true,
      })
    );
  }

  static styles = css`
    :host {
      height: 100%;
      width: 100%;
      display: flex;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-dataset-input": Select;
  }
}
