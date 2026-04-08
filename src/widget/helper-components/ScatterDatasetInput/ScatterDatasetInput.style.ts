import { css } from "lit";
export default css`
  .wrapper {
    padding: 1rem;
    box-sizing: border-box;
  }
  table,
  th,
  tr,
  td {
    border: 1px solid black;
    border-collapse: collapse;
  }
  .add-dataset-button {
    margin-bottom: 10px;
  }
  .input-wrapper {
    position: relative;
    min-width: 8rem;
    height: 100%;
    min-height: 2.5rem;
    flex-grow: 1;
  }
  .input {
    flex: 1 0 0;
    min-width: 4rem;
    position: absolute;
    inset: 0;
    border: 0;
  }
  sl-input::part(base) {
    border: 0;
  }
  .table-cell-number {
    background: #e0f2ff;
  }
  .table-cell-name {
    background: #75b4f2;
  }
  .table-cell-id {
    background: #f3f9ff;
  }
  .table-cell-category {
    background: #bcdcf8;
  }
  .table-cell-id sl-input::part(base),
  .table-cell-number sl-input::part(base),
  .table-cell-category sl-input::part(base),
  .table-cell-name sl-input::part(base) {
    background: #ffffff00;
  }

  .button-datatype-category,
  .button-datatype-category::part(label) {
    text-align: left;
  }
  .button-datatype-category::part(suffix)::after {
    content: "";
    background: #bcdcf8;
    border-radius: 50%;
    height: 1.25rem;
    width: 1.25rem;
    vertical-align: middle;
    margin-left: 0.5em;
  }
  .button-datatype-number,
  .button-datatype-number::part(label) {
    text-align: left;
  }
  .button-datatype-number::part(suffix)::after {
    content: "";
    background: #e0f2ff;
    border-radius: 50%;
    height: 1.25rem;
    width: 1.25rem;
    vertical-align: middle;
    margin-left: 0.5em;
  }

  .container {
    display: flex;
    overflow: visible;
    flex-direction: row;
    gap: 1em;
    align-items: left;
  }
  .text {
    margin: 0;
    align-self: center;
    box-sizing: border-box;
    color: #1a1a1a;
  }

  .table-layout-container {
    margin-top: 1rem;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }

  table {
    display: inline-table;
    background: white;
  }

  sl-icon-button {
    justify-self: center;
    align-self: center;
  }

  .popup-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: white;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .table-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    margin-top: 2rem;
  }

  .btn-wrapper {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    margin-top: 1rem;
    gap: 1rem;
    z-index: 100;
  }

  sl-popup::part(popup) {
    z-index: 1000000;
  }
  .dropdown-content {
    background: white;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    z-index: 1000;
    text-align: left;
  }
`;
