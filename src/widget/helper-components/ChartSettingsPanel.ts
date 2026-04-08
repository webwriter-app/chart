import { css, html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";

import "./NumberField";
import "./OptionSelect";

import { availableRegressions } from "./Charts/imports";
import { OptionSelect } from "./OptionSelect";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlDetails from "@shoelace-style/shoelace/dist/components/details/details.component.js";
import SlButtonGroup from "@shoelace-style/shoelace/dist/components/button-group/button-group.component.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.component.js";
import { ToggleSwitch } from "./ToggleSwitch";
import { NumberField } from "./NumberField";
import IconLock from "bootstrap-icons/icons/lock.svg";
import IconUnLock from "bootstrap-icons/icons/unlock.svg";
import StateComponent from "../stateful-component";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-chart-settings": ChartSettingsPanel;
  }
}

interface TOptionInput {
  name: string;
  template: TemplateResult;
  locked: boolean;
  key: string;
}
@customElement("wwci-chart-settings")
export class ChartSettingsPanel extends StateComponent {
@state()
  accessor showErrorMessage = false;

@state()
  accessor showErrorIcon = false;

static styles = css`
    sl-details::part(header) {
      padding: 0.5em 0;
    }
    sl-details::part(content) {
      padding: 0px;
      padding-left: 2px;
      padding-bottom: 0.5em;
    }
    .lock-button-locked {
      color: red;
    }

    .lock-button-unlocked {
      color: green;
    }

    .lock-button-locked::part(base):hover {
      color: red;
    }

    .lock-button-unlocked::part(base):hover {
      color: green;
    }
    .text {
      margin: 0;
      align-self: center;
      box-sizing: border-box;
      color: #1a1a1a;
    }
    .container {
      overflow: visible;
      /* margin: 0 0.5em; */
      margin-top: 0.5em;
    }
    .row {
      display: flex;
      flex-direction: row;
      gap: 0.5em;
    }
    sl-details {
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--sl-color-gray-300);
    }

    sl-details::part(base) {
      background-color: unset;
      border: none;
    }
    /* Ensure wwci-select is relatively positioned */
    .select-container {
      position: relative;
      display: inline-block;
    }

    .triangle-container {
      position: absolute;
      bottom: 0;
      right: 1px; /* Keep the triangle at the bottom-left of wwci-select */
      z-index: 10;
      transform: translateY(40%);
    }
    .alert-container {
      position: absolute;
      top: 100%; /* Place it right below the select element */
      left: 0;
      width: 100%; /* Full width for the alert */
      z-index: 1000;
    }

    .mode_switch__error_indicator {
      color: var(--sl-color-danger-600);
    }
    .error-alert {
      position: relative;
      width: 100%; /* Ensure it stays full width */
      max-height: none; /* Allow it to grow vertically */
      margin-top: 0.5em; /* Add a small gap between the select and the alert */
      overflow: visible; /* Ensure content is visible when it grows */
    }
  `;

public static get scopedElements() {
    return {
  "wwci-select": OptionSelect,
      "sl-button": SlButton,
      "sl-input": SlInput,
  "wwci-limited-number-input": NumberField,
  "wwci-switch": ToggleSwitch,
      "sl-icon-button": SlIconButton,
      "sl-details": SlDetails,
      "sl-button-group": SlButtonGroup,
      "sl-alert": SlAlert,
    };
  }

isOptionHiddenForAxes(key: string, x_axis_type: string, y_axis_type: string) {
    let disabled = false;
    switch (key) {
      case "animation":
        if (x_axis_type === "none" && y_axis_type === "none") {
          disabled = true;
        }
        break;
      case "showGrid":
        if (x_axis_type !== "number" || y_axis_type !== "number") {
          disabled = true;
        }
        break;
      case "showCorrelation":
        if (x_axis_type !== "number" || y_axis_type !== "number") {
          disabled = true;
        }
        break;

      case "showOutliers":
        if (x_axis_type !== "number" || y_axis_type !== "number") {
          disabled = true;
        }
        break;
      case "listRegressionLine":
        if (x_axis_type !== "number" || y_axis_type !== "number") {
          disabled = true;
        }
        break;
      case "showMean":
        if (
          (x_axis_type !== "number" && y_axis_type !== "number") ||
          (x_axis_type === "number" && y_axis_type === "number")
        ) {
          disabled = true;
        }
        break;
      case "hoverTooltip":
        if (
          (x_axis_type === "none" && y_axis_type === "none") ||
          (x_axis_type === undefined && y_axis_type === undefined)
        ) {
          disabled = true;
        }
        break;
    }
    return disabled;
  }

getTotalDataLength() {
    let length = 0;
    if (this.sharedState.scatterDatasets.sets.length !== 0) {
      this.sharedState.scatterDatasets.selected.dataset_indexes.forEach(
        (dataset_index) => {
          length +=
            this.sharedState.scatterDatasets.sets[dataset_index]
              .dimensional_data.length;
        }
      );
    }
    return length;
  }

getSelectedDatasetCount() {
    return this.sharedState.scatterDatasets.selected.dataset_indexes.length;
  }

getRegressionErrorState(): {
    regressionErrorMessages: TemplateResult;
    regressionError: boolean;
    color: string;
  } {
    let regressionErrorMessages = html``;
    let regressionError = false;
    let color = "";
    const regressionType = this.sharedState.regressionType;
    // Incase no dataset
    if (
      this.sharedState.scatterDatasets.sets.length === 0 ||
      this.getSelectedDatasetCount() === 0 ||
      this.getTotalDataLength() === 0
    ) {
      regressionError = true;
      regressionErrorMessages = html`Cannot perform ${regressionType}
      regression: Insufficient data points.`;
    } else {
      let requiredPoints = 2; // Default to 2 for most regression types
      switch (regressionType) {
        case "none":
          return { regressionErrorMessages, regressionError, color };
        case "linear":
          break;
        case "quadratic":
          requiredPoints = 3;
          break;
        /*case "polynomial":
          requiredPoints = 4;
          break;
        case "logarithmic":
          break;
        case "power":
          break;*/
        case "loess":
          break;
      }
      const regressionErrorDatasetsnameArray =
        this.sharedState.scatterDatasets.selected.dataset_indexes
          .sort()
          .map((dataset_index) => {
            const dataset =
              this.sharedState.scatterDatasets.sets[dataset_index];
            color = dataset.color;
            if (dataset.dimensional_data.length < requiredPoints) {
              regressionError = true;
              return html`<span style="color: ${color};"
                >${dataset.name}</span
              >`;
            }
            return null;
          })
          .filter((el) => el !== null); // Filter out the null values
      // If the array length is greater than 1, join the elements with a comma
      const regressionErrorDatasetsname =
        regressionErrorDatasetsnameArray.length > 1
          ? regressionErrorDatasetsnameArray.reduce(
              (acc, curr, index) => [
                ...acc,
                curr,
                index < regressionErrorDatasetsnameArray.length - 1
                  ? html`, `
                  : null, // Add comma except after the last item
              ],
              []
            )
          : regressionErrorDatasetsnameArray;
      // Combine all the regression error messages
      regressionErrorMessages = html`
        Cannot perform ${this.sharedState.regressionType} regression on
        ${regressionErrorDatasetsnameArray.length > 1 ? "datasets" : "dataset"}
        ${regressionErrorDatasetsname}: Insufficient data points.
      `;
    }

    return { regressionErrorMessages, regressionError, color };
  }

render() {
    const firstSelectedDataset =
      this.sharedState.scatterDatasets.sets.length > 0
        ? this.sharedState.scatterDatasets.sets[
            this.sharedState.scatterDatasets.selected.dataset_indexes[0]
          ]
        : undefined;
    const x_axis_type =
      this.sharedState.scatterDatasets.selected.axis.x === "None"
        ? "none"
        : firstSelectedDataset?.typeOfEachData[
            firstSelectedDataset?.labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.x
            )
          ];
    const y_axis_type =
      this.sharedState.scatterDatasets.selected.axis.y === "None"
        ? "none"
        : firstSelectedDataset?.typeOfEachData[
            firstSelectedDataset?.labels.indexOf(
              this.sharedState.scatterDatasets.selected.axis.y
            )
          ];
    // TODO: Fix this condition for regression when not enough data
    if (
      this.sharedState.regressionType !== "none" &&
      x_axis_type === "number" &&
      y_axis_type === "number" &&
      this.getRegressionErrorState().regressionError
    ) {
      this.showErrorIcon = true;
    } else {
      this.showErrorIcon = false;
    }

    const biExclamationTriangle = html`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      class="bi bi-exclamation-triangle"
      viewBox="0 0 16 16"
    >
      <!-- White Triangle Background -->
      <polygon fill="#fff" points="8 1 15 14 1 14 8 1" />

      <path
        d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"
      />
      <path
        d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"
      />
    </svg>`;
    const { optionDefinition } = this.sharedState.chart;

    const optionInputs: TOptionInput[] = Object.keys(optionDefinition).map(
      (key) => {
        const { max, min, type } = optionDefinition[key];
        const value = this.sharedState.chart.options[key];
        const isDisabled = !(
          this.sharedState.editable ||
          (this.sharedState.teacherOptions.changeOptions &&
            !this.sharedState.chart.optionsLocked[key])
        );

        const option = {
          key,
          name: optionDefinition[key].name,
          locked: this.sharedState.chart.optionsLocked[key],
          template: html``,
        };

        switch (type) {
          case "number":
            option.template = html`
              <wwci-limited-number-input
                ?disabled=${isDisabled}
                max=${max}
                min=${min}
                value=${Number(value)}
                @sl-input=${(e: any) => {
                  const updatedOptions = {
                    ...this.sharedState.chart.options,
                    [key]: e.target.value,
                  };

                  this.sharedState = {
                    ...this.sharedState,
                    chart: {
                      ...this.sharedState.chart,
                      options: updatedOptions,
                    },
                  };

                  this.dispatchStateChange();
                }}
              ></wwci-limited-number-input>
            `;
            break;

          case "boolean":
            option.template = html`<wwci-switch
              ?disabled=${isDisabled}
              ?checked=${Boolean(value)}
              @wwci-change=${(e: CustomEvent) => {
                e.stopPropagation();
                e.cancelBubble = true;
                const updatedOptions = {
                  ...this.sharedState.chart.options,
                  [key]: e.detail.value,
                };

                this.sharedState = {
                  ...this.sharedState,
                  chart: {
                    ...this.sharedState.chart,
                    options: updatedOptions,
                  },
                };
                this.dispatchStateChange();
              }}
            ></wwci-switch>`;
            break;

          case "array":
            option.template = html`
              <sl-button-group>
                <div class="select-container">
                  <wwci-select
                    .value="${this.sharedState.regressionType}"
                    ?disabled=${isDisabled}
                    .selectOptions="${availableRegressions}"
                    @wwci-change=${(e: CustomEvent) => {
                      e.stopPropagation();
                      e.cancelBubble = true;
                      this.sharedState = {
                        ...this.sharedState,
                        regressionType: (e.target as any).value,
                      };

                      this.dispatchStateChange();
                    }}
                  >
                  </wwci-select>
                  <div
                    class="triangle-container"
                    style=${this.showErrorIcon ? "" : "display: none;"}
                  >
                    <div
                      class="mode_switch__error_indicator"
                      @mouseenter=${() => (this.showErrorMessage = true)}
                      @mouseleave=${() => (this.showErrorMessage = false)}
                    >
                      ${biExclamationTriangle}
                    </div>
                  </div>
                  ${this.showErrorMessage && this.showErrorIcon
                    ? html`
                        <div class="alert-container">
                          <sl-alert
                            class="error-alert"
                            variant="danger"
                            open
                            hoist
                          >
                            ${this.getRegressionErrorState().regressionErrorMessages}
                          </sl-alert>
                        </div>
                      `
                    : ""}
                </div>
              </sl-button-group>
            `;
            break;

          default:
            option.template = html`<p>Unknown type: ${type}</p>`;
        }
        return option;
      }
    );

    const disabledOptionKeys = new Set(["scaleMin", "scaleMax", "scaleStepSize"]);

    const optionInputsToShow = optionInputs.filter(
      (input) =>
        (this.sharedState.editable ||
          this.sharedState.teacherOptions.showLockedOptions ||
          !input.locked) &&
        !this.isOptionHiddenForAxes(input.key, x_axis_type, y_axis_type) &&
        !disabledOptionKeys.has(input.key)
    );

    return html`
      <!-- <sl-details summary="Chart Options"> -->
        <div class="container">
          <!-- <div class="row">
            <p class="text">Title</p>
            ${this.sharedState.editable
              ? html`<sl-icon-button
                  class="lock-button ${this.sharedState.chart.optionsLocked[
                    "title"
                  ]
                    ? "lock-button-locked"
                    : "lock-button-unlocked"}"
                  src=${this.sharedState.chart.optionsLocked["title"]
                    ? IconLock
                    : IconUnLock}
                  label="Lock this option"
                  @click=${() => {
                    const updatedOptionsLocked = {
                      ...this.sharedState.chart.optionsLocked,
                      title: !this.sharedState.chart.optionsLocked["title"],
                    };

                    this.sharedState = {
                      ...this.sharedState,
                      chart: {
                        ...this.sharedState.chart,
                        optionsLocked: updatedOptionsLocked,
                      },
                    };

                    this.dispatchStateChange();
                  }}
                ></sl-icon-button>`
              : html`<div></div>`}
          </div>
          <sl-input
            ?disabled=${!(
              this.sharedState.editable ||
              (this.sharedState.teacherOptions.changeOptions &&
                !this.sharedState.chart.optionsLocked["title"])
            )}
            value=${this.sharedState.chart.selectedType === "Scatterplot"
              ? this.sharedState.scatterDatasets.title
              : this.sharedState.chart.title}
            @sl-input=${(e: any) => {
              if (this.sharedState.chart.selectedType === "Scatterplot") {
                this.sharedState = {
                  ...this.sharedState,
                  scatterDatasets: {
                    ...this.sharedState.scatterDatasets,
                    title: e.target.value,
                  },
                };
              } else {
                this.sharedState = {
                  ...this.sharedState,
                  chart: {
                    ...this.sharedState.chart,
                    title: e.target.value,
                  },
                };
              }

              this.dispatchStateChange();
            }}
          ></sl-input> -->
        </div>
        ${optionInputsToShow.map((input) => {
          return html`
            <div class="container">
              <div class="row">
                <p class="text">${input.name}</p>
                ${this.sharedState.editable
                  ? html`<!-- Lock controls temporarily disabled -->
                      <div></div>`
                  : html`<div></div>`}
              </div>
              ${input.template}
            </div>
          `;
        })}
      <!-- </sl-details> -->
      <!-- <sl-details summary="Teacher Options"> -->
        <!-- <div class="container">
          <p>show options</p>
          <wwci-switch
            ?checked=${this.sharedState.teacherOptions.showOptions}
            @wwci-state-change=${(e: CustomEvent) => {
              e.stopPropagation();
              e.cancelBubble = true;
              this.sharedState.teacherOptions.showOptions = e.detail.value;
              this.dispatchStateChange();
            }}
          ></wwci-switch>
          <p>show data</p>
          <wwci-switch
            ?checked=${this.sharedState.teacherOptions.showData}
            @wwci-state-change=${(e: any) => {
              e.stopPropagation();
              e.cancelBubble = true;
              this.sharedState.teacherOptions.showData = e.detail.value;
              this.dispatchStateChange();
            }}
          ></wwci-switch>
          <p>show locked options</p>
          <wwci-switch
            ?checked=${this.sharedState.teacherOptions.showLockedOptions}
            @wwci-state-change=${(e: any) => {
              e.stopPropagation();
              e.cancelBubble = true;
              this.sharedState.teacherOptions.showLockedOptions =
                e.detail.value;
              e.stopPropagation();
              e.cancelBubble = true;
            }}
          ></wwci-switch>
          <p>change data</p>
          <wwci-switch
            ?checked=${this.sharedState.teacherOptions.changeData}
            @wwci-state-change=${(e: any) => {
              e.stopPropagation();
              e.cancelBubble = true;
              this.sharedState.teacherOptions.changeData = e.detail.value;
              this.dispatchStateChange();
            }}
          ></wwci-switch>
          <p>change options</p>
          <wwci-switch
            ?checked=${this.sharedState.teacherOptions.changeOptions}
            @wwci-state-change=${(e: any) => {
              e.stopPropagation();
              e.cancelBubble = true;
              this.sharedState.teacherOptions.changeOptions = e.detail.value;
              this.dispatchStateChange();
            }}
          ></wwci-switch>
          <p>add/remove data</p>
          <wwci-switch
            ?checked=${this.sharedState.teacherOptions.addRemoveData}
            @wwci-state-change=${(e: any) => {
              e.stopPropagation();
              e.cancelBubble = true;
              this.sharedState.teacherOptions.addRemoveData = e.detail.value;
              e.stopPropagation();
              e.cancelBubble = true;
            }}
          ></wwci-switch>
        </div> -->
      <!-- </sl-details> -->
    `;
  }
}