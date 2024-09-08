import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import StateComponent from "../../stateComponent";
import { ScatterDataset } from "../../interfaces";
@customElement("wwci-select-dataset")
export class SelectDataset extends StateComponent {
  @state() accessor open = false;

  render() {
    const selectedDatasets: ScatterDataset[] =
      this.sharedState.scatterDatasets.sets.filter((_, i) =>
        this.sharedState.scatterDatasets.selected.dataset_indexes.includes(i)
      )
        ? JSON.parse(
            JSON.stringify(
              this.sharedState.scatterDatasets.sets.filter((_, i) =>
                this.sharedState.scatterDatasets.selected.dataset_indexes.includes(
                  i
                )
              )
            )
          )
        : [];

    const none = ["None"];

    // Find common labels and ensure their data types match
    const commonLabels =
      selectedDatasets.length === 0
        ? []
        : selectedDatasets.length === 1
        ? selectedDatasets[0]?.labels ?? []
        : selectedDatasets.reduce(
            (acc, set) =>
              acc.filter((label) => {
                const labelIndex = set.labels.indexOf(label);
                return (
                  labelIndex !== -1 &&
                  set.typeOfEachData[labelIndex] === "number"
                );
              }),
            // Initialize with a copy of labels from the first selected dataset with type "number"
            selectedDatasets[0]?.labels?.filter(
              (_, index) =>
                selectedDatasets[0].typeOfEachData[index] === "number"
            ) ?? []
          );

    return html`
      <div class="btn-wrapper">
        <sl-popup
          placement="bottom"
          strategy="fixed"
          .active=${this.open}
          style="z-index: 3"
        >
          <sl-button
            slot="anchor"
            label="Select Datasets"
            @click=${(e) => {
              this.open = true;
              e.target.focus();
            }}
            @blur=${() => (this.open = false)}
          >
            Select Datasets
          </sl-button>

          <div class="popup-content">
            ${this.sharedState.scatterDatasets.sets.map(
              (set, i) => html`
                <sl-menu-item
                  type="checkbox"
                  @mousedown=${(e: MouseEvent) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    // Avoid mutating state directly, use a new array
                    const updatedIndexes = [
                      ...this.sharedState.scatterDatasets.selected
                        .dataset_indexes,
                    ];
                    const index = updatedIndexes.indexOf(i);
                    if (index !== -1) {
                      updatedIndexes.splice(index, 1);
                    } else {
                      updatedIndexes.push(i);
                    }

                    const updatedState = {
                      ...this.sharedState,
                      scatterDatasets: {
                        ...this.sharedState.scatterDatasets,
                        selected: {
                          ...this.sharedState.scatterDatasets.selected,
                          dataset_indexes: updatedIndexes,
                        },
                      },
                    };
                    this.sharedState = updatedState;
                    this.dispatchStateChange();
                  }}
                  .checked=${
                    this.sharedState.scatterDatasets.selected.dataset_indexes.indexOf(
                      i
                    ) !== -1
                  }
                  ?disabled=${
                    selectedDatasets.length > 0 &&
                    set.labels.filter(
                      (label, i) =>
                        commonLabels.includes(label) &&
                        set.typeOfEachData[i] === "number" &&
                        selectedDatasets.every(
                          (selectedSet) =>
                            selectedSet.labels.includes(label) &&
                            selectedSet.typeOfEachData[
                              selectedSet.labels.indexOf(label)
                            ] === "number"
                        )
                    ).length < 2 &&
                    this.sharedState.scatterDatasets.selected.dataset_indexes.indexOf(
                      i
                    ) === -1
                  } // Disable if the dataset does not have at least 2 common labels with the selected datasets
                >
                  ${set.name}
                </sl-menu-item>
              `
            )}
          </div>
        </sl-popup>
        <sl-select
          style="z-index: 2"
          value=${this.sharedState.scatterDatasets.selected.axis.x}
          label="X-Axis"
          @sl-change=${(e: any) => {
            const x_axis_value = e.target.value;

            if (
              this.sharedState.scatterDatasets.selected.axis.x === x_axis_value
            )
              this.sharedState.scatterDatasets.selected.axis.x = "None";
            else
              this.sharedState.scatterDatasets.selected.axis.x = x_axis_value;

            if (
              this.sharedState.scatterDatasets.selected.axis.y === x_axis_value
            ) {
              this.sharedState.scatterDatasets.selected.axis.y = "None";
            }
            this.dispatchStateChange();
          }}
        >
          ${none
            .concat(commonLabels)
            .map(
              (label) => html`<sl-option value=${label}> ${label} </sl-option>`
            )}
        </sl-select>
        <sl-select
          style="z-index: 1"
          value=${this.sharedState.scatterDatasets.selected.axis.y}
          label="Y-Axis"
          @sl-change=${(e: any) => {
            const y_axis_value = e.target.value;

            if (
              this.sharedState.scatterDatasets.selected.axis.y === y_axis_value
            )
              this.sharedState.scatterDatasets.selected.axis.y = "None";
            else
              this.sharedState.scatterDatasets.selected.axis.y = y_axis_value;

            if (
              this.sharedState.scatterDatasets.selected.axis.x === y_axis_value
            ) {
              this.sharedState.scatterDatasets.selected.axis.x = "None";
            }
            this.dispatchStateChange();
          }}
        >
          ${none
            .concat(commonLabels)
            .map(
              (label) => html`<sl-option value=${label}> ${label} </sl-option>`
            )}
        </sl-select>
      </div>
    `;
  }

  public static styles = css`
    .popup-content {
      background: white;
      box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .btn-wrapper {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      gap: 1rem;
      z-index: 0;
    }

    sl-popup::part(popup) {
      z-index: 1000000;
    }
  `;

  public static get scopedElements() {
    return {
      "sl-button": SlButton,
      "sl-popup": SlPopup,
      "sl-menu-item": SlMenuItem,
      "sl-select": SlSelect,
      "sl-option": SlOption,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-select-dataset": SelectDataset;
  }
}
