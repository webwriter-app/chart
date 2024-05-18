import { LitElement, html, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";

import {
  csvToDataset,
  randomColor,
  randomNumber,
  randomString,
  readFileInput,
} from "../../functions";

import style from "./DatasetInput.css?inline";

import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js";
import { SharedTestStateMixin } from "../../state";
import "../FileUploadButton";

@customElement("wwci-dataset-input")
export class Select extends SharedTestStateMixin(LitElement) {
  addDataset() {
    this.sharedState.chart.datasets.sets.push({
      name: randomString(),
      color: randomColor(),
      colors: this.sharedState.chart.datasets.sets[0].colors,
      data: Array(this.sharedState.chart.datasets.sets[0].data.length)
        .fill("")
        .map(() => randomNumber()),
    });
  }

  addColumn() {
    this.sharedState.chart.datasets.labels.push(randomString());
    this.sharedState.chart.datasets.sets =
      this.sharedState.chart.datasets.sets.map((dataset) => {
        dataset.data.push(randomNumber());
        dataset.colors.push(randomColor());
        return dataset;
      });
  }

  deleteColumn(i: number) {
    this.sharedState.chart.datasets.labels.splice(i, 1);
    this.sharedState.chart.datasets.sets =
      this.sharedState.chart.datasets.sets.map((dataset) => {
        dataset.data.splice(i, 1);
        dataset.colors.splice(i, 1);
        return dataset;
      });
  }

  deleteDataset(i: number) {
    this.sharedState.chart.datasets.sets.splice(i, 1);
  }

  render() {
    if (this.sharedState.chart.datasets.sets.length === 0)
      return html`<sl-button @click=${this.addDataset}>Add Dataset</sl-button>`;
    return html`<div class="table-wrapper">
      <div class="table-scroll-container">
        <div class="table-layout-container">
          <table>
            <thead>
              <tr>
                <th>Labels</th>
                ${this.sharedState.chart.datasets.labels.map(
                  (label, i) =>
                    html`<th>
                      <div
                        style="display: flex; flex-direction: row; align-items: center"
                      >
                        <div class="input-wrapper">
                          <sl-input
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.changeData
                            )}
                            type="text"
                            class="input"
                            value="${label}"
                            @sl-input=${(e: any) =>
                              (this.sharedState.chart.datasets.labels[i] =
                                e.target.value)}
                          ></sl-input>
                        </div>
                        ${!this.sharedState.printable
                          ? html`<sl-icon-button
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.addRemoveData
                              )}
                              name="trash"
                              label="Settings"
                              @click=${() => this.deleteColumn(i)}
                            ></sl-icon-button>`
                          : html``}
                      </div>
                    </th>`
                )}
              </tr>
            </thead>

            <tbody>
              ${this.sharedState.chart.datasets.sets.map(
                (dataset, i) => html`
                  <tr>
                    <td>
                      <div
                        style="display: flex; flex-direction: row; align-items: center"
                      >
                        ${!this.sharedState.printable
                          ? html` <sl-icon-button
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.addRemoveData
                              )}
                              name="trash"
                              label="Settings"
                              @click=${() => this.deleteDataset(i)}
                            ></sl-icon-button>`
                          : html``}
                        <div class="input-wrapper">
                          <sl-input
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.changeData
                            )}
                            id="input"
                            type="text"
                            class="input"
                            value="${dataset.name}"
                            @sl-input=${(e: any) =>
                              (this.sharedState.chart.datasets.sets[i].name =
                                e.target.value)}
                          ></sl-input>
                        </div>

                        ${!this.sharedState.printable
                          ? html`
                              <sl-color-picker
                                ?disabled=${!(
                                  this.sharedState.editable ||
                                  this.sharedState.teacherOptions.changeData
                                )}
                                value="${this.sharedState.chart.datasets.sets[i]
                                  .color}"
                                @sl-input=${(e: any) =>
                                  (this.sharedState.chart.datasets.sets[
                                    i
                                  ].color = e.target.value)}
                              ></sl-color-picker>
                            `
                          : html``}
                      </div>
                    </td>
                    ${dataset.data.map(
                      (value, j) =>
                        html`<td>
                          <div
                            style="display: flex; flex-direction: row; align-items: center"
                          >
                            <div class="input-wrapper">
                              <sl-input
                                ?disabled=${!(
                                  this.sharedState.editable ||
                                  this.sharedState.teacherOptions.changeData
                                )}
                                id="input-${i}-${j}"
                                type="number"
                                class="input"
                                value="${value}"
                                @sl-input=${(e: any) =>
                                  (this.sharedState.chart.datasets.sets[i].data[
                                    j
                                  ] = Number(e.target.value))}
                              ></sl-input>
                            </div>

                            ${!this.sharedState.printable
                              ? html`<sl-color-picker
                                  ?disabled=${!(
                                    this.sharedState.editable ||
                                    this.sharedState.teacherOptions.changeData
                                  )}
                                  value="${this.sharedState.chart.datasets.sets[
                                    i
                                  ].colors[j]}"
                                  @sl-input=${(e: any) =>
                                    (this.sharedState.chart.datasets.sets[
                                      i
                                    ].colors[j] = e.target.value)}
                                ></sl-color-picker>`
                              : html``}
                          </div>
                        </td>`
                    )}
                  </tr>
                `
              )}
            </tbody>
          </table>

          ${this.sharedState.editable ||
          (this.sharedState.teacherOptions.addRemoveData &&
            !this.sharedState.printable)
            ? html`
                <sl-icon-button
                  @click=${this.addColumn}
                  name="plus-circle"
                  label="Add Column"
                ></sl-icon-button>
                <sl-icon-button
                  @click=${this.addDataset}
                  name="plus-circle"
                  label="Add Dataset"
                ></sl-icon-button>

                <br />
                <wwci-file-upload-button
                  @wwcifileinput=${async (e) => {
                    const fileContent = await readFileInput(e.detail.value);
                    const { datasets, title } = csvToDataset(fileContent);
                    this.sharedState.chart.datasets = datasets;
                    if (title) this.dispatchTitleUpdateEvent(title);
                  }}
                ></wwci-file-upload-button>
              `
            : html``}
        </div>
      </div>
    </div>`;
  }

  dispatchUpdateEvent() {
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: {
          value: this.sharedState.chart.datasets,
        },
        bubbles: false,
        composed: true,
      })
    );
  }

  dispatchTitleUpdateEvent(title: string) {
    this.dispatchEvent(
      new CustomEvent("wwci-title-change", {
        detail: {
          value: title,
        },
        bubbles: false,
        composed: true,
      })
    );
  }

  static styles = unsafeCSS(style);
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-dataset-input": Select;
  }
}
