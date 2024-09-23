import { css } from "lit";
export default css`
:host {
  width: 100%;
}
.scatterplot-root {
  width: 100%;
}
.scatterplot-wrapper {
  display: flex;
  gap: 8px;
  flex-direction: row; /* Align items in a row */
  align-items: flex-start; /* Align items to the top */
  justify-content: flex-start; /* Align items to the start */
  height: 100%;
}
.scatterplot-svg {
  flex-grow: 1; /* Allow the SVG to take available space */
}
.right-side {
  float: left;
  width: 12rem;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.button-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 7px;
}
table,
th,
tr,
td {
  border: 0.5px solid black;
  border-collapse: collapse;
}
th {
font-size: 13px;
}
.th_regression {
  min-width: 9rem;
  max-width: 9rem;
}
.th_correlation {
  min-width: 1.85rem;
  max-width: 1.85rem;
}
.th_line {
  min-width: 11rem;
  max-width: 11rem;
}
.th_color{
  min-width: 2.5rem;
  max-width: 2.5rem;
}
.th_range{
  min-width: 8.35rem;
  max-width: 8.35rem;
}

.table-wrapper.hidden {
  display: none;
}
.table-wrapper.visible {
  overflow-y: auto;
  max-height: 6.3rem;
  min-width: 12.47rem;
}

table {
  display: inline-table;
  background: white;
}

.regression-formulas td {
  font-size: 12px;
  max-width: 9rem;
}
.color-formulas td {
  font-size: 12px;
  overflow-wrap: break-word;
  max-width: 8.35rem;
}
.line-formulas td {
  font-size: 12px;
}



.color-span {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  border-radius: 50%;
}

svg {
  border: 1px solid black;
  flex: 1 0 0
  width: 100%;
}

text {
  font-family: Helvetica;
  font-size: 12px;
  color: #333;
}
g {
  font-size: 12px;
}
.selected {
  opacity: 1 !important;
  stroke: red !important;
  stroke-width: 1.5px !important;
}
.selected-rect{
  opacity: 1 !important;
  stroke: red !important;
  stroke-width: 1.5px !important;
}
.popup-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: white;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 10;
}
svg *, sl-icon {
  user-select: none;
}
sl-button::part(base) {
  align-items : center;
}

sl-button sl-icon {
  pointer-events: none;
}
`;
