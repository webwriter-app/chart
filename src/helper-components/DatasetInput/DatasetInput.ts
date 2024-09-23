import { html } from "lit";
import { customElement } from "lit/decorators.js";

import {
  csvToDataset,
  randomColor,
  randomNumber,
  randomString,
  readFileInput,
} from "../../functions";

import style from "./DatasetInput.style";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js";
import IconTrash from "bootstrap-icons/icons/trash.svg";
import IconPlusCircle from "bootstrap-icons/icons/plus-circle.svg";
import { FileUploadButton } from "../FileUploadButton";
import StateComponent from "../../stateComponent";

@customElement("wwci-dataset-input")
export class DatasetInput extends StateComponent {
  addDataset() {
    const newDataset = {
      name: randomString(),
      color: randomColor(),
      colors: this.sharedState.chart.datasets.sets[0].colors,
      data: Array(this.sharedState.chart.datasets.sets[0].data.length)
        .fill("")
        .map(() => randomNumber()),
    };
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: {
          ...this.sharedState.chart.datasets,
          sets: [...this.sharedState.chart.datasets.sets, newDataset],
        },
      },
    };
    this.dispatchStateChange();
  }

  addColumn() {
    const updatedSets = this.sharedState.chart.datasets.sets.map((dataset) => {
      return {
        ...dataset,
        data: [...dataset.data, randomNumber()],
        colors: [...dataset.colors, randomColor()],
      };
    });
    const updatedLabels = [
      ...this.sharedState.chart.datasets.labels,
      randomString(),
    ];

    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: {
          ...this.sharedState.chart.datasets,
          sets: updatedSets,
          labels: updatedLabels,
        },
      },
    };
    this.dispatchStateChange();
  }

  deleteColumn(i: number) {
    const updatedSets = this.sharedState.chart.datasets.sets.map((dataset) => {
      return {
        ...dataset,
        data: dataset.data.filter((_, j) => j !== i),
        colors: dataset.colors.filter((_, j) => j !== i),
      };
    });
    const updatedLabels = this.sharedState.chart.datasets.labels.filter(
      (_, j) => j !== i
    );

    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: {
          ...this.sharedState.chart.datasets,
          sets: updatedSets,
          labels: updatedLabels,
        },
      },
    };
    this.dispatchStateChange();
  }

  deleteDataset(i: number) {
    const updatedSets = this.sharedState.chart.datasets.sets.filter(
      (_, j) => j !== i
    );
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        datasets: {
          ...this.sharedState.chart.datasets,
          sets: updatedSets,
        },
      },
    };
    this.dispatchStateChange();
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
                            @sl-input=${(e: any) => {
                              const newLabels =
                                this.sharedState.chart.datasets.labels.map(
                                  (label, index) =>
                                    index === i ? e.target.value : label
                                );
                              this.sharedState = {
                                ...this.sharedState, // spread the existing sharedState
                                chart: {
                                  ...this.sharedState.chart, // spread the existing chart
                                  datasets: {
                                    ...this.sharedState.chart.datasets, // spread the existing datasets
                                    labels: newLabels, // update the labels array immutably
                                  },
                                },
                              };
                              this.dispatchStateChange();
                            }}
                          ></sl-input>
                        </div>
                        ${!this.sharedState.printable
                          ? html`<sl-icon-button
                              ?disabled=${!(
                                this.sharedState.editable ||
                                this.sharedState.teacherOptions.addRemoveData
                              )}
                              src=${IconTrash}
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
                              src=${IconTrash}
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
                            @sl-input=${(e: any) => {
                              const newSets =
                                this.sharedState.chart.datasets.sets.map(
                                  (set, index) =>
                                    index === i
                                      ? { ...set, name: e.target.value }
                                      : set
                                );

                              this.sharedState = {
                                ...this.sharedState, // spread the existing sharedState
                                chart: {
                                  ...this.sharedState.chart, // spread the existing chart
                                  datasets: {
                                    ...this.sharedState.chart.datasets, // spread the existing datasets
                                    sets: newSets, // update the sets array immutably
                                  },
                                },
                              };
                              this.dispatchStateChange();
                            }}
                          ></sl-input>
                        </div>

                        ${!this.sharedState.printable
                          ? html`
                              <sl-color-picker
                                size="small"
                                ?disabled=${!(
                                  this.sharedState.editable ||
                                  this.sharedState.teacherOptions.changeData
                                )}
                                value="${this.sharedState.chart.datasets.sets[i]
                                  .color}"
                                @sl-input=${(e: any) => {
                                  const newSets =
                                    this.sharedState.chart.datasets.sets.map(
                                      (set, index) =>
                                        index === i
                                          ? { ...set, color: e.target.value }
                                          : set
                                    );
                                  this.sharedState = {
                                    ...this.sharedState, // spread the existing sharedState
                                    chart: {
                                      ...this.sharedState.chart, // spread the existing chart
                                      datasets: {
                                        ...this.sharedState.chart.datasets, // spread the existing datasets
                                        sets: newSets, // update the sets array immutably
                                      },
                                    },
                                  };
                                  this.dispatchStateChange();
                                }}
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
                                @sl-input=${(e: any) => {
                                  const newSets =
                                    this.sharedState.chart.datasets.sets.map(
                                      (set, index) => {
                                        if (index === i) {
                                          // Update the specific data point in the dataset
                                          const newData = set.data.map(
                                            (dataPoint, dataIndex) =>
                                              dataIndex === j
                                                ? Number(e.target.value)
                                                : dataPoint
                                          );

                                          // Return the updated set with the new data array
                                          return { ...set, data: newData };
                                        }

                                        // Return the original set if the index doesn't match
                                        return set;
                                      }
                                    );

                                  this.sharedState = {
                                    ...this.sharedState, // spread the existing sharedState
                                    chart: {
                                      ...this.sharedState.chart, // spread the existing chart
                                      datasets: {
                                        ...this.sharedState.chart.datasets, // spread the existing datasets
                                        sets: newSets, // update the sets array immutably with new data
                                      },
                                    },
                                  };
                                  this.dispatchStateChange();
                                }}
                              ></sl-input>
                            </div>

                            ${!this.sharedState.printable
                              ? html`<sl-color-picker
                                  size="small"
                                  ?disabled=${!(
                                    this.sharedState.editable ||
                                    this.sharedState.teacherOptions.changeData
                                  )}
                                  value="${this.sharedState.chart.datasets.sets[
                                    i
                                  ].colors[j]}"
                                  @sl-input=${(e: any) => {
                                    const newSets =
                                      this.sharedState.chart.datasets.sets.map(
                                        (set, setIndex) => {
                                          if (setIndex === i) {
                                            // Update the specific color at index j in the colors array
                                            const newColors = set.colors.map(
                                              (color, colorIndex) =>
                                                colorIndex === j
                                                  ? e.target.value
                                                  : color
                                            );

                                            // Return the updated set with the new colors array
                                            return {
                                              ...set,
                                              colors: newColors,
                                            };
                                          }

                                          // Return the original set if the index doesn't match
                                          return set;
                                        }
                                      );

                                    this.sharedState = {
                                      ...this.sharedState, // spread the existing sharedState
                                      chart: {
                                        ...this.sharedState.chart, // spread the existing chart
                                        datasets: {
                                          ...this.sharedState.chart.datasets, // spread the existing datasets
                                          sets: newSets, // update the sets array immutably with new colors
                                        },
                                      },
                                    };
                                    this.dispatchStateChange();
                                  }}
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
                  src=${IconPlusCircle}
                  label="Add Column"
                ></sl-icon-button>
                <sl-icon-button
                  @click=${this.addDataset}
                  src=${IconPlusCircle}
                  label="Add Dataset"
                ></sl-icon-button>

                <br />
                <wwci-file-upload-button
                  @wwcifileinput=${async (e) => {
                    const fileContent = await readFileInput(e.detail.value);
                    const { datasets, title } = csvToDataset(fileContent);
                    // Create a new immutable sharedState object
                    this.sharedState = {
                      ...this.sharedState, // spread the existing sharedState
                      chart: {
                        ...this.sharedState.chart, // spread the existing chart
                        datasets: {
                          ...this.sharedState.chart.datasets, // spread the existing datasets
                          sets: datasets.sets, // update the sets array with the new datasets
                          labels: datasets.labels, // update labels if necessary (optional, depends on your csvToDataset result)
                        },
                        title: title, // update the title immutably
                      },
                    };
                    this.dispatchStateChange();
                  }}
                ></wwci-file-upload-button>
              `
            : html``}
        </div>
      </div>
    </div>`;
  }

  static styles = style;
  public static get scopedElements() {
    return {
      "sl-icon-button": SlIconButton,
      "sl-input": SlInput,
      "sl-color-picker": SlColorPicker,
      "wwci-file-upload-button": FileUploadButton,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-dataset-input": DatasetInput;
  }
}
