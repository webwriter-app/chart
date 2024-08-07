import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SharedTestStateMixin } from "../../state";
import { LitElementWw } from "@webwriter/lit";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
@customElement("wwci-select-dataset")
export class SelectDataset extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  @state() open = false;

  render() {
    const selectedDatasets = this.sharedState.scatterDatasets.sets.filter(
      (_, i) =>
        this.sharedState.scatterDatasets.selected.dataset_indexes.includes(i)
    );

    // Find common labels and ensure their data types match
    const commonLabels =
      selectedDatasets.length === 1 // if only one dataset is selected, we can use number and string types
        ? [...selectedDatasets[0].labels]
        : selectedDatasets.reduce(
            (acc, set) =>
              // Filter out labels that are not present in the current set or have type different from "number"
              acc.filter(
                (label) =>
                  set.labels.includes(label) &&
                  set.typeOfEachData[set.labels.indexOf(label)] === "number"
              ),
            // Initialize with labels and their types from the first selected dataset with type "number"
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
                    const index =
                      this.sharedState.scatterDatasets.selected.dataset_indexes.indexOf(
                        i
                      );
                    if (index !== -1) {
                      this.sharedState.scatterDatasets.selected.dataset_indexes.splice(
                        index,
                        1
                      );
                    } else {
                      this.sharedState.scatterDatasets.selected.dataset_indexes.push(
                        i
                      );
                    }
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
          value=${this.sharedState.scatterDatasets.selected.axis.x ??
          "[[wwci-label-none]]"}
          label="X-Axis"
          @sl-change=${(e: any) => {
            const x_axis_value =
              e.target.value === "[[wwci-label-none]]"
                ? undefined
                : e.target.value;

            if (
              this.sharedState.scatterDatasets.selected.axis.x === x_axis_value
            )
              this.sharedState.scatterDatasets.selected.axis.x = undefined;
            else
              this.sharedState.scatterDatasets.selected.axis.x = x_axis_value;

            if (
              this.sharedState.scatterDatasets.selected.axis.y === x_axis_value
            ) {
              this.sharedState.scatterDatasets.selected.axis.y = undefined;
            }
          }}
        >
          <sl-option value="[[wwci-label-none]]">
            <em>None</em>
          </sl-option>
          ${commonLabels.map(
            (label) => html`<sl-option value=${label}> ${label} </sl-option>`
          )}
        </sl-select>
        <sl-select
          style="z-index: 1"
          value=${this.sharedState.scatterDatasets.selected.axis.y ??
          "[[wwci-label-none]]"}
          label="Y-Axis"
          @sl-change=${(e: any) => {
            const y_axis_value =
              e.target.value === "[[wwci-label-none]]"
                ? undefined
                : e.target.value;

            if (
              this.sharedState.scatterDatasets.selected.axis.y === y_axis_value
            )
              this.sharedState.scatterDatasets.selected.axis.y = undefined;
            else
              this.sharedState.scatterDatasets.selected.axis.y = y_axis_value;

            if (
              this.sharedState.scatterDatasets.selected.axis.x === y_axis_value
            ) {
              this.sharedState.scatterDatasets.selected.axis.x = undefined;
            }
          }}
        >
          <sl-option value="[[wwci-label-none]]">
            <em>None</em>
          </sl-option>
          ${commonLabels.map(
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
