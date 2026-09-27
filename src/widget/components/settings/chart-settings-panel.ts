import { css, html, TemplateResult } from "lit";
import { msg } from "@lit/localize";

function translateOptionName(name: string): string {
  const map: Record<string, string> = {
    "Border Radius": msg("Border Radius"),
    "Border Width": msg("Border Width"),
    "Filled": msg("Filled"),
    "Dynamic Scaling": msg("Dynamic Scaling"),
    "Scale Min": msg("Scale Min"),
    "Scale Max": msg("Scale Max"),
    "Step Size": msg("Step Size"),
    "Line Width": msg("Line Width"),
    "Point Size": msg("Point Size"),
    "Smooth The Line": msg("Smooth The Line"),
    "Point Radius": msg("Point Radius"),
    "Fill": msg("Fill"),
    "Snap to Grid": msg("Snap to Grid"),
    "Show Grid": msg("Show Grid"),
    "Animation": msg("Animation"),
    "Polynomial Degree": msg("Polynomial Degree"),
    "LOESS Bandwidth (%)": msg("LOESS Bandwidth (%)"),
    "Show Mean": msg("Show Mean"),
  };
  return map[name] ?? name;
}
import { customElement } from "lit/decorators.js";

import { OptionSelect, ToggleSwitch, NumberField } from "../controls/controls";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlDetails from "@shoelace-style/shoelace/dist/components/details/details.component.js";
import IconLock from "@tabler/icons/outline/lock.svg";
import IconUnLock from "@tabler/icons/outline/lock-open.svg";
import StateComponent from "../../stateful-component";

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
      case "polynomialDegree":
      case "loessSpan":
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
    const { optionDefinition } = this.sharedState.chart;

    const optionInputs: TOptionInput[] = Object.keys(optionDefinition).map(
      (key) => {
        const { max, min, type } = optionDefinition[key];
        const value = this.sharedState.chart.options[key] ?? optionDefinition[key].default;
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
                @wwci-limited-number-input=${(e: CustomEvent) => {
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
              ></wwci-limited-number-input>
            `;
            break;

          case "boolean":
            option.template = html`<wwci-switch
              ?disabled=${isDisabled}
              ?checked=${Boolean(value)}
              @wwci-change=${(e: CustomEvent) => {
                e.stopPropagation();
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

          default:
            option.template = html`<p>Unknown type: ${type}</p>`;
        }
        return option;
      }
    );

    const disabledOptionKeys = new Set([
      "scaleMin",
      "scaleMax",
      "scaleStepSize",
      "listRegressionLine",
      "showCorrelation",
      "showOutliers",
    ]);

    const optionInputsToShow = optionInputs.filter(
      (input) =>
        (this.sharedState.editable ||
          this.sharedState.teacherOptions.showLockedOptions ||
          !input.locked) &&
        !this.isOptionHiddenForAxes(input.key, x_axis_type, y_axis_type) &&
        !disabledOptionKeys.has(input.key) &&
        !(
          input.key === "polynomialDegree" &&
          this.sharedState.regressionType !== "Polynomial Regression"
        ) &&
        !(
          input.key === "loessSpan" &&
          this.sharedState.regressionType !== "Local Regression"
        )
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
            value=${this.sharedState.chart.selectedType === "Scatter plot"
              ? this.sharedState.scatterDatasets.title
              : this.sharedState.chart.title}
            @sl-input=${(e: any) => {
              if (this.sharedState.chart.selectedType === "Scatter plot") {
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
                <p class="text">${translateOptionName(input.name)}</p>
                ${this.sharedState.editable
                  ? html`
                      <div></div>`
                  : html`<div></div>`}
              </div>
              ${input.template}
            </div>
          `;
        })}
    `;
  }
}