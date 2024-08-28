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
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import IconTrash from "bootstrap-icons/icons/trash.svg";
import IconPlusCircle from "bootstrap-icons/icons/plus-circle.svg";
import IconCaretdown from "bootstrap-icons/icons/caret-down.svg";
import "../FileUploadButton";
import { SharedTestStateMixin } from "../../state";
import { LitElementWw } from "@webwriter/lit";
import { SelectDataset } from "./SelectDataset";
import { updateColorForFilter } from "../../helper-components/Charts/Scatterplot/drawScatterplot";
//TODO: Add teacher options,
//TODO:, file upload, dispatch event, change style for plus button
//TODO: Add margin
//TODO: Add style for selected Element
//TODO: Fix color by changing lightgreen and yellow to a better color
//TODO: Fix color of trash to red when hovering
// TODO: Fix style for the popup of buttons SelectDatasets?
// Fix the button add dataset
// Add the possibility to change the type of the column
@customElement("wwci-scatterdataset-input")
export class ScatterDatasetInput extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  @state() accessor addDatasetPopupOpen = false;
  @state() accessor addColumnPopupOpenIndex = -1;
  @state() accessor openColumnTypePopupIndexInSet = -1;
  @state() accessor openColumnTypePopupIndexInLabels = -1;
  addNewDataset() {
    this.sharedState.scatterDatasets.sets.push({
      color: randomColor(),
      name: randomString(),
      ids: [1],
      labels: [],
      typeOfEachData: [],
      dimensional_data: [{ data: [], selected: false }],
      //TODO: Change "" to undefined?
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
            this.sharedState.scatterDatasets.selected.axis.x = "None";
          } else {
            this.sharedState.scatterDatasets.selected.axis.y = "None";
          }
        }
      }
    }
  }
  changeColor(color: string, index_inset: number) {
    this.sharedState.scatterDatasets.sets[index_inset].color = color;
  }
  // !important index_inset is the index of the dataset and index_inset = this.sharedState.scatterDatasets.sets.length - 1 - index_reverse
  render() {
    return html`${this.sharedState.teacherOptions.addRemoveData
      ? html`<div class="btn-wrapper">
          <sl-button
            slot="anchor"
            label="Add ${this.sharedState.scatterDatasets.sets.length === 0
              ? "first"
              : "new"} Dataset"
            @click=${() => {
              this.addNewDataset();
            }}
            >Add
            ${this.sharedState.scatterDatasets.sets.length === 0
              ? "First"
              : "New"}
            Dataset</sl-button
          >
          <wwci-select-dataset></wwci-select-dataset>
        </div>`
      : html``}
    ${this.sharedState.scatterDatasets.sets
      .slice()
      .reverse()
      .map(
        (each_dataset, index_reverse) => html`
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="table-cell-name">
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
                                this.sharedState.scatterDatasets.sets.length -
                                  1 -
                                  index_reverse
                              ].color}"
                              @sl-input=${(e: any) =>
                                this.changeColor(
                                  e.target.value,
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                )}
                            ></sl-color-picker>
                            <sl-icon-button
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.addRemoveData
                              )}
                              src=${IconTrash}
                              label="Settings"
                              @click=${() =>
                                this.deleteTableDataset(
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                )}
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
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                ].name}"
                                @sl-input=${(e: any) => {
                                  this.sharedState.scatterDatasets.sets[
                                    this.sharedState.scatterDatasets.sets
                                      .length -
                                      1 -
                                      index_reverse
                                  ].name = String(e.target.value);
                                }}
                              ></sl-input>
                            </div>
                          `
                        : html``
                    }
                  </div>
                </th>
                ${this.sharedState.scatterDatasets.sets[
                  this.sharedState.scatterDatasets.sets.length -
                    1 -
                    index_reverse
                ].labels.map(
                  (label, index_inlabels) =>
                    html`<th class="table-cell-name">
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
                            value="${label}"
                            @sl-input=${(e: any) => {
                              const newValue = e.target.value as string;
                              this.sharedState.scatterDatasets.sets[
                                this.sharedState.scatterDatasets.sets.length -
                                  1 -
                                  index_reverse
                              ].labels[index_inlabels] = String(newValue);
                            }}
                            @sl-blur=${() => {
                              const labels =
                                this.sharedState.scatterDatasets.sets[
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                ].labels;
                              const label = labels[index_inlabels];
                              if (
                                labels.some(
                                  (l, i) => l === label && i !== index_inlabels
                                )
                              ) {
                                this.sharedState.scatterDatasets.sets[
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                ].labels[index_inlabels] = `${label} (1)`;
                              }
                            }}
                          ></sl-input>
                        </div>

                        <sl-popup
                          placement="bottom"
                          strategy="fixed"
                          .active="${this.openColumnTypePopupIndexInLabels ===
                            index_inlabels &&
                          this.openColumnTypePopupIndexInSet ===
                            this.sharedState.scatterDatasets.sets.length -
                              1 -
                              index_reverse}"
                        >
                          <sl-icon-button
                            slot="anchor"
                            src=${IconCaretdown}
                            label="Toggle dropdown"
                            @click=${(e) => {
                              this.openColumnTypePopupIndexInLabels =
                                index_inlabels;
                              this.openColumnTypePopupIndexInSet =
                                this.sharedState.scatterDatasets.sets.length -
                                1 -
                                index_reverse;
                              e.target.focus();
                            }}
                            @blur="${() =>
                              (this.openColumnTypePopupIndexInSet =
                                -1 &&
                                (this.openColumnTypePopupIndexInLabels = -1))}"
                          ></sl-icon-button>

                          <div class="dropdown-content">
                            ${!this.sharedState.printable
                              ? html`<sl-menu-item
                                  @mousedown=${(e: MouseEvent) => {
                                    if (e.button !== 0) return;
                                    // e.preventDefault();
                                    // e.stopPropagation();
                                    this.deleteColumn(
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse,
                                      index_inlabels
                                    );
                                    this.openColumnTypePopupIndexInLabels = -1;
                                    this.openColumnTypePopupIndexInSet = -1;
                                  }}
                                  ?disabled=${!(
                                    this.sharedState.editable ||
                                    this.sharedState.teacherOptions
                                      .addRemoveData
                                  )}
                                >
                                  <sl-icon-button
                                    slot="prefix"
                                    src=${IconTrash}
                                    label="Settings"
                                  ></sl-icon-button>
                                  Delete Column
                                </sl-menu-item>`
                              : html``}
                            ${!this.sharedState.printable
                              ? html`<sl-menu-item
                                    type="checkbox"
                                    .checked=${this.sharedState.scatterDatasets
                                      .sets[
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse
                                    ].typeOfEachData[index_inlabels] ===
                                    "number"
                                      ? false
                                      : true}
                                    @mousedown=${(e: MouseEvent) => {
                                      if (e.button !== 0) return;
                                      this.sharedState.scatterDatasets.sets[
                                        this.sharedState.scatterDatasets.sets
                                          .length -
                                          1 -
                                          index_reverse
                                      ].typeOfEachData[index_inlabels] =
                                        "string";
                                      this.sharedState.scatterDatasets.sets[
                                        this.sharedState.scatterDatasets.sets
                                          .length -
                                          1 -
                                          index_reverse
                                      ].dimensional_data.map((data) => {
                                        data.data[index_inlabels] =
                                          data.data[index_inlabels].toString();
                                      });

                                      if (
                                        this.sharedState.scatterDatasets
                                          .selected.dataset_indexes.length ===
                                          1 &&
                                        this.sharedState.scatterDatasets
                                          .selected.dataset_indexes[0] ===
                                          this.sharedState.scatterDatasets.sets
                                            .length -
                                            1 -
                                            index_reverse &&
                                        this.sharedState.scatterDatasets.sets[
                                          this.sharedState.scatterDatasets.sets
                                            .length -
                                            1 -
                                            index_reverse
                                        ].filter?.label === label &&
                                        this.sharedState.scatterDatasets.sets[
                                          this.sharedState.scatterDatasets.sets
                                            .length -
                                            1 -
                                            index_reverse
                                        ].filter?.index_in_labels ===
                                          index_inlabels
                                      ) {
                                        this.sharedState.scatterDatasets.sets[
                                          this.sharedState.scatterDatasets.sets
                                            .length -
                                            1 -
                                            index_reverse
                                        ].filter.type = "string";
                                        updateColorForFilter(
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
                                          ].filter.index_in_labels,
                                          "string",
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
                                          ]
                                        );
                                      }
                                    }}
                                    class="button-datatype-category"
                                    >Convert column values to
                                    categorical</sl-menu-item
                                  >
                                  <sl-menu-item
                                    type="checkbox"
                                    .checked=${this.sharedState.scatterDatasets
                                      .sets[
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse
                                    ].typeOfEachData[index_inlabels] ===
                                    "number"
                                      ? true
                                      : false}
                                    @mousedown=${(e: MouseEvent) => {
                                      if (e.button !== 0) return;
                                      this.sharedState.scatterDatasets.sets[
                                        this.sharedState.scatterDatasets.sets
                                          .length -
                                          1 -
                                          index_reverse
                                      ].typeOfEachData[index_inlabels] =
                                        "number";
                                      this.sharedState.scatterDatasets.sets[
                                        this.sharedState.scatterDatasets.sets
                                          .length -
                                          1 -
                                          index_reverse
                                      ].dimensional_data.map((data) => {
                                        data.data[index_inlabels] = Number(
                                          data.data[index_inlabels]
                                        )
                                          ? Number(data.data[index_inlabels])
                                          : 0;

                                        if (
                                          this.sharedState.scatterDatasets
                                            .selected.dataset_indexes.length ===
                                            1 &&
                                          this.sharedState.scatterDatasets
                                            .selected.dataset_indexes[0] ===
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse &&
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
                                          ].filter?.label === label &&
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
                                          ].filter?.index_in_labels ===
                                            index_inlabels
                                        ) {
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
                                          ].filter.type = "number";
                                          updateColorForFilter(
                                            this.sharedState.scatterDatasets
                                              .sets[
                                              this.sharedState.scatterDatasets
                                                .sets.length -
                                                1 -
                                                index_reverse
                                            ].filter.index_in_labels,
                                            "number",
                                            this.sharedState.scatterDatasets
                                              .sets[
                                              this.sharedState.scatterDatasets
                                                .sets.length -
                                                1 -
                                                index_reverse
                                            ]
                                          );
                                        }
                                      });
                                    }}
                                    class="button-datatype-number"
                                    >Convert column values to
                                    numeric</sl-menu-item
                                  >`
                              : html``}
                          </div>
                        </sl-popup>
                      </div>
                    </th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${each_dataset.dimensional_data.map(
                (each_data_scatterplot, index_inscatter) => html`
                  <tr>
                    <td class="table-cell-id">
                      <div
                        style="display: flex; flex-direction: row; align-items: center"
                      >
                        ${!this.sharedState.printable
                          ? html` <sl-icon-button
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.addRemoveData
                              )}
                              src=${IconTrash}
                              label="Settings"
                              @click=${() =>
                                this.deleteRow(
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse,
                                  index_inscatter
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
                            type="number"
                            class="input"
                            value="${each_dataset.ids[index_inscatter]}"
                            @sl-input=${(e: any) =>
                              (each_dataset.ids[index_inscatter] = Number(
                                e.target.value
                              ))}
                          ></sl-input>
                        </div>
                      </div>
                    </td>

                    ${each_data_scatterplot.data.map(
                      (data, index_indata) => html`
                        <td
                          class="${this.sharedState.scatterDatasets.sets[
                            this.sharedState.scatterDatasets.sets.length -
                              1 -
                              index_reverse
                          ].typeOfEachData[index_indata] === "number"
                            ? "table-cell-number"
                            : "table-cell-category"}"
                        >
                          <div
                            style="display: flex; flex-direction: row; align-items: center"
                          >
                            <div class="input-wrapper">
                              <sl-input
                                ?disabled=${!(
                                  this.sharedState.editable ||
                                  this.sharedState.teacherOptions.changeData
                                )}
                                id="input-x-${this.sharedState.scatterDatasets
                                  .sets.length -
                                1 -
                                index_reverse}-${index_inscatter}-${index_indata}"
                                type="${each_dataset.typeOfEachData[
                                  index_indata
                                ] === "number"
                                  ? "number"
                                  : "text"}"
                                value="${data}"
                                @sl-input=${(e: any) => {
                                  each_dataset.typeOfEachData[index_indata] ===
                                  "number"
                                    ? (this.sharedState.scatterDatasets.sets[
                                        this.sharedState.scatterDatasets.sets
                                          .length -
                                          1 -
                                          index_reverse
                                      ].dimensional_data[index_inscatter].data[
                                        index_indata
                                      ] = Number(e.target.value))
                                    : (this.sharedState.scatterDatasets.sets[
                                        this.sharedState.scatterDatasets.sets
                                          .length -
                                          1 -
                                          index_reverse
                                      ].dimensional_data[index_inscatter].data[
                                        index_indata
                                      ] = String(e.target.value));
                                  if (
                                    this.sharedState.scatterDatasets.selected
                                      .dataset_indexes.length === 1 &&
                                    this.sharedState.scatterDatasets.selected
                                      .dataset_indexes[0] ===
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse &&
                                    this.sharedState.scatterDatasets.sets[
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse
                                    ].filter?.label ===
                                      each_dataset.labels[index_indata] &&
                                    this.sharedState.scatterDatasets.sets[
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse
                                    ].filter?.index_in_labels === index_indata
                                  ) {
                                    this.sharedState.scatterDatasets.sets[
                                      this.sharedState.scatterDatasets.sets
                                        .length -
                                        1 -
                                        index_reverse
                                    ].filter.type === "number"
                                      ? updateColorForFilter(
                                          index_indata,
                                          "number",
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
                                          ]
                                        )
                                      : updateColorForFilter(
                                          index_indata,
                                          "string",
                                          this.sharedState.scatterDatasets.sets[
                                            this.sharedState.scatterDatasets
                                              .sets.length -
                                              1 -
                                              index_reverse
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
                    .active=${this.addColumnPopupOpenIndex ===
                    this.sharedState.scatterDatasets.sets.length -
                      1 -
                      index_reverse}
                    style="z-index: 10"
                  >
                    <sl-icon-button
                      slot="anchor"
                      src=${IconPlusCircle}
                      label="Add Column"
                      @click=${(e) => {
                        this.addColumnPopupOpenIndex =
                          this.sharedState.scatterDatasets.sets.length -
                          1 -
                          index_reverse;
                        e.target.focus();
                      }}
                      @blur=${() => (this.addColumnPopupOpenIndex = -1)}
                    ></sl-icon-button>
                    <div class="popup-content">
                      <sl-menu-item
                        class="button-datatype-category"
                        @mousedown=${(e: MouseEvent) => {
                          if (e.button !== 0) return;
                          this.addStringColumn(
                            this.sharedState.scatterDatasets.sets.length -
                              1 -
                              index_reverse
                          );
                          this.addColumnPopupOpenIndex = -1;
                        }}
                      >
                        Categorical values
                      </sl-menu-item>
                      <sl-menu-item
                        class="button-datatype-number"
                        @mousedown=${(e: MouseEvent) => {
                          if (e.button !== 0) return;
                          this.addNumericColumn(
                            this.sharedState.scatterDatasets.sets.length -
                              1 -
                              index_reverse
                          );
                          this.addColumnPopupOpenIndex = -1;
                        }}
                      >
                        Numeric values
                      </sl-menu-item>
                    </div>
                  </sl-popup>
                `
              : html``
          }
          </div>
          ${
            this.sharedState.teacherOptions.addRemoveData
              ? html`<sl-icon-button
                  @click=${() =>
                    this.addRow(
                      this.sharedState.scatterDatasets.sets.length -
                        1 -
                        index_reverse
                    )}
                  src=${IconPlusCircle}
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
      "sl-menu-item": SlMenuItem,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-scatterdataset-input": ScatterDatasetInput;
  }
}
