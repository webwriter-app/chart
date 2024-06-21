import { css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./LimitedNumberInput";
import "./Select";

import { attribute } from "../functions";
import { availableCharts } from "./Charts/imports";
import { SharedTestStateMixin } from "../state";
import { LitElementWw } from "@webwriter/lit";
import { Select } from "./Select";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";

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
      display: flex;
      overflow: visible;
      flex-direction: row;
      gap: 1em;
      align-items: left;
    }
  `;
  // TODO: Fix when change ChartName (no |)
  //TODO: Fix the locks options
  render() {
    return html`
      <div class="container">
        <p class="text">Chart</p>
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
      </div>
      <div class="container">
        <p class="text">Title</p>
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
      </div>
    `;
  }

  public static get scopedElements() {
    return {
      "wwci-select": Select,
      "sl-icon-button": SlButton,
      "sl-input": SlInput,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-chart-settings": ChartSettings;
  }
}
