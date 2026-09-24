import { css } from "lit";

export default css`
  /* The widget host is programmatically focused (keyboard handling) —
     suppress the browser focus outline (showed up as an orange frame). */
  :host,
  :host(:focus),
  :host(:focus-visible) {
    outline: none;
  }

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
    overflow: hidden;
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

    overflow: auto;
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
    flex: 1;
    min-height: 0;
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
    flex-wrap: wrap;
  }

  .select-chart-type {
    max-width: 135px;
    flex-shrink: 1;
    min-width: 0;
  }

  .select-axis {
    flex: 1;
    min-width: 80px;
  }

  .viz-type-label {
    font-size: 0.8em;
    color: #666;
    font-weight: 400;
  }

  .analysis-row .select-regression {
    flex: 0 1 auto;
    min-width: 150px;
    max-width: 210px;
  }

  .analysis-row sl-checkbox {
    font-size: 0.85em;
  }

  .analysis-warning {
    color: var(--sl-color-warning-600, #e08700);
    font-size: 1.05em;
    cursor: help;
    line-height: 1;
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

  .chart-host-wrap {
    position: absolute;
    inset: 0;
    padding: 10px;
    box-sizing: border-box;
  }

  /* Behebt das Problem mit unleserlich schmalen Dropdowns bei Shoelace */
  sl-select::part(listbox) {
    min-width: 200px !important;
    white-space: nowrap !important;
  }

  /* Kompaktes vertikales Spacing für die HTML Legende */
  .html-legend-container {
    display: flex;
    flex-wrap: wrap;
    row-gap: 4px !important;
    column-gap: 8px !important;
    padding: 4px 8px !important;
    max-height: 50px !important;
    overflow-y: auto;
  }

  @media (max-width: 600px) {
    #main > * {
      padding-left: 4px;
      padding-right: 4px;
    }
    
    .viz-type-row {
      padding: 6px 4px;
      gap: 6px;
      flex-wrap: wrap; /* Ermöglicht das Umbrechen in die nächste Reihe */
    }
    
    .viz-type-label,
    .viz-type-divider {
      display: none; /* Labels ausblenden, um Platz zu sparen */
    }

    .btn-label {
      display: none;
    }
    
    .chart-host-wrap {
      padding: 4px;
    }

    /* * Statt die Buttons auf 44px zu schrumpfen und unleserlich zu machen,
     * geben wir ihnen auf Mobilgeräten eine flexible, lesbare Breite.
     */
    wwci-select[icon],
    sl-select.select-axis,
    sl-select.select-regression {
      flex: 1 1 120px; /* Flexibel wachsen und schrumpfen, Basisbreite 120px */
      min-width: 100px;
    }

    /* Sicherstellen, dass die Texte und Werte im geschlossenen Zustand sichtbar bleiben */
    sl-select.select-axis::part(display-input),
    sl-select.select-regression::part(display-input) {
      display: inline-block !important;
    }

    /* Kompakte Legendenhöhe für Mobilgeräte */
    .html-legend-container {
      max-height: 40px !important;
    }
  }

  @media (pointer: coarse) {
    .analysis-row sl-checkbox::part(base) {
      min-height: 34px;
      align-items: center;
    }
    .data-actions-row sl-button::part(base),
    .viz-type-row sl-button::part(base) {
      min-height: 40px;
      align-items: center;
    }
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