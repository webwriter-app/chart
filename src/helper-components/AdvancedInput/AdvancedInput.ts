import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  //attribute,
  //csvToDataset,
  randomColor,
  randomNumber,
  randomString,
  // readFileInput,
} from "../../functions";

import style from "./AdvancedInput.style";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import { SharedTestStateMixin } from "../../state";
import { FileUploadButton } from "../FileUploadButton";
import { LitElementWw } from "@webwriter/lit";
import { Select } from "../Select";

@customElement("wwci-advanced-input")
export class AdvancedInput extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  @property({ type: Array }) list_labels: string[];
  @property({ type: Boolean }) disabled: boolean;

  @state() addColumnPopupOpen = false;

  addDataset() {
    let dataset: (number | string)[] = [];
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets[0].data.forEach(
      (element) => {
        typeof element === "number"
          ? dataset.push(randomNumber())
          : dataset.push(element);
      }
    );
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.push({
      id: this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets
        ? this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets[
            this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced
              .sets.length - 1
          ].id + 1
        : 0,
      data: dataset,
    });
  }

  addFirstDataset() {
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.color =
      randomColor();
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.push(
      randomString()
    );
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.push({
      id: 1,
      data: Array(1)
        .fill("")
        .map(() => randomNumber()),
    });
  }

  addNumberColumn() {
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.push(
      randomString()
    );
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets =
      this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.map(
        (dataset) => {
          dataset.data.push(randomNumber());
          return dataset;
        }
      );
  }
  addStringColumn() {
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.push(
      randomString()
    );
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets =
      this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.map(
        (dataset) => {
          dataset.data.push(randomString());
          return dataset;
        }
      );
  }

  deleteColumn(i: number) {
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.splice(
      i,
      1
    );
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets =
      this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.map(
        (dataset) => {
          dataset.data.splice(i, 1);
          return dataset;
        }
      );
    this.list_labels = ["none"].concat(
      this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels
    );
    this.disabled = this.list_labels.length === 0 ? true : false;
  }

  deleteDataset(i: number) {
    this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.splice(
      i,
      1
    );
  }
  // TODO: Fix disable when delete all columns
  // TODO: fix name of wwci-select while editing x and y axis names?
  render() {
    this.list_labels = ["none"].concat(
      this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels
    );
    this.disabled = this.list_labels.length === 0 ? true : false;
    if (
      this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets
        .length === 0
    )
      return html`<sl-button
        class="add-dataset-button"
        @click=${() => this.addFirstDataset}
        >Add Dataset</sl-button
      >`;
    return html`
      <div class="wrapper">
        <div class="container">
          <p class="text">X-Axis</p>
          <wwci-select
            .value="${this.list_labels.includes(
              this.sharedState.scatterplotAdvanced.selectedX
            )
              ? this.sharedState.scatterplotAdvanced.selectedX
              : this.list_labels[0]}"
            ?disabled=${this.disabled}
            .selectOptions="${this.list_labels}"
            @wwci-change="${(e: any) => {
              this.sharedState.scatterplotAdvanced.selectedX = e.target.value;
            }}"
          >
          </wwci-select>
        </div>
        <div class="container">
          <p class="text">Y-Axis</p>
          <wwci-select
            .value="${this.list_labels.includes(
              this.sharedState.scatterplotAdvanced.selectedY
            )
              ? this.sharedState.scatterplotAdvanced.selectedY
              : this.list_labels[0]}"
            ?disabled=${this.disabled}
            .selectOptions="${this.list_labels}"
            @wwci-change="${(e: any) => {
              this.sharedState.scatterplotAdvanced.selectedY = e.target.value;
            }}"
          >
          </wwci-select>
        </div>

        <div class="table-layout-container">
          <table>
            <thead>
              <tr>
                <th>
                  <div
                    style="display: flex; flex-direction: row; align-items: center"
                  >
                    <div class="input-wrapper">
                      <p>ID</p>
                    </div>
                    ${!this.sharedState.printable
                      ? html`
                          <sl-color-picker
                            ?disabled=${!(
                              this.sharedState.editable ||
                              this.sharedState.teacherOptions.changeData
                            )}
                            value="${this.sharedState.scatterplotAdvanced
                              .scatterplotdatasetsAdvanced.color}"
                            @sl-input=${(e: any) =>
                              (this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.color =
                                e.target.value)}
                          ></sl-color-picker>
                        `
                      : html``}
                  </div>
                </th>
                ${this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels.map(
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
                              const prevValue =
                                this.sharedState.scatterplotAdvanced
                                  .scatterplotdatasetsAdvanced.labels[i];
                              const newValue = e.target.value as string;

                              this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.labels[
                                i
                              ] = newValue;

                              if (
                                this.sharedState.scatterplotAdvanced
                                  .selectedX === prevValue
                              ) {
                                this.sharedState.scatterplotAdvanced.selectedX =
                                  newValue;
                              }
                              if (
                                this.sharedState.scatterplotAdvanced
                                  .selectedY === prevValue
                              ) {
                                this.sharedState.scatterplotAdvanced.selectedY =
                                  newValue;
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
                              @click=${() => this.deleteColumn(i)}
                            ></sl-icon-button>`
                          : html``}
                      </div>
                    </th>`
                )}
              </tr>
            </thead>

            <tbody>
              ${this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets.map(
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
                            value="${dataset.id}"
                            @sl-input=${(e: any) =>
                              (this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets[
                                i
                              ].id = e.target.value)}
                          ></sl-input>
                        </div>
                      </div>
                    </td>
                    ${this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets[
                      i
                    ].data.map(
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
                                type="text or number"
                                class="input"
                                value="${value}"
                                @sl-input=${(e: any) =>
                                  typeof this.sharedState.scatterplotAdvanced
                                    .scatterplotdatasetsAdvanced.sets[i].data[
                                    j
                                  ] === "number"
                                    ? (this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets[
                                        i
                                      ].data[j] = Number(e.target.value))
                                    : (this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced.sets[
                                        i
                                      ].data[j] = String(e.target.value))}
                              ></sl-input>
                            </div>
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
                <sl-popup
                  placement="right"
                  strategy="fixed"
                  .active=${this.addColumnPopupOpen}
                >
                  <sl-icon-button
                    slot="anchor"
                    name="plus-circle"
                    label="Add Column"
                    @click=${(e) => {
                      this.addColumnPopupOpen = true;
                      e.target.focus();
                    }}
                    @blur=${() => (this.addColumnPopupOpen = false)}
                  ></sl-icon-button>
                  <div class="popup-content">
                    <sl-button
                      @mousedown=${(e: MouseEvent) => {
                        if (e.button !== 0) return;
                        this.addStringColumn();
                        this.addColumnPopupOpen = false;
                      }}
                    >
                      Text dataset
                    </sl-button>
                    <sl-button
                      @mousedown=${(e: MouseEvent) => {
                        if (e.button !== 0) return;
                        this.addNumberColumn();
                        this.addColumnPopupOpen = false;
                      }}
                    >
                      Numeric dataset
                    </sl-button>
                  </div>
                </sl-popup>

                <sl-icon-button
                  @click=${() => this.addDataset()}
                  name="plus-circle"
                  label="Add Dataset"
                ></sl-icon-button>
                <br />
              `
            : html``}
        </div>
      </div>
    `;
  }

  dispatchUpdateEvent() {
    this.dispatchEvent(
      new CustomEvent("wwci-change", {
        detail: {
          value:
            this.sharedState.scatterplotAdvanced.scatterplotdatasetsAdvanced,
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
      "sl-icon-button": SlIconButton,
      "sl-input": SlInput,
      "sl-color-picker": SlColorPicker,
      "wwci-file-upload-button": FileUploadButton,
      "wwci-select": Select,
      "sl-button": SlButton,
      "sl-popup": SlPopup,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-advanced-input": AdvancedInput;
  }
}
