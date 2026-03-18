import { css } from "lit";

export default css`
  div {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  #main {
    outline: 1px solid lightgray;
    height: 32rem;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  :host(.ww-printable) #main {
    height: auto;
  }
  :host(.ww-printable) #settings,
  :host(.ww-printable) sl-tab-group {
    display: none;
  }

  #main > * {
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 6px;
    padding-bottom: 6px;
    box-sizing: border-box;
  }

  #settings {
    color: var(--sl-color-gray-600);
    font-size: var(--sl-font-size-medium);
    line-height: var(--sl-line-height-medium);
    font-weight: 400;

    overflow: overlay;
    padding-top: 0px !important;
    width: 100%;

    box-sizing: content-box;
    padding-left: 10px;
  }
  #settings-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }
  #settings-panel {
    background-color: white;
    overflow: hidden;
    display: flex;
    padding: 3px;
    padding-top: 0;
    flex-direction: column;
    align-items: left;
    gap: 16px;
    margin-bottom: 16px;
    box-sizing: border-box;
  }

  #settings h2 {
    font-size: var(--sl-button-font-size-medium);
    line-height: calc(
      var(--sl-input-height-medium) - var(--sl-input-border-width) * 2
    );
    font-weight: 400;

    position: sticky;
    top: 0;
    background: #f4f4f4;
    z-index: 1;

    border-bottom: 2px solid var(--sl-color-gray-600);
    color: darkblue;
  }

  .hidden {
    display: none !important;
  }

  .chart-settings-host {
    display: contents;
  }

  .tab-add-action {
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
  }

  .tab-add-button {
    font-size: 1.25rem;
    color: #888;
  }

  .tab-label-text {
    display: inline-block;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
  }

  .tab-label-editing {
    display: inline-block;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
    border: none;
    box-shadow: none;
    cursor: text;
    -webkit-user-select: text;
    user-select: text;
  }

  .panel-shell {
    display: flex;
    flex-direction: column;
    height: calc(100% - 46px);
    overflow: hidden;
    background: #fff;
  }

  .viz-type-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #fff;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
  }

  .viz-type-label {
    font-size: 0.8em;
    color: #666;
    font-weight: 400;
  }

  .data-viz-type-row {
    justify-content: space-between;
  }

  .data-actions-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 6px 10px;
    background: #fff;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
  }

  .viz-type-divider {
    width: 1px;
    height: 24px;
    background: #ddd;
    margin: 0 8px;
  }

  .columns-select {
    min-width: 250px;
  }

  .data-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: #fff;
    padding: 10px;
    box-sizing: border-box;
  }

  .data-content > * {
    height: 100%;
    min-height: 0;
  }

  .chart-display-wrap {
    flex: 1;
    position: relative;
    display: flex;
    overflow: hidden;
    padding: 0;
  }

  .chart-empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 0.95rem;
    text-align: center;
    padding: 1rem;
  }
`;
