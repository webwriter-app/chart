import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./LimitedNumberInput";

import { SharedTestStateMixin } from "../state";

@customElement("wwci-teacher-options")
export class TeacherOptions extends SharedTestStateMixin(LitElement) {
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
}

declare global {
  interface HTMLElementTagNameMap {
    "wwci-teacher-options": TeacherOptions;
  }
}
