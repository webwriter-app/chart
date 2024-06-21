import { TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./LimitedNumberInput";
import "./Select";

//import { attribute } from "../functions";
//import { availableCharts } from "./Charts/imports";
import { SharedTestStateMixin } from "../state";
import { availableRegressions } from "./Charts/imports";
import { LitElementWw } from "@webwriter/lit";
import { NumberInput } from "./LimitedNumberInput";
import { Select } from "./Select";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import { Switch } from "./Switch";

interface TOptionInput {
  name: string;
  template: TemplateResult;
  locked: boolean;
  key: string;
}
//TODO: fix options in scatterplot not saved when switching between (Scatterplot and other charts)
@customElement("wwci-chart-options")
export class ChartOptions extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  static styles = css`
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
  `;

  render() {
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
                value=${value}
                @sl-input=${(e: any) =>
                  (this.sharedState.chart.options[key] = e.target.value)}
              ></wwci-limited-number-input>
            `;
            break;

          case "boolean":
            option.template = html`<wwci-switch
              ?disabled=${isDisabled}
              ?checked=${value}
              @wwci-change=${(e: any) =>
                (this.sharedState.chart.options[key] = e.detail.value)}
            ></wwci-switch>`;
            break;
          case "array":
            option.template = html`<wwci-select
              .value="${this.sharedState.regressionType}"
              ?disabled=${isDisabled}
              .selectOptions="${availableRegressions}"
              @wwci-change="${(e: any) => {
                this.sharedState.regressionType = e.target.value;
              }}"
            >
            </wwci-select>`;

            break;
          default:
            option.template = html`<p>Unknown type: ${type}</p>`;
        }
        return option;
      }
    );

    const optionInputsToShow = optionInputs.filter(
      (input) =>
        this.sharedState.editable ||
        this.sharedState.teacherOptions.showLockedOptions ||
        !input.locked
    );

    return html`
      ${optionInputsToShow.map((input) => {
        return html`
          <p class="text">${input.name}</p>
          ${input.template}
          ${this.sharedState.editable
            ? html`<sl-icon-button
                class="lock-button ${input.locked
                  ? "lock-button-locked"
                  : "lock-button-unlocked"}"
                name=${input.locked ? "lock" : "unlock"}
                label="Lock this option"
                @click=${() => {
                  this.sharedState.chart.optionsLocked[input.key] =
                    !this.sharedState.chart.optionsLocked[input.key];

                  console.log({
                    optionsLocked: this.sharedState.chart.optionsLocked,
                  });
                }}
              ></sl-icon-button>`
            : html`<div></div>`}
          <div></div>
        `;
      })}
      <div></div>
    `;
  }

  public static get scopedElements() {
    return {
      "wwci-limited-number-input": NumberInput,
      "wwci-select": Select,
      "sl-input": SlInput,
      "wwci-switch": Switch,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-chart-options": ChartOptions;
  }
}
