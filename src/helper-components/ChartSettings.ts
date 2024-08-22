import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";

import "./LimitedNumberInput";
import "./Select";

import { attribute } from "../functions";
import { availableCharts, availableRegressions } from "./Charts/imports";
import { SharedTestStateMixin } from "../state";
import { LitElementWw } from "@webwriter/lit";
import { Select } from "./Select";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import { Switch } from "./Switch";
import { NumberInput } from "./LimitedNumberInput";
import IconLock from "bootstrap-icons/icons/lock.svg";
import IconUnLock from "bootstrap-icons/icons/unlock.svg";

interface TOptionInput {
  name: string;
  template: TemplateResult;
  locked: boolean;
  key: string;
}
@customElement("wwci-chart-settings")
export class ChartSettings extends SharedTestStateMixin(
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
    .container {
      overflow: visible;
      margin: 0 0.5em;
    }
    .row {
      display: flex;
      flex-direction: row;
      gap: 0.5em;
    }
  `;
  // TODO: Fix when change ChartName (no |)
  //TODO: Fix the locks options
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
      <div class="container">
        <div class="row">
          <p class="text">Chart</p>
          ${this.sharedState.editable
            ? html`<sl-icon-button
                class="lock-button ${this.sharedState.chart.optionsLocked[
                  "chartType"
                ]
                  ? "lock-button-locked"
                  : "lock-button-unlocked"}"
                src=${this.sharedState.chart.optionsLocked["chartType"]
                  ? IconLock
                  : IconUnLock}
                label="Lock this option"
                @click=${() => {
                  this.sharedState.chart.optionsLocked["chartType"] =
                    !this.sharedState.chart.optionsLocked["chartType"];
                }}
              ></sl-icon-button>`
            : html`<div></div>`}
        </div>
        <wwci-select
          value="${this.sharedState.chart.selectedType}"
          ?disabled=${!(
            this.sharedState.editable ||
            (this.sharedState.teacherOptions.changeOptions &&
              !this.sharedState.chart.optionsLocked["chartType"])
          )}
          selectOptions="${attribute(availableCharts)}"
          @wwci-change="${(e: any) => {
            this.sharedState.chart.selectedType = e.target.value;
          }}"
        >
        </wwci-select>
      </div>
      <div class="container">
        <div class="row">
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
                  this.sharedState.chart.optionsLocked["title"] =
                    !this.sharedState.chart.optionsLocked["title"];
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
          value=${this.sharedState.chart.title}
          @sl-input=${(e: any) => {
            this.sharedState.chart.title = e.target.value;
          }}
        ></sl-input>
      </div>
      ${optionInputsToShow.map((input) => {
        return html`
          <div class="container">
            <div class="row">
              <p class="text">${input.name}</p>
              ${this.sharedState.editable
                ? html`<sl-icon-button
                    class="lock-button ${input.locked
                      ? "lock-button-locked"
                      : "lock-button-unlocked"}"
                    src=${input.locked ? IconLock : IconUnLock}
                    label="Lock this option"
                    @click=${() => {
                      this.sharedState.chart.optionsLocked[input.key] =
                        !this.sharedState.chart.optionsLocked[input.key];
                    }}
                  ></sl-icon-button> `
                : html`<div></div>`}
            </div>
            ${input.template}
          </div>
        `;
      })}
    `;
  }

  public static get scopedElements() {
    return {
      "wwci-select": Select,
      "sl-button": SlButton,
      "sl-input": SlInput,
      "wwci-limited-number-input": NumberInput,
      "wwci-switch": Switch,
      "sl-icon-button": SlIconButton,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-chart-settings": ChartSettings;
  }
}
