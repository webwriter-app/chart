import { css } from "lit";
import { htmlLegendStyles } from "./html-legend";

export const scatterChartStyles = [htmlLegendStyles, css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      /* The host is programmatically focused for Delete-key handling —
         never show a focus outline (appeared as an orange frame). */
      outline: none;
    }
    :host(:focus),
    :host(:focus-visible) {
      outline: none;
    }
    .root {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      gap: 8px;
      overflow: hidden;
    }
    .chart-col {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }
    .chart-area {
      flex: 1 1 0;
      min-height: 0;
      min-width: 0;
      position: relative;
    }
    .chart-annotations {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: bold;
      flex-shrink: 0;
      gap: 12px;
    }
    .annotation-regression { color: #e91e63; }
    .annotation-correlation { color: #3f51b5; margin-left: auto; }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      /* No double-tap zoom / no synthesized-click delay, so quick
         double-taps on points register reliably */
      touch-action: manipulation;
      outline: none;
    }
    canvas:focus-visible {
      outline: 2px solid var(--ww-theme-accent-1, #1a73e8);
      outline-offset: -2px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .btn-col {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      gap: 7px;
      align-items: center;
    }
    .line-tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.82);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 100;
      white-space: nowrap;
      line-height: 1.5;
    }
    .line-tooltip-name {
      font-weight: 600;
      margin-bottom: 1px;
    }
    .line-edit-bar {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.14);
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      z-index: 60;
      white-space: nowrap;
    }
    .line-edit-bar input {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
      width: 100px;
    }
    .line-edit-bar .line-formula {
      color: #555;
      font-size: 11px;
    }
    sl-button::part(base) {
      align-items: center;
    }
    sl-button sl-icon {
      pointer-events: none;
    }
    .coord-popup {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      padding: 10px 12px;
      z-index: 100;
      min-width: 160px;
      font-size: 13px;
    }
    .coord-popup-title {
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 12px;
      color: #555;
    }
    .coord-popup-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }
    .coord-popup-row label {
      width: 18px;
      font-weight: 600;
      color: #333;
    }
    .coord-popup-row input {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 13px;
      width: 80px;
    }
    .coord-popup-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .coord-popup-actions button {
      flex: 1;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
      cursor: pointer;
      font-size: 12px;
    }
    .coord-popup-actions button.apply {
      background: #2196f3;
      color: white;
      border-color: #2196f3;
    }
    .connect-tooltip {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      padding: 4px 8px;
      z-index: 200;
      pointer-events: auto;
      white-space: nowrap;
    }

    /* Touch devices: 44px minimum hit targets for the tool buttons */
    @media (pointer: coarse) {
      .btn-col sl-button::part(base) {
        min-width: 44px;
        min-height: 44px;
      }
    }

    @container (max-width: 37.5rem) {
      .root {
        gap: 4px;
      }
      .btn-col {
        gap: 5px;
      }
    }

    @media print {
      .btn-col,
      .connect-tooltip,
      .coord-popup {
        display: none;
      }
      .chart-annotations,
      .annotation-regression,
      .annotation-correlation {
        break-inside: avoid;
      }
    }
  `];
