import { css } from "lit";
export default css`
  table,
  th,
  tr,
  td {
    border: 1px solid black;
    border-collapse: collapse;
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

  .table-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* 
  .table-scroll-container {
    overflow: auto;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
  }
*/

  .table-layout-container {
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
`;
