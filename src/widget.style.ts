import { css } from "lit";

export default css`
  :host,
  #main {
    /* margin-top: 1px;
  margin-left: 1px; */
    /* max-width: 1280px; */
    /* margin: 0 auto; */
    /* padding: 2rem; */

    /* margin-bottom: 1vh; */
    /* text-align: center; */
    /* background-color: blue; */
  }

  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.lit:hover {
    filter: drop-shadow(0 0 2em #325cffaa);
  }

  .card {
    padding: 2em;
  }

  .read-the-docs {
    color: #888;
  }

  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }

  a {
    font-weight: 500;
    color: #646cff;
    text-decoration: inherit;
  }
  a:hover {
    color: #535bf2;
  }

  button {
    border-radius: 1px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    cursor: pointer;
    transition: border-color 0.25s;
  }
  sl-button {
    --sl-button-font-size-medium: 1em;
    --sl-button-height-medium: 2.5em;
    --sl-button-border-radius-medium: 1px;
  }

  button:hover {
    border-color: #646cff;
  }
  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }

  @media (prefers-color-scheme: light) {
    a:hover {
      color: #747bff;
    }
    button {
      background-color: #f9f9f9;
    }
  }

  div {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .button-group {
    display: flex;
    flex-direction: row;
    gap: 1em;
  }

  #main {
    height: 65%;
    width: 100%;
    outline: 2px solid black;
    display: flex;
    flex-direction: column;
  }

  #main.print {
  }

  #main > * {
    padding: 10px;
    box-sizing: border-box;
  }
  #display-chart {
    flex: 1;
  }

  #data-panel {
    flex: 1;
    padding: 0;
    background-color: #d6d4d4;
    outline: 2px solid darkblue;
    width: 100%;
    overflow: auto;
  }
  #options-panel {
    background-color: white;
    overflow: auto;
    padding-left: 20px;
    padding-right: 20px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 10px;
    box-sizing: border-box;
  }
  #teacher-options-panel {
    background-color: white;
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    padding-bottom: 2px;
  }

  #settings {
    color: var(--sl-color-gray-600);
    font-size: var(--sl-font-size-medium);
    line-height: var(--sl-line-height-medium);
    font-weight: 400;

    box-sizing: border-box;
    outline: 5px solid red;
  }
  #settings-panel {
    background-color: white;
    height: 300px;
    overflow: hidden;
    display: flex;
    padding: 3px;
    flex-direction: column;
    align-items: left;
    gap: 30px;
    box-sizing: border-box;
    outline: 5px solid orange;
  }

  #settings h2 {
    font-size: var(--sl-button-font-size-medium);
    line-height: calc(
      var(--sl-input-height-medium) - var(--sl-input-border-width) * 2
    );
    font-weight: 500;

    margin-top: 0;
    margin-bottom: 0;

    display: flex;
    align-items: center;
    gap: 1ch;

    border-bottom: 2px solid var(--sl-color-gray-600);
    color: darkblue;
  }
`;
