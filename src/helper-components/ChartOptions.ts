import { LitElement, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./LimitedNumberInput";
import "./Select";

import { attribute } from "../functions";
import { availableCharts } from "./Charts/imports";
import { SharedTestStateMixin } from "../state";

interface TOptionInput {
  name: string;
  template: TemplateResult;
  locked: boolean;
  key: string;
}

@customElement("wwci-chart-options")
export class Select extends SharedTestStateMixin(LitElement) {
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
          default:
            option.template = html`<p>Unknown type: ${type}</p>`;
        }
        return option;
      },
    );

    const optionInputsToShow = optionInputs.filter(
      (input) =>
        this.sharedState.editable ||
        this.sharedState.teacherOptions.showLockedOptions ||
        !input.locked,
    );

    return html`
      <p>Chart</p>
      <wwci-select
        value="${this.sharedState.chart.selectedType}"
        ?disabled=${!(
          this.sharedState.editable ||
          (this.sharedState.teacherOptions.changeOptions &&
            !this.sharedState.chart.optionsLocked["chartType"])
        )}
        options="${attribute(availableCharts)}"
        @wwci-change="${(e: any) => {
          this.sharedState.chart.selectedType = e.target.value;
        }}"
      >
      </wwci-select>
      ${this.sharedState.editable
        ? html`<sl-icon-button
            class="lock-button ${this.sharedState.chart.optionsLocked[
              "chartType"
            ]
              ? "lock-button-locked"
              : "lock-button-unlocked"}"
            name=${this.sharedState.chart.optionsLocked["chartType"]
              ? "lock"
              : "unlock"}
            label="Lock this option"
            @click=${() => {
              this.sharedState.chart.optionsLocked["chartType"] =
                !this.sharedState.chart.optionsLocked["chartType"];
            }}
          ></sl-icon-button>`
        : html`<div></div>`}
      <p>Title</p>
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
      ${this.sharedState.editable
        ? html`<sl-icon-button
            class="lock-button ${this.sharedState.chart.optionsLocked["title"]
              ? "lock-button-locked"
              : "lock-button-unlocked"}"
            name=${this.sharedState.chart.optionsLocked["title"]
              ? "lock"
              : "unlock"}
            label="Lock this option"
            @click=${() => {
              this.sharedState.chart.optionsLocked["title"] =
                !this.sharedState.chart.optionsLocked["title"];

              console.log({
                optionsLocked: this.sharedState.chart.optionsLocked,
              });
            }}
          ></sl-icon-button>`
        : html`<div></div>`}
      ${optionInputsToShow.map((input) => {
        return html`
          <p>${input.name}</p>
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
        `;
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-chart-options": Select;
  }
}
