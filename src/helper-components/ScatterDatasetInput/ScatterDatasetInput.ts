import { html } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  randomColor,
  //csvToDataset,
  randomNumber,
  randomString,
  //readFileInput,
} from "../../functions";

import style from "./ScatterDatasetInput.style";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import "../FileUploadButton";
import { SharedTestStateMixin } from "../../state";
import { LitElementWw } from "@webwriter/lit";
import { SelectDataset } from "./SelectDataset";
import { updateColorForFilter } from "../../helper-components/Charts/Scatterplot/drawScatterplot";
//TODO: Add teacher options,
//TODO:, file upload, dispatch event, change style for plus button
//TODO: Add margin
//TODO: Add style for selected Element
// Fix the button add dataset
// Add the possibility to change the type of the column
@customElement("wwci-scatterdataset-input")
export class ScatterDatasetInput extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  @state() addDatasetPopupOpen = false;
  @state() addColumnPopupOpenIndex = -1;
  addNumbericDataset() {
    this.sharedState.scatterDatasets.sets.push({
      color: randomColor(),
      name: randomString(),
      ids: [1],
      labels: [randomString()],
      typeOfEachData: ["number"],
      dimensional_data: [{ data: [randomNumber()], selected: false }],
      //TODO: Change "" to undefined?
      filter: { label: "", type: "none", index_in_labels: -1 },
    });
  }
  addCategoricalDataset() {
    this.sharedState.scatterDatasets.sets.push({
      color: randomColor(),
      name: randomString(),
      ids: [1],
      labels: [randomString()],
      typeOfEachData: ["string"],
      dimensional_data: [{ data: [randomString()], selected: false }],
      filter: { label: "", type: "none", index_in_labels: -1 },
    });
  }
  addNumericColumn(index_inset: number) {
    this.sharedState.scatterDatasets.sets[index_inset].labels.push(
      randomString()
    );
    this.sharedState.scatterDatasets.sets[index_inset].typeOfEachData.push(
      "number"
    );
    this.sharedState.scatterDatasets.sets[index_inset].dimensional_data.map(
      (data) => {
        data.data.push(randomNumber());
      }
    );
  }
  addStringColumn(index_inset: number) {
    this.sharedState.scatterDatasets.sets[index_inset].labels.push(
      randomString()
    );
    this.sharedState.scatterDatasets.sets[index_inset].typeOfEachData.push(
      "string"
    );
    this.sharedState.scatterDatasets.sets[index_inset].dimensional_data.map(
      (data) => {
        data.data.push(randomString());
      }
    );
  }

  addRow(index_inset: number) {
    this.sharedState.scatterDatasets.sets[index_inset].ids.push(
      this.sharedState.scatterDatasets.sets[index_inset].ids.length + 1
    );
    this.sharedState.scatterDatasets.sets =
      this.sharedState.scatterDatasets.sets.map((dataset, i) => {
        i === index_inset
          ? dataset.dimensional_data.push({
              data: dataset.typeOfEachData.map((d) =>
                d === "number" ? randomNumber() : randomString()
              ),
              selected: false,
            })
          : dataset;
        return dataset;
      });
    if (
      this.sharedState.scatterDatasets.selected.dataset_indexes.length === 1 &&
      this.sharedState.scatterDatasets.selected.dataset_indexes[0] ===
        index_inset &&
      this.sharedState.scatterDatasets.sets[index_inset].filter?.label &&
      this.sharedState.scatterDatasets.sets[index_inset].filter
        ?.index_in_labels !== -1 &&
      this.sharedState.scatterDatasets.sets[index_inset].filter?.type !== "none"
    ) {
      this.sharedState.scatterDatasets.sets[index_inset].filter.type ===
      "number"
        ? updateColorForFilter(
            this.sharedState.scatterDatasets.sets[index_inset].filter
              .index_in_labels,
            "number",
            this.sharedState.scatterDatasets.sets[index_inset]
          )
        : updateColorForFilter(
            this.sharedState.scatterDatasets.sets[index_inset].filter
              .index_in_labels,
            "string",
            this.sharedState.scatterDatasets.sets[index_inset]
          );
    }
  }

  deleteRow(index_inset: number, index_indata_scatterplot: number) {
    this.sharedState.scatterDatasets.sets =
      this.sharedState.scatterDatasets.sets.map((dataset, i) => {
        i === index_inset
          ? dataset.dimensional_data.splice(index_indata_scatterplot, 1) &&
            dataset.ids.splice(index_indata_scatterplot, 1)
          : dataset;
        return dataset;
      });
  }

  deleteTableDataset(index_inset: number) {
    this.sharedState.scatterDatasets.sets.splice(index_inset, 1);
    // shift the indexes of the selected datasets
    this.sharedState.scatterDatasets.selected.dataset_indexes =
      this.sharedState.scatterDatasets.selected.dataset_indexes
        .map((index) => {
          if (index === index_inset) {
            return null;
          } else if (index > index_inset) {
            return index - 1;
          } else {
            return index;
          }
        })
        .filter((i) => i !== null) as number[];
  }
  deleteColumn(index_inset: number, index_inlabels: number) {
    this.sharedState.scatterDatasets.sets =
      this.sharedState.scatterDatasets.sets.map((dataset, i) => {
        if (i === index_inset) {
          dataset.labels.splice(index_inlabels, 1);
          dataset.typeOfEachData.splice(index_inlabels, 1);
          dataset.dimensional_data.map((data) => {
            data.data.splice(index_inlabels, 1);
          });
          if (dataset.filter.index_in_labels === index_inlabels) {
            dataset.filter = { label: "", type: "none", index_in_labels: -1 };
            // Delete the color filter if the column is deleted
            dataset.dimensional_data.map((data) => {
              data.color = undefined;
            });
          }
        }
        return dataset;
      });

    // In case the deleted column was selected as x or y axis
    if (
      this.sharedState.scatterDatasets.selected.dataset_indexes.includes(
        index_inset
      )
    ) {
      const deletedLabel =
        this.sharedState.scatterDatasets.sets[index_inset].labels[
          index_inlabels
        ];
      if (
        this.sharedState.scatterDatasets.selected.axis.x === deletedLabel ||
        this.sharedState.scatterDatasets.selected.axis.y === deletedLabel
      ) {
        // if there are multiple datasets, deselect current dataset
        if (
          this.sharedState.scatterDatasets.selected.dataset_indexes.length > 1
        ) {
          this.sharedState.scatterDatasets.selected.dataset_indexes.forEach(
            (index, i) => {
              if (index === index_inset) {
                this.sharedState.scatterDatasets.selected.dataset_indexes.splice(
                  i,
                  1
                );
              }
            }
          );
          // if there is only one dataset, deselect the axis
        } else {
          if (
            this.sharedState.scatterDatasets.selected.axis.x === deletedLabel
          ) {
            this.sharedState.scatterDatasets.selected.axis.x = undefined;
          } else {
            this.sharedState.scatterDatasets.selected.axis.y = undefined;
          }
        }
      }
    }
  }
  changeColor(color: string, index_inset: number) {
    this.sharedState.scatterDatasets.sets[index_inset].color = color;
  }
  render() {
    return html`${this.sharedState.teacherOptions.addRemoveData
      ? html`<div class="btn-wrapper">
          <sl-popup
            placement="bottom-start"
            strategy="fixed"
            .active=${this.addDatasetPopupOpen}
          >
            <sl-button
              slot="anchor"
              label="Add ${this.sharedState.scatterDatasets.sets.length === 0
                ? "first"
                : "new"} Dataset"
              @click=${(e) => {
                this.addDatasetPopupOpen = true;
                e.target.focus();
              }}
              @blur=${() => (this.addDatasetPopupOpen = false)}
              >Add New Dataset</sl-button
            >

            <div class="popup-content">
              <sl-button
                @mousedown=${(e: MouseEvent) => {
                  if (e.button !== 0) return;
                  this.addNumbericDataset();
                  this.addDatasetPopupOpen = false;
                }}
              >
                Add new dataset with the first column with numeric values
              </sl-button>
              <sl-button
                @mousedown=${(e: MouseEvent) => {
                  if (e.button !== 0) return;
                  this.addCategoricalDataset();
                  this.addDatasetPopupOpen = false;
                }}
              >
                Add new dataset with the first column with categorical values
              </sl-button>
            </div>
          </sl-popup>
          <wwci-select-dataset></wwci-select-dataset>
        </div>`
      : html``}
    ${this.sharedState.scatterDatasets.sets.map(
      (each_dataset, index_inset) => html`
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  <div
                    style="display: flex; flex-direction: row; align-items: center"
                  >
                    ${
                      !this.sharedState.printable
                        ? html`
                            <sl-color-picker
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.changeData
                              )}
                              value="${this.sharedState.scatterDatasets.sets[
                                index_inset
                              ].color}"
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
                              @click=${() =>
                                this.deleteTableDataset(index_inset)}
                            ></sl-icon-button>
                            <div class="input-wrapper">
                              <sl-input
                                ?disabled=${!(
                                  this.sharedState.editable ||
                                  this.sharedState.teacherOptions.changeData
                                )}
                                type="text"
                                class="input"
                                value="${this.sharedState.scatterDatasets.sets[
                                  index_inset
                                ].name}"
                                @sl-input=${(e: any) => {
                                  this.sharedState.scatterDatasets.sets[
                                    index_inset
                                  ].name = e.target.value;
                                }}
                              ></sl-input>
                            </div>
                          `
                        : html``
                    }
                  </div>
                </th>
                ${this.sharedState.scatterDatasets.sets[index_inset].labels.map(
                  (label, index_inlabels) =>
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
                            @sl-input=${(e: any) => {
                              const newValue = e.target.value as string;
                              this.sharedState.scatterDatasets.sets[
                                index_inset
                              ].labels[index_inlabels] = newValue;
                            }}
                            @sl-blur=${() => {
                              const labels =
                                this.sharedState.scatterDatasets.sets[
                                  index_inset
                                ].labels;
                              const label = labels[index_inlabels];
                              if (
                                labels.some(
                                  (l, i) => l === label && i !== index_inlabels
                                )
                              ) {
                                this.sharedState.scatterDatasets.sets[
                                  index_inset
                                ].labels[index_inlabels] = `${label} (1)`;
                              }
                            }}
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
                              @click=${() =>
                                this.deleteColumn(index_inset, index_inlabels)}
                            ></sl-icon-button>`
                          : html``}
                      </div>
                    </th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${each_dataset.dimensional_data.map(
                (each_data_scatterplot, index_inscatter) => html`
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
                                this.deleteRow(index_inset, index_inscatter)}
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
                            value="${each_dataset.ids[index_inscatter]}"
                            @sl-input=${(e: any) =>
                              (each_dataset.ids[index_inscatter] =
                                e.target.value)}
                          ></sl-input>
                        </div>
                      </div>
                    </td>

                    ${each_data_scatterplot.data.map(
                      (data, index_indata) => html`
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
                                id="input-x-${index_inset}-${index_inscatter}-${index_indata}"
                                type="text or number"
                                class="input"
                                value="${data}"
                                @sl-input=${(e: any) => {
                                  each_dataset.typeOfEachData[index_indata] ===
                                  "number"
                                    ? (this.sharedState.scatterDatasets.sets[
                                        index_inset
                                      ].dimensional_data[index_inscatter].data[
                                        index_indata
                                      ] = Number(e.target.value))
                                    : (this.sharedState.scatterDatasets.sets[
                                        index_inset
                                      ].dimensional_data[index_inscatter].data[
                                        index_indata
                                      ] = String(e.target.value));
                                  if (
                                    this.sharedState.scatterDatasets.selected
                                      .dataset_indexes.length === 1 &&
                                    this.sharedState.scatterDatasets.selected
                                      .dataset_indexes[0] === index_inset &&
                                    this.sharedState.scatterDatasets.sets[
                                      index_inset
                                    ].filter?.label ===
                                      each_dataset.labels[index_indata] &&
                                    this.sharedState.scatterDatasets.sets[
                                      index_inset
                                    ].filter?.index_in_labels === index_indata
                                  ) {
                                    this.sharedState.scatterDatasets.sets[
                                      index_inset
                                    ].filter.type === "number"
                                      ? updateColorForFilter(
                                          index_indata,
                                          "number",
                                          this.sharedState.scatterDatasets.sets[
                                            index_inset
                                          ]
                                        )
                                      : updateColorForFilter(
                                          index_indata,
                                          "string",
                                          this.sharedState.scatterDatasets.sets[
                                            index_inset
                                          ]
                                        );
                                  }
                                }}
                              ></sl-input>
                            </div>
                          </div>
                        </td>
                      `
                    )}
                  </tr>
                `
              )}
            </tbody>
          </table>
          ${
            this.sharedState.editable ||
            (this.sharedState.teacherOptions.addRemoveData &&
              !this.sharedState.printable)
              ? html`
                  <sl-popup
                    placement="right"
                    strategy="fixed"
                    .active=${this.addColumnPopupOpenIndex === index_inset}
                    style="z-index: 10"
                  >
                    <sl-icon-button
                      slot="anchor"
                      name="plus-circle"
                      label="Add Column"
                      @click=${(e) => {
                        this.addColumnPopupOpenIndex = index_inset;
                        e.target.focus();
                      }}
                      @blur=${() => (this.addColumnPopupOpenIndex = -1)}
                    ></sl-icon-button>
                    <div class="popup-content">
                      <sl-button
                        @mousedown=${(e: MouseEvent) => {
                          if (e.button !== 0) return;
                          this.addStringColumn(index_inset);
                          this.addColumnPopupOpenIndex = -1;
                        }}
                      >
                        Text dataset
                      </sl-button>
                      <sl-button
                        @mousedown=${(e: MouseEvent) => {
                          if (e.button !== 0) return;
                          this.addNumericColumn(index_inset);
                          this.addColumnPopupOpenIndex = -1;
                        }}
                      >
                        Numeric dataset
                      </sl-button>
                    </div>
                  </sl-popup>
                `
              : html``
          }
          </div>
          ${
            this.sharedState.teacherOptions.addRemoveData
              ? html`<sl-icon-button
                  @click=${() => this.addRow(index_inset)}
                  name="plus-circle"
                  label="Add Dataset"
                ></sl-icon-button>`
              : html``
          }
          
        </div>
      </div>
    `
    )}`;
  }
  dispatchUpdateEvent() {
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: {
          value: this.sharedState.scatterDatasets,
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
      "sl-popup": SlPopup,
      "wwci-select-dataset": SelectDataset,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-scatterdataset-input": ScatterDatasetInput;
  }
}
