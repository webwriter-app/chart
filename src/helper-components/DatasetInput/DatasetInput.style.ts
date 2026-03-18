import { css } from "lit";

export default css`
  /* ── Empty & Upload State ────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding-left: var(--sl-spacing-2x-large);
    padding-right: var(--sl-spacing-2x-large);

  }

  .upload-zone {
    padding: var(--sl-spacing-2x-large) var(--sl-spacing-4x-large);
    
    border: 2px dashed var(--sl-color-neutral-300);
    border-radius: var(--sl-border-radius-large);
    text-align: center;
    background: var(--sl-color-neutral-0);
    transition: background-color var(--sl-transition-fast), border-color var(--sl-transition-fast);
  }

  .upload-zone:hover {
    background: var(--sl-color-primary-50);
    border-color: var(--sl-color-primary-300);
  }

  /* NEW: Active drag state styling */
  .upload-zone.drag-over {
    background: var(--sl-color-primary-100);
    border-color: var(--sl-color-primary-500);
    transform: scale(1.02);
  }

  .upload-zone h3 {
    margin: 0 0 var(--sl-spacing-2x-small) 0;
    font-size: var(--sl-font-size-large);
    color: var(--sl-color-neutral-700);
    pointer-events: none; /* Prevents text from interrupting drag events */
  }

  .upload-zone p {
    font-size: var(--sl-font-size-small);
    color: var(--sl-color-neutral-500);
    margin-bottom: var(--sl-spacing-large);
    pointer-events: none;
  }

  .hidden-file-input {
    display: none;
  }

  .empty-divider {
    margin: 1.5rem 0;
    color: var(--sl-color-neutral-500);
    font-weight: 500;
  }

  .color-swatch-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  /* ── Table wrapper ───────────────────────────────── */
  .table-wrapper {
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .table-scroll-container {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: auto;
    background: var(--sl-color-neutral-0);
  }

  /*
   * FULL CELL WIDTH LAYOUT
   */
  .data-table {
    border-collapse: collapse;
    table-layout: auto;
    width: max-content; 
    margin: 0;
    background: var(--sl-color-neutral-0);
    box-shadow: var(--sl-shadow-x-small);
    border: 1px solid var(--sl-color-neutral-200);
    border-radius: var(--sl-border-radius-medium);
  }

  .data-table th,
  .data-table td {
    border: 1px solid var(--sl-color-neutral-200);
    padding: 0;
    vertical-align: middle;
    white-space: nowrap;
  }
  
  th {
    width: 150px;
  }

  .data-table thead th {
    background: var(--sl-color-neutral-100);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .row-label-cell {
    background: var(--sl-color-neutral-50);
    position: sticky;
    left: 0;
    z-index: 10;
    border-right: 2px solid var(--sl-color-neutral-300) !important;
  }

  .data-table thead .row-label-cell {
    top: 0;
    z-index: 30;
  }

  .row-label-cell.active-popover-cell {
    z-index: 50; 
  }

  /* ── Direct Input Styling ────────── */
  .cell-input {
    width: 100%;
    min-width: 100px; 
    border: none;
    background: transparent;
    padding: 10px 12px;
    font-size: 0.85rem;
    font-family: inherit;
    color: var(--sl-color-neutral-900);
    box-sizing: border-box;
    margin: 0;
    display: block;
    
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell-input:not(:focus):hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.03);
    cursor: text;
    overflow-x: auto;
    text-overflow: clip;
    white-space: nowrap;
  }

  .cell-input:focus {
    overflow-x: auto;
    text-overflow: clip;
    white-space: nowrap;
  }

  .add-btn::part(base) {
    color: var(--sl-color-primary-600);
  }

  .add-btn:hover::part(base) {
    color: var(--sl-color-neutral-400);
  }

  .cell-input:focus {
    background: var(--sl-color-neutral-0);
    box-shadow: inset 0 0 0 2px var(--sl-color-primary-500);
    outline: none;
    z-index: 2;
    position: relative;
    border-radius: 2px;
  }

  .cell-input:disabled {
    cursor: default;
    color: var(--sl-color-neutral-500);
  }

  .cell-input.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .cell-input.title-input {
    font-weight: 600;
    color: var(--sl-color-neutral-800);
  }

  /* ── Layout & Chrome ──────────────────── */
  .header-content,
  .row-header-content {
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding-right: 4px; 
  }

  .row-header-content {
    padding-left: 8px; 
    gap: 6px;
  }

  .header-content .cell-input,
  .row-header-content .cell-input {
    flex: 1;
    min-width: 60px;
    padding-left: 8px; 
  }

  .row-header-content .cell-input {
    padding-left: 4px; 
  }

  .delete-btn::part(base) {
    font-size: 0.9em;
    color: var(--sl-color-neutral-400);
  }

  .delete-btn:hover::part(base) {
    color: var(--sl-color-danger-600);
  }
  /* ── Add Rows / Columns Chrome ─────────────────── */
  .add-cell {
    width: 2.5rem;
    min-width: 2.5rem;
    text-align: center;
    background: var(--sl-color-neutral-0) !important;
  }

  .add-row-cell {
    text-align: center;
    padding: 2px 0;
    background: var(--sl-color-neutral-50);
  }

  .empty-add-cell {
    width: 2.5rem;
    min-width: 2.5rem;
    background: var(--sl-color-neutral-50);
  }

  .empty-row-cell {
    background: var(--sl-color-neutral-50);
  }

  /* ── Compact Color Swatch Picker ─────────────────── */
  .color-swatch-btn {
    width: 16px;
    height: 16px;
    min-width: 16px;
    border-radius: 50%;
    border: 2px solid var(--sl-color-neutral-300);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: border-color 0.15s, transform 0.15s;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
  }

  .color-swatch-btn:hover {
    border-color: var(--sl-color-neutral-600);
    transform: scale(1.15);
  }

  .color-popover {
    position: absolute;
    top: 24px;
    left: 0;
    z-index: 200;
    background: var(--sl-color-neutral-0);
    border: 1px solid var(--sl-color-neutral-200);
    border-radius: var(--sl-border-radius-medium);
    box-shadow: var(--sl-shadow-large);
    padding: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 162px;
  }

  .color-popover-swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s, border-color 0.1s;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
  }

  .color-popover-swatch:hover {
    transform: scale(1.15);
  }

  .color-popover-swatch.active {
    border-color: var(--sl-color-neutral-900);
  }

  .color-popover-custom {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px dashed var(--sl-color-neutral-400);
    cursor: pointer;
    padding: 0;
    background: transparent;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1;
    color: var(--sl-color-neutral-500);
    transition: border-color 0.1s;
  }

  .color-popover-custom:hover {
    border-color: var(--sl-color-neutral-700);
    color: var(--sl-color-neutral-700);
  }

  .color-popover-custom input[type="color"] {
    position: absolute;
    inset: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    opacity: 0;
    cursor: pointer;
  }
`;