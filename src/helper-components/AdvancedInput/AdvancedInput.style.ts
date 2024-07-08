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
  }
`;
