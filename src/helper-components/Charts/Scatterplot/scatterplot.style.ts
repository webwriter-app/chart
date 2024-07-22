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
  flex-direction: row; /* Align items in a row */
  align-items: flex-start; 
  align-items: flex-start; /* Align items to the top */
  height: 100%;
}
.scatterplot-svg {
  flex-grow: 1; /* Allow the SVG to take available space */
}
.button-container {
  margin-left: 10px; /* Optional: Add some space between the SVG and the button */
}
table,
th,
tr,
td {
  border: 0.5px solid black;
  border-collapse: collapse;

}
.th_regression {
  min-width: 10rem;
}
.th_line {
  min-width: 10rem;
}
.th_correlation {
  min-width: 2.5rem;
}
.th_color{
  width: 2.5rem;
}
.th_range{
  min-width: 10rem;
}
.th_label{
  min-width: 10rem;
}
.table-wrapper {
  margin-top: 20px;
}
table {
  display: inline-table;
  background: white;
}
.regression-formulas td {
  font-size: 12px;
}
.color-formulas td {
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
`;
