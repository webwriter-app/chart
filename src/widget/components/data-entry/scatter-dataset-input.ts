import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { randomColor, randomNumber, randomString } from "../../utils";

import style from "./scatter-dataset-input.style";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import IconTrash from "bootstrap-icons/icons/trash.svg";
import IconPlusCircle from "bootstrap-icons/icons/plus-circle.svg";
import IconCaretdown from "bootstrap-icons/icons/caret-down.svg";
import { SelectDataset } from "./select-dataset";
import { updateColorForFilter } from "../charts/scatter/scatter-utils";
import StateComponent from "../../stateful-component";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-scatterdataset-input": ScatterDatasetInput;
  }
}
@customElement("wwci-scatterdataset-input")
export class ScatterDatasetInput extends StateComponent {
@property({ type: Boolean, attribute: true, reflect: true })
  accessor addDatasetPopupOpen = false;

@property({ type: Number, attribute: true, reflect: true })
  accessor addColumnPopupOpenIndex = -1;

@property({ type: Number, attribute: true, reflect: true })
  accessor openColumnTypePopupIndexInSet = -1;

@property({ type: Number, attribute: true, reflect: true })
  accessor openColumnTypePopupIndexInLabels = -1;

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

addNewDataset() {
    const newDataset = {
      color: randomColor(),
      name: randomString(),
      ids: [],
      labels: [],
      typeOfEachData: [],
      dimensional_data: [],
      filter: { label: "", type: "none", index_in_labels: -1 },
    };

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: [...this.sharedState.scatterDatasets.sets, newDataset],
      },
    };
    this.dispatchStateChange();
  }

addNumericColumn(index_inset: number) {
    const updatedSets = this.sharedState.scatterDatasets.sets.map(
      (dataset, i) => {
        if (i === index_inset) {
          return {
            ...dataset,
            labels: [...dataset.labels, randomString()],
            typeOfEachData: [...dataset.typeOfEachData, "number"],
            dimensional_data: dataset.dimensional_data.map((data) => ({
              ...data,
              data: [...data.data, randomNumber()],
            })),
          };
        }
        return dataset;
      }
    );

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
      },
    };
    this.dispatchStateChange();
  }

addStringColumn(index_inset: number) {
    const updatedSets = this.sharedState.scatterDatasets.sets.map(
      (dataset, i) => {
        if (i === index_inset) {
          return {
            ...dataset,
            labels: [...dataset.labels, randomString()],
            typeOfEachData: [...dataset.typeOfEachData, "string"],
            dimensional_data: dataset.dimensional_data.map((data) => ({
              ...data,
              data: [...data.data, randomString()],
            })),
          };
        }
        return dataset;
      }
    );

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
      },
    };
    this.dispatchStateChange();
  }

addRow(index_inset: number) {
    const newId =
      Math.max(0, ...this.sharedState.scatterDatasets.sets[index_inset].ids) +
      1;
    const newRow = {
      data: this.sharedState.scatterDatasets.sets[
        index_inset
      ].typeOfEachData.map((d) =>
        d === "number" ? randomNumber() : randomString()
      ),
      selected: false,
    };

    const updatedSets = this.sharedState.scatterDatasets.sets.map(
      (dataset, i) => {
        if (i === index_inset) {
          return {
            ...dataset,
            ids: [...dataset.ids, newId],
            dimensional_data: [...dataset.dimensional_data, newRow],
          };
        }
        return dataset;
      }
    );

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
      },
    };

    this.updateFilter(index_inset);

    this.dispatchStateChange();
  }

updateFilter(index_inset: number) {
    if (
      this.sharedState.scatterDatasets.sets[index_inset].filter &&
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
    const updatedSets = this.sharedState.scatterDatasets.sets.map(
      (dataset, i) => {
        if (i === index_inset) {
          return {
            ...dataset,
            ids: dataset.ids.filter(
              (_, idx) => idx !== index_indata_scatterplot
            ),
            dimensional_data: dataset.dimensional_data.filter(
              (_, idx) => idx !== index_indata_scatterplot
            ),
          };
        }
        return dataset;
      }
    );

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
      },
    };
    this.updateFilter(index_inset);
    this.dispatchStateChange();
  }

deleteTableDataset(index_inset: number) {
    const updatedSets = this.sharedState.scatterDatasets.sets.filter(
      (_, i) => i !== index_inset
    );

    let updatedDatasetIndexes =
      this.sharedState.scatterDatasets.selected.dataset_indexes.filter(
        (index) => index !== index_inset
      );
    // make index > index_inset -1
    updatedDatasetIndexes = updatedDatasetIndexes.map((index) =>
      index > index_inset ? index - 1 : index
    );

    // if there is only dataset, remove line datasets and selected axis to None
    if (
      index_inset ===
        this.sharedState.scatterDatasets.selected.dataset_indexes[0] &&
      this.sharedState.scatterDatasets.selected.dataset_indexes.length === 1
    ) {
      updatedDatasetIndexes = [];
      this.sharedState = {
        ...this.sharedState,
        scatterDatasets: {
          ...this.sharedState.scatterDatasets,
          selected: {
            ...this.sharedState.scatterDatasets.selected,
            axis: {
              x: "None",
              y: "None",
            },
          },
        },
      };
      // when only one dataset => remove line datasets
      this.sharedState.lineDatasets.sets = [];
    }

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
        selected: {
          ...this.sharedState.scatterDatasets.selected,
          dataset_indexes: updatedDatasetIndexes,
        },
      },
    };
    this.dispatchStateChange();
  }

recoverColorForFilter(index_inset: number) {
    const selectedDataset = this.sharedState.scatterDatasets.sets[index_inset];
    const updatedFilter = selectedDataset.dimensional_data.map((d) => ({
      ...d,
      color: selectedDataset.color,
    }));

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: this.sharedState.scatterDatasets.sets.map((dataset, i) => {
          if (i === index_inset) {
            return {
              ...dataset,
              dimensional_data: updatedFilter,
            };
          }
          return dataset;
        }),
      },
    };
  }

deleteColumn(index_inset: number, index_inlabels: number) {
    // recover color for filter if the column was selected as filter

    if (
      this.sharedState.scatterDatasets.sets[index_inset].filter
        ?.index_in_labels === index_inlabels
    ) {
      this.recoverColorForFilter(index_inset);
    }

    const updatedSets = this.sharedState.scatterDatasets.sets.map(
      (dataset, i) => {
        if (i === index_inset) {
          return {
            ...dataset,
            labels: dataset.labels.filter((_, idx) => idx !== index_inlabels),
            typeOfEachData: dataset.typeOfEachData.filter(
              (_, idx) => idx !== index_inlabels
            ),
            dimensional_data: dataset.dimensional_data.map((data) => ({
              ...data,
              data: data.data.filter((_, idx) => idx !== index_inlabels),
            })),
            filter:
              dataset.filter.index_in_labels === index_inlabels
                ? {
                    label: "",
                    type: "none",
                    index_in_labels: -1,
                  }
                : dataset.filter,
          };
        }
        return dataset;
      }
    );
    const updatedSelectedAxis = {
      ...this.sharedState.scatterDatasets.selected.axis,
    };

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
          const updatedDatasetIndexes =
            this.sharedState.scatterDatasets.selected.dataset_indexes.filter(
              (index) => index !== index_inset
            );

          this.sharedState = {
            ...this.sharedState,
            scatterDatasets: {
              ...this.sharedState.scatterDatasets,
              selected: {
                ...this.sharedState.scatterDatasets.selected,
                dataset_indexes: updatedDatasetIndexes,
              },
            },
          };
          // if there is only one dataset, deselect the axis
        } else {
          if (
            this.sharedState.scatterDatasets.selected.axis.x === deletedLabel
          ) {
            updatedSelectedAxis.x = "None";
          } else {
            updatedSelectedAxis.y = "None";
          }
        }
      }
    }
    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
        selected: {
          ...this.sharedState.scatterDatasets.selected,
          axis: updatedSelectedAxis,
        },
      },
    };

    this.dispatchStateChange();
  }

changeColor(color: string, index_inset: number) {
    const updatedSets = this.sharedState.scatterDatasets.sets.map(
      (dataset, i) => {
        if (i === index_inset) {
          return { ...dataset, color: color };
        }
        return dataset;
      }
    );

    this.sharedState = {
      ...this.sharedState,
      scatterDatasets: {
        ...this.sharedState.scatterDatasets,
        sets: updatedSets,
      },
    };
    // ensure the color updated, when no filter is selected
    if (
      !this.sharedState.scatterDatasets.sets[index_inset].filter ||
      this.sharedState.scatterDatasets.sets[index_inset].filter.type ===
        "none" ||
      this.sharedState.scatterDatasets.sets[index_inset].filter
        .index_in_labels === -1
    ) {
      this.recoverColorForFilter(index_inset);
    }
    this.dispatchStateChange();
  }

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
          <wwci-select-dataset
            .sharedState=${this.sharedState}
          ></wwci-select-dataset>
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
                            <sl-color-picker
                            size="small"
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.changeData
                              )}
                              value="${
                                this.sharedState.scatterDatasets.sets[
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                ].color
                              }"
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
                              @click=${(e) => {
                                e.preventDefault(); // Prevent default selection behavior
                                e.stopPropagation(); // Stop propagation to avoid other side effects
                                this.deleteTableDataset(
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse
                                );
                              }}
                            ></sl-icon-button>
                            <div class="input-wrapper">
                              <sl-input
                                ?disabled=${!(
                                  this.sharedState.editable ||
                                  this.sharedState.teacherOptions.changeData
                                )}
                                type="text"
                                class="input"
                                value="${
                                  this.sharedState.scatterDatasets.sets[
                                    this.sharedState.scatterDatasets.sets
                                      .length -
                                      1 -
                                      index_reverse
                                  ].name
                                }"
                                @sl-input=${(e: any) => {
                                  const updatedSets =
                                    this.sharedState.scatterDatasets.sets.map(
                                      (dataset, i) => {
                                        if (
                                          i ===
                                          this.sharedState.scatterDatasets.sets
                                            .length -
                                            1 -
                                            index_reverse
                                        ) {
                                          return {
                                            ...dataset,
                                            name: e.target.value,
                                          };
                                        }
                                        return dataset;
                                      }
                                    );
                                  this.sharedState = {
                                    ...this.sharedState,
                                    scatterDatasets: {
                                      ...this.sharedState.scatterDatasets,
                                      sets: updatedSets,
                                    },
                                  };
                                  this.dispatchStateChange();
                                }}
                              ></sl-input>
                            </div>
                          
                    
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
                              let newValue = String(e.target.value);
                              const targetIndex =
                                this.sharedState.scatterDatasets.sets.length -
                                1 -
                                index_reverse;
                              const targetDataset =
                                this.sharedState.scatterDatasets.sets[
                                  targetIndex
                                ];
                              // Check if we need to update the filter and color
                              let updatedFilter = targetDataset.filter;
                              if (
                                targetDataset.filter?.index_in_labels ===
                                index_inlabels
                              ) {
                                updatedFilter = {
                                  ...targetDataset.filter,
                                  label: newValue,
                                };
                              }
                              const updatedIndexes = [
                                ...this.sharedState.scatterDatasets.selected
                                  .dataset_indexes,
                              ];
                              // check for the selected axis
                              if (
                                this.sharedState.scatterDatasets.selected
                                  .dataset_indexes.length === 1 &&
                                this.sharedState.scatterDatasets.selected
                                  .dataset_indexes[0] === targetIndex
                              ) {
                                if (
                                  this.sharedState.scatterDatasets.selected.axis
                                    .x === label
                                ) {
                                  this.sharedState.scatterDatasets.selected.axis.x =
                                    newValue;
                                } else if (
                                  this.sharedState.scatterDatasets.selected.axis
                                    .y === label
                                ) {
                                  this.sharedState.scatterDatasets.selected.axis.y =
                                    newValue;
                                }
                                if (
                                  this.sharedState.scatterDatasets.selected.axis
                                    .x ===
                                  this.sharedState.scatterDatasets.selected.axis
                                    .y
                                ) {
                                  this.sharedState.scatterDatasets.selected.axis.y =
                                    "None";

                                  this.sharedState.scatterDatasets.selected.axis.x =
                                    "None";
                                }
                              } else if (
                                this.sharedState.scatterDatasets.selected
                                  .dataset_indexes.length > 1 &&
                                this.sharedState.scatterDatasets.selected.dataset_indexes.includes(
                                  targetIndex
                                )
                              ) {
                                if (
                                  this.sharedState.scatterDatasets.selected.axis
                                    .x === label ||
                                  this.sharedState.scatterDatasets.selected.axis
                                    .y === label
                                ) {
                                  const index =
                                    updatedIndexes.indexOf(targetIndex);
                                  updatedIndexes.splice(index, 1);
                                }
                              }

                              const updatedSets =
                                this.sharedState.scatterDatasets.sets.map(
                                  (dataset, i) => {
                                    if (i === targetIndex) {
                                      const updatedLabels = dataset.labels.map(
                                        (label, labelIndex) =>
                                          labelIndex === index_inlabels
                                            ? newValue
                                            : label
                                      );
                                      return {
                                        ...dataset,
                                        labels: updatedLabels, // Update labels immutably
                                        filter: updatedFilter,
                                      };
                                    }
                                    return dataset;
                                  }
                                );
                              const updatedState = {
                                ...this.sharedState,
                                scatterDatasets: {
                                  ...this.sharedState.scatterDatasets,
                                  sets: updatedSets,
                                  selected: {
                                    ...this.sharedState.scatterDatasets
                                      .selected,
                                    dataset_indexes: updatedIndexes,
                                  },
                                },
                              };
                              this.sharedState = updatedState;
                              this.dispatchStateChange();
                            }}
                            @sl-blur=${() => {
                              const targetIndex =
                                this.sharedState.scatterDatasets.sets.length -
                                1 -
                                index_reverse;
                              const dataset =
                                this.sharedState.scatterDatasets.sets[
                                  targetIndex
                                ];
                              const labels = dataset.labels;
                              const label = labels[index_inlabels];
                              // if the label is "" or " ", then set it to "Column"
                              if (label === "" || label === " ") {
                                const updatedLabels = labels.map((l, i) =>
                                  i === index_inlabels ? "newAttribute" : l
                                );

                                const updatedSets =
                                  this.sharedState.scatterDatasets.sets.map(
                                    (set, i) =>
                                      i === targetIndex
                                        ? { ...set, labels: updatedLabels }
                                        : set
                                  );

                                this.sharedState = {
                                  ...this.sharedState,
                                  scatterDatasets: {
                                    ...this.sharedState.scatterDatasets,
                                    sets: updatedSets,
                                  },
                                };
                                // if one of the axis is "" or " ", then set it to "newAttribute"
                                if (
                                  this.sharedState.scatterDatasets.selected.axis
                                    .x === label
                                ) {
                                  this.sharedState.scatterDatasets.selected.axis.x =
                                    "newAttribute";
                                } else if (
                                  this.sharedState.scatterDatasets.selected.axis
                                    .y === label
                                ) {
                                  this.sharedState.scatterDatasets.selected.axis.y =
                                    "newAttribute";
                                }
                                this.dispatchStateChange();
                              }
                              if (
                                labels.some(
                                  (l, i) => l === label && i !== index_inlabels
                                )
                              ) {
                                const updatedLabels = labels.map((l, i) =>
                                  i === index_inlabels ? `${label}(1)` : l
                                );

                                const updatedSets =
                                  this.sharedState.scatterDatasets.sets.map(
                                    (set, i) =>
                                      i === targetIndex
                                        ? { ...set, labels: updatedLabels }
                                        : set
                                  );

                                this.sharedState = {
                                  ...this.sharedState,
                                  scatterDatasets: {
                                    ...this.sharedState.scatterDatasets,
                                    sets: updatedSets,
                                  },
                                };
                                this.dispatchStateChange();
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
                            @blur="${() => { this.openColumnTypePopupIndexInSet = -1; this.openColumnTypePopupIndexInLabels = -1; }}"
                          ></sl-icon-button>

                          <div class="dropdown-content">
                            <sl-menu-item
                              @mousedown=${(e: MouseEvent) => {
                                if (e.button !== 0) return;
                                e.preventDefault();
                                e.stopPropagation();
                                this.deleteColumn(
                                  this.sharedState.scatterDatasets.sets.length -
                                    1 -
                                    index_reverse,
                                  index_inlabels
                                );
                                this.openColumnTypePopupIndexInLabels = -1;
                                this.openColumnTypePopupIndexInSet = -1;
                              }}
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.addRemoveData
                              )}
                            >
                              <sl-icon-button
                                slot="prefix"
                                src=${IconTrash}
                                label="Settings"
                              ></sl-icon-button>
                              Delete Column
                            </sl-menu-item>
                            <sl-menu-item
                              type="checkbox"
                              .checked=${this.sharedState.scatterDatasets.sets[
                                this.sharedState.scatterDatasets.sets.length -
                                  1 -
                                  index_reverse
                              ].typeOfEachData[index_inlabels] === "number"
                                ? false
                                : true}
                              @mousedown=${(e: MouseEvent) => {
                                if (e.button !== 0) return;
                                e.preventDefault(); // Prevent default selection behavior
                                e.stopPropagation(); // Stop propagation to avoid other side effects
                                const targetIndex =
                                  this.sharedState.scatterDatasets.sets.length -
                                  1 -
                                  index_reverse;
                                const targetDataset =
                                  this.sharedState.scatterDatasets.sets[
                                    targetIndex
                                  ];

                                // Update the typeOfEachData array immutably
                                const updatedTypeOfEachData =
                                  targetDataset.typeOfEachData.map((type, i) =>
                                    i === index_inlabels ? "string" : type
                                  );

                                // Update the dimensional_data immutably
                                const updatedDimensionalData =
                                  targetDataset.dimensional_data.map(
                                    (data) => ({
                                      ...data,
                                      data: data.data.map((d, i) =>
                                        i === index_inlabels ? d.toString() : d
                                      ),
                                    })
                                  );
                                let updatedFilter = targetDataset.filter;
                                // check if we need to update the filter and color
                                if (
                                  targetDataset.filter?.label === label &&
                                  targetDataset.filter?.index_in_labels ===
                                    index_inlabels
                                ) {
                                  updatedFilter = {
                                    ...targetDataset.filter,
                                    type: "string",
                                  };
                                }
                                // Update the sets array immutably
                                const updatedSets =
                                  this.sharedState.scatterDatasets.sets.map(
                                    (dataset, i) =>
                                      i === targetIndex
                                        ? {
                                            ...dataset,
                                            typeOfEachData:
                                              updatedTypeOfEachData,
                                            dimensional_data:
                                              updatedDimensionalData,
                                            filter: updatedFilter,
                                          }
                                        : dataset
                                  );

                                this.sharedState = {
                                  ...this.sharedState,
                                  scatterDatasets: {
                                    ...this.sharedState.scatterDatasets,
                                    sets: updatedSets,
                                  },
                                };
                                this.updateFilter(targetIndex);
                                this.dispatchStateChange();
                              }}
                              class="button-datatype-category"
                              >Convert column values to
                              categorical</sl-menu-item
                            >
                            <sl-menu-item
                              type="checkbox"
                              .checked=${this.sharedState.scatterDatasets.sets[
                                this.sharedState.scatterDatasets.sets.length -
                                  1 -
                                  index_reverse
                              ].typeOfEachData[index_inlabels] === "number"
                                ? true
                                : false}
                              @mousedown=${(e: MouseEvent) => {
                                if (e.button !== 0) return;
                                const targetIndex =
                                  this.sharedState.scatterDatasets.sets.length -
                                  1 -
                                  index_reverse;
                                const targetDataset =
                                  this.sharedState.scatterDatasets.sets[
                                    targetIndex
                                  ];

                                // Update the typeOfEachData array immutably
                                const updatedTypeOfEachData =
                                  targetDataset.typeOfEachData.map((type, i) =>
                                    i === index_inlabels ? "number" : type
                                  );

                                // Update the dimensional_data immutably
                                const updatedDimensionalData =
                                  targetDataset.dimensional_data.map(
                                    (data) => ({
                                      ...data,
                                      data: data.data.map((d, i) =>
                                        i === index_inlabels
                                          ? Number(d)
                                            ? Number(d)
                                            : 0
                                          : d
                                      ),
                                    })
                                  );

                                // Check if we need to update the filter and color
                                let updatedFilter = targetDataset.filter;
                                if (
                                  targetDataset.filter?.label === label &&
                                  targetDataset.filter?.index_in_labels ===
                                    index_inlabels
                                ) {
                                  updatedFilter = {
                                    ...targetDataset.filter,
                                    type: "number",
                                  };
                                }

                                // Update the sets array immutably
                                const updatedSets =
                                  this.sharedState.scatterDatasets.sets.map(
                                    (dataset, i) =>
                                      i === targetIndex
                                        ? {
                                            ...dataset,
                                            typeOfEachData:
                                              updatedTypeOfEachData,
                                            dimensional_data:
                                              updatedDimensionalData,
                                            filter: updatedFilter,
                                          }
                                        : dataset
                                  );

                                this.sharedState = {
                                  ...this.sharedState,
                                  scatterDatasets: {
                                    ...this.sharedState.scatterDatasets,
                                    sets: updatedSets,
                                  },
                                };
                                this.updateFilter(targetIndex);
                                this.dispatchStateChange();
                              }}
                              class="button-datatype-number"
                              >Convert column values to numeric</sl-menu-item
                            >
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
                        <sl-icon-button
                          ?disabled=${!(
                            this.sharedState.editable ||
                            this.sharedState.teacherOptions.addRemoveData
                          )}
                          src=${IconTrash}
                          label="Settings"
                          @click=${(e) => {
                            e.preventDefault(); // Prevent default selection behavior
                            e.stopPropagation(); // Stop propagation to avoid other side effects
                            this.deleteRow(
                              this.sharedState.scatterDatasets.sets.length -
                                1 -
                                index_reverse,
                              index_inscatter
                            );
                          }}
                        ></sl-icon-button>
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
                            @sl-input=${(e: any) => {
                              e.target.value = e.target.value.replaceAll(
                                /[^\d.,\-]+/g,
                                ""
                              );
                              const newNumber = Number(e.target.value);
                              if (isNaN(newNumber)) return;
                              const targetIndex =
                                this.sharedState.scatterDatasets.sets.length -
                                1 -
                                index_reverse;
                              const updatedSets =
                                this.sharedState.scatterDatasets.sets.map(
                                  (dataset, i) =>
                                    i === targetIndex
                                      ? {
                                          ...dataset,
                                          ids: dataset.ids.map((id, idx) =>
                                            idx === index_inscatter
                                              ? newNumber
                                              : id
                                          ),
                                        }
                                      : dataset
                                );
                              this.sharedState = {
                                ...this.sharedState,
                                scatterDatasets: {
                                  ...this.sharedState.scatterDatasets,
                                  sets: updatedSets,
                                },
                              };

                              this.dispatchStateChange();
                            }}
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
                                type="text"
                                value="${data}"
                                @sl-input=${(e: any) => {
                                  const targetIndex =
                                    this.sharedState.scatterDatasets.sets
                                      .length -
                                    1 -
                                    index_reverse;
                                  const targetDataset =
                                    this.sharedState.scatterDatasets.sets[
                                      targetIndex
                                    ];
                                  const updatedDimensionalData =
                                    targetDataset.dimensional_data.map(
                                      (dimData, idxScatter) => {
                                        if (idxScatter !== index_inscatter)
                                          return dimData;

                                        const updatedData = dimData.data.map(
                                          (data, idx) =>
                                            idx === index_indata
                                              ? each_dataset.typeOfEachData[
                                                  index_indata
                                                ] === "number"
                                                ? (() => {
                                                    e.target.value =
                                                      e.target.value.replaceAll(
                                                        /[^\d.,\-]+/g,
                                                        ""
                                                      );
                                                    const number = Number(
                                                      e.target.value
                                                    );
                                                    if (isNaN(number)) {
                                                      return data;
                                                    }
                                                    return number;
                                                  })()
                                                : String(e.target.value)
                                              : data
                                        );

                                        return {
                                          ...dimData,
                                          data: updatedData,
                                        };
                                      }
                                    );

                                  let updatedFilter = targetDataset.filter;
                                  // Update the filter and color if the column is selected as filter
                                  if (
                                    targetDataset.filter?.label ===
                                      each_dataset.labels[index_indata] &&
                                    targetDataset.filter?.index_in_labels ===
                                      index_indata
                                  ) {
                                    updatedFilter = {
                                      ...targetDataset.filter,
                                      type:
                                        each_dataset.typeOfEachData[
                                          index_indata
                                        ] === "number"
                                          ? "number"
                                          : "string",
                                    };
                                  }
                                  const updatedSets =
                                    this.sharedState.scatterDatasets.sets.map(
                                      (dataset, i) =>
                                        i === targetIndex
                                          ? {
                                              ...dataset,
                                              dimensional_data:
                                                updatedDimensionalData,
                                              filter: updatedFilter,
                                            }
                                          : dataset
                                    );

                                  this.sharedState = {
                                    ...this.sharedState,
                                    scatterDatasets: {
                                      ...this.sharedState.scatterDatasets,
                                      sets: updatedSets,
                                    },
                                  };
                                  this.updateFilter(targetIndex);
                                  this.dispatchStateChange();
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
            this.sharedState.teacherOptions.addRemoveData
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
                        this.dispatchStateChange();
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
}