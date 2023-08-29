import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("wwci-file-upload-button")
export class FileUploadButton extends LitElement {
  static styles = css`
    .file-upload-button {
      display: inline-block;
      padding: 10px 20px;
      background-color: hsl(240 5.3% 26.1%);
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .file-upload {
      display: none;
    }
  `;

  @property({ type: String })
  buttonText = "load external data";

  render() {
    return html`
      <label for="file" class="file-upload-button">${this.buttonText}</label>
      <input
        type="file"
        id="file"
        class="file-upload"
        accept=".csv"
        @change=${async (e: any) => {
          await this._handleFileSelect(e);
          //@ts-ignore
          this.shadowRoot.getElementById("file").value = "";
        }}
      />
    `;
  }

  private _handleFileSelect(e: Event) {
    this.dispatchEvent(
      new CustomEvent("wwcifileinput", {
        detail: { value: e },
        composed: true,
      })
    );
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "wwci-file-upload-button": FileUploadButton;
  }
}
