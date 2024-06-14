import { css } from "lit";
export default css`
  table,
  th,
  tr,
  td {
    border: 1px solid black;
    border-collapse: collapse;
  }
  .table-wrapper {
    padding-bottom: 10px;
  }
  .add-dataset-button {
    margin-bottom: 10px;
  }
  .input-wrapper {
    position: relative;
    min-width: 8rem;
    min-height: 2.5rem;
    flex-grow: 1;
  }
  .input {
    flex: 1 0 0;
    min-width: 4rem;
    padding-left: 0.25rem;
    position: absolute;
    inset: 0;
    border: 0;
  }
  sl-input::part(base) {
    border: 0;
  }
  .table-wrapper {
    position: relative;
  }
  .table-scroll-container {
    overflow: auto;
    position: relative;
    inset: 0;
    padding: 10px;
    box-sizing: border-box;
  }
  .table-layout-container {
    display: flex;
    flex-direction: column;
  }
  table {
    display: inline-table;
    background: white;
  }
  sl-icon-button {
    justify-self: center;
    align-self: center;
  }
`;
