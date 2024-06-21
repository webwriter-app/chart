import { html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  randomColor,
  //csvToDataset,
  randomNumber,
  randomString,
  //readFileInput,
} from "../../functions";

import style from "./ScatterplotDatasetInput.style";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js";
import "../FileUploadButton";
import { SharedTestStateMixin } from "../../state";
import { LitElementWw } from "@webwriter/lit";
//TODO: Add teacher options,
//TODO:, file upload, dispatch event, change style for plus button
@customElement("wwci-datasetscatterplot-input")
export class ScatterplotDatasetInput extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  addFirstDataset() {
    this.sharedState.scatterplotdatasets.axisLabels = {
      x: "X-axis",
      y: "Y-axis",
    };
    this.sharedState.scatterplotdatasets.sets.push({
      scatter_color: randomColor(),
      scatter_titel: randomString(),
      labels: [randomString()],
      dimensional_data: [{ x: randomNumber(), y: randomNumber() }],
    });
    console.log("ADD DATASET");
    console.log(this.sharedState.scatterplotdatasets.sets);
  }
  addDataset() {
    this.sharedState.scatterplotdatasets.sets.push({
      scatter_color: randomColor(),
      scatter_titel: randomString(),
      labels: [randomString()],
      dimensional_data: [{ x: randomNumber(), y: randomNumber() }],
    });
    console.log("ADD DATASET");
    console.log(this.sharedState.scatterplotdatasets.sets);
  }

  addRow(index_inset: number) {
    this.sharedState.scatterplotdatasets.sets =
      this.sharedState.scatterplotdatasets.sets.map((dataset, i) => {
        i === index_inset
          ? dataset.dimensional_data.push({
              x: randomNumber(),
              y: randomNumber(),
            }) && dataset.labels.push(randomString())
          : dataset;
        return dataset;
      });
  }

  deleteRow(index_inset: number, index_indata_scatterplot: number) {
    this.sharedState.scatterplotdatasets.sets =
      this.sharedState.scatterplotdatasets.sets.map((dataset, i) => {
        i === index_inset
          ? dataset.dimensional_data.splice(index_indata_scatterplot, 1) &&
            dataset.labels.splice(index_indata_scatterplot, 1)
          : dataset;
        return dataset;
      });
  }

  deleteTableDataset(index_inset: number) {
    this.sharedState.scatterplotdatasets.sets.splice(index_inset, 1);
  }
  changeColor(scatter_color: string, index_inset: number) {
    this.sharedState.scatterplotdatasets.sets[index_inset].scatter_color =
      scatter_color;
  }
  render() {
    if (this.sharedState.scatterplotdatasets.sets.length === 0)
      return html`<sl-button @click=${() => this.addFirstDataset()}
        >Add Dataset</sl-button
      >`;
    return html`
      ${this.sharedState.teacherOptions.addRemoveData
        ? html`<sl-button
            class="add-dataset-button"
            @click=${() => this.addDataset()}
            >Add Dataset</sl-button
          >`
        : html``}
      ${this.sharedState.scatterplotdatasets.sets.map(
        (each_dataset, index_inset) => html` <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  <div
                    style="display: flex; flex-direction: row; align-items: center"
                  >
                    ${!this.sharedState.printable
                      ? html`
                          <sl-color-picker
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.changeData
                            )}
                            value="${this.sharedState.scatterplotdatasets.sets[
                              index_inset
                            ].scatter_color}"
                            @sl-input=${(e: any) =>
                              this.changeColor(e.target.value, index_inset)}
                          ></sl-color-picker>
                          <sl-icon-button
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.addRemoveData
                            )}
                            name="trash"
                            label="Settings"
                            @click=${() => this.deleteTableDataset(index_inset)}
                          ></sl-icon-button>
                          <div class="input-wrapper">
                            <sl-input
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.changeData
                              )}
                              type="text"
                              class="input"
                              value="${this.sharedState.scatterplotdatasets
                                .sets[index_inset].scatter_titel}"
                              @sl-input=${(e: any) =>
                                (this.sharedState.scatterplotdatasets.sets[
                                  index_inset
                                ].scatter_titel = e.target.value)}
                            ></sl-input>
                          </div>
                        `
                      : html``}
                  </div>
                </th>

                <th>
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
                        value="${this.sharedState.scatterplotdatasets.axisLabels
                          .x}"
                        @sl-input=${(e: any) =>
                          (this.sharedState.scatterplotdatasets.axisLabels.x =
                            e.target.value)}
                      ></sl-input>
                    </div>
                  </div>
                </th>
                <th>
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
                        value="${this.sharedState.scatterplotdatasets.axisLabels
                          .y}"
                        @sl-input=${(e: any) =>
                          (this.sharedState.scatterplotdatasets.axisLabels.y =
                            e.target.value)}
                      ></sl-input>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              ${each_dataset.dimensional_data.map(
                (each_data_scatterplot, index_indata_scatterplot) => html`
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
                              @click=${() =>
                                this.deleteRow(
                                  index_inset,
                                  index_indata_scatterplot
                                )}
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
                            value="${each_dataset.labels[
                              index_indata_scatterplot
                            ]}"
                            @sl-input=${(e: any) =>
                              (each_dataset.labels[index_indata_scatterplot] =
                                e.target.value)}
                          ></sl-input>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style="display: flex; flex-direction: row; align-items: center"
                      >
                        <div class="input-wrapper">
                          <sl-input
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.changeData
                            )}
                            id="input-x-${index_inset}-${index_indata_scatterplot}"
                            type="number"
                            class="input"
                            value="${each_data_scatterplot.x}"
                            @sl-input=${(e: any) =>
                              (each_data_scatterplot.x = Number(
                                e.target.value
                              ))}
                          ></sl-input>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style="display: flex; flex-direction: row; align-items: center"
                      >
                        <div class="input-wrapper">
                          <sl-input
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.changeData
                            )}
                            id="input-y-${index_inset}-${index_indata_scatterplot}"
                            type="number"
                            class="input"
                            value="${each_data_scatterplot.y}"
                            @sl-input=${(e: any) =>
                              (each_data_scatterplot.y = Number(
                                e.target.value
                              ))}
                          ></sl-input>
                        </div>
                      </div>
                    </td>
                  </tr>
                `
              )}
            </tbody>
          </table>
          ${this.sharedState.editable ||
          (this.sharedState.teacherOptions.addRemoveData &&
            !this.sharedState.printable)
            ? html` <sl-icon-button
                @click=${() => this.addRow(index_inset)}
                name="plus-circle"
                label="Add Dataset"
              ></sl-icon-button>`
            : html``}
        </div>`
      )}
    `;
  }
  dispatchUpdateEvent() {
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: {
          value: this.sharedState.scatterplotdatasets,
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

  static styles = style;

  public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-icon-button": SlIconButton,
      "sl-color-picker": SlColorPicker,
      "sl-input": SlInput,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-datasetscatterplot-input": ScatterplotDatasetInput;
  }
}
