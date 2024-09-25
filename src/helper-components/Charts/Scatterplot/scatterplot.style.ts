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

.line-formulas td {
  font-size: 12px;
}
  .lengend-container.hidden {
  display: none;
}
  .legend-container.visible {
  border: 1px solid #000;
  padding: 1px 10px 5px 10px; /* Top = 5px, Right = 10px, Bottom = 10px, Left = 10px */
  display: inline-block;
  min-width: 9.85rem;
  max-width: 10rem;
}

.legend-title {
  margin: 0;
  padding: 0;
  text-align: center;
}

.legend-items {
  display: flex;
  flex-direction: column;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-color-box {
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border: 1px solid black; 
}
.legend-label {
  font-size: 12px;
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
  background-color: white;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
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
.gradient-bar-container {
    width: 91%; /* Adjust as needed */
    margin: 3px 0;
     z-index: 1; /* Ensure the gradient is below the pop-up */
  }

  .gradient-bar {
  height: 20px;
  border: 1px solid #000;
  background: linear-gradient(to right, #cceeff, #99ccff, #6699ff, #3366ff, #0033cc);
   z-index: 1; /* Ensure the gradient is below the pop-up */
}

 
    .gradient-bar-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      font-size: 12px; 
    }
      /* Create tick mark container */
    .ticks {
      display: flex;
      justify-content: space-between;
      margin-top: 0px;
      
    }

    .tick {
      width: 1px;
      height: 5px;
      background-color: black;
    }

    .tick-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-top: 5px;
    }
      #min-value {
  margin-left: -1px; /* Move the minimum value left */
}

#max-value {
  margin-right: -2px; /* Move the maximum value right */
}



`;
