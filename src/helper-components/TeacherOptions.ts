import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "./LimitedNumberInput";

import { SharedTestStateMixin } from "../state";
import { LitElementWw } from "@webwriter/lit";
import { Switch } from "./Switch";
import { NumberInput } from "./LimitedNumberInput";

@customElement("wwci-teacher-options")
export class TeacherOptions extends SharedTestStateMixin(
  LitElementWw as unknown as LitElementWw &
    Parameters<typeof SharedTestStateMixin>[0]
) {
  render() {
    return html`
      <h2 style="grid-column: 1/span 4;">TEACHER OPTIONS</h2>
      <p>show options</p>
      <wwci-switch
        ?checked=${this.sharedState.teacherOptions.showOptions}
        @wwci-change=${(e: any) => {
          this.sharedState.teacherOptions.showOptions = e.detail.value;
        }}
      ></wwci-switch>
      <p>show data</p>
      <wwci-switch
        ?checked=${this.sharedState.teacherOptions.showData}
        @wwci-change=${(e: any) => {
          this.sharedState.teacherOptions.showData = e.detail.value;
        }}
      ></wwci-switch>
      <p>show locked options</p>
      <wwci-switch
        ?checked=${this.sharedState.teacherOptions.showLockedOptions}
        @wwci-change=${(e: any) => {
          this.sharedState.teacherOptions.showLockedOptions = e.detail.value;
        }}
      ></wwci-switch>
      <p>change data</p>
      <wwci-switch
        ?checked=${this.sharedState.teacherOptions.changeData}
        @wwci-change=${(e: any) => {
          this.sharedState.teacherOptions.changeData = e.detail.value;
        }}
      ></wwci-switch>
      <p>change options</p>
      <wwci-switch
        ?checked=${this.sharedState.teacherOptions.changeOptions}
        @wwci-change=${(e: any) => {
          this.sharedState.teacherOptions.changeOptions = e.detail.value;
        }}
      ></wwci-switch>
      <p>add/remove data</p>
      <wwci-switch
        ?checked=${this.sharedState.teacherOptions.addRemoveData}
        @wwci-change=${(e: any) => {
          this.sharedState.teacherOptions.addRemoveData = e.detail.value;
        }}
      ></wwci-switch>
    `;
  }

  public static get scopedElements() {
    return {
      "wwci-switch": Switch,
      "wwci-limited-number-input": NumberInput,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-teacher-options": TeacherOptions;
  }
}
