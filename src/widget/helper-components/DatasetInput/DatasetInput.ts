import { html } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  EditableSet,
  PREDEFINED_COLORS,
  getDistributedColor,
  normalizeSetColors,
  parseSpreadsheet,
  sanitizeTableData,
} from "./dataset-input.utils";
import { ChartDataSet } from "../../chart-models";

import style from "./DatasetInput.style";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.js";

import IconTrash from "@tabler/icons/outline/trash.svg";
import IconPlus from "@tabler/icons/outline/plus.svg";
import IconTableImport from "@tabler/icons/outline/table-import.svg";
import IconTablePlus from "@tabler/icons/outline/table-plus.svg";
import StateComponent from "../../stateful-component";

declare global {
  interface HTMLElementTagNameMap {
    "wwci-dataset-input": DatasetInput;
  }
}

@customElement("wwci-dataset-input")
export class DatasetInput extends StateComponent {
static styles = style;

private _openColorPicker: number | null = null;

@state() private accessor _isDragging = false;

public static get scopedElements() {
    return {
      "sl-icon-button": SlIconButton,
      "sl-button": SlButton,
      "sl-icon": SlIcon,
    };
  }

private _handleDocClick = (e: MouseEvent) => {
    if (this._openColorPicker === null) return;
    const path = e.composedPath();
    const inside = path.some((el) => {
      if (el instanceof Element) {
        return el.classList?.contains("color-swatch-btn") ||
               el.classList?.contains("color-popover");
      }
      return false;
    });
    if (!inside) { this._openColorPicker = null; this.requestUpdate(); }
  };

handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this._processFile(input.files[0]);
    input.value = ""; // Reset input
  };

connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleDocClick);
  }

disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleDocClick);
  }

private _renderColorSwatch(color: string, rowIdx: number, canEdit: boolean) {
    const isOpen = this._openColorPicker === rowIdx;
    const sets = this.sharedState.chart.datasets.sets;

    return html`
      <div class="color-swatch-wrap">
        <button
          class="color-swatch-btn"
          style="background: ${color};"
          ?disabled=${!canEdit}
          @click=${(e: Event) => {
            e.stopPropagation();
            this._openColorPicker = isOpen ? null : rowIdx;
            this.requestUpdate();
          }}
        ></button>

        ${isOpen ? html`
          <div class="color-popover" @click=${(e: Event) => e.stopPropagation()}>
            ${PREDEFINED_COLORS.map(c => html`
              <button
                class="color-popover-swatch ${color === c ? 'active' : ''}"
                style="background: ${c};"
                title="${c}"
                @click=${() => {
                  const newSets = JSON.parse(JSON.stringify(sets));
                  newSets[rowIdx].color = c;
                  this._openColorPicker = null;
                  this.requestUpdate();
                  this.applyDatasetChanges(newSets);
                }}
              ></button>
            `)}
            <div class="color-popover-custom" title="Pick custom color">
              +
              <input
                type="color"
                .value=${color}
                @input=${(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  const newSets = JSON.parse(JSON.stringify(sets));
                  newSets[rowIdx].color = val;
                  this.applyDatasetChanges(newSets);
                }}
                @change=${() => { this._openColorPicker = null; this.requestUpdate(); }}
              />
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

private applyDatasetChanges(newSets: EditableSet[], newLabels?: string[], newTitle?: string) {
    if (!newSets || newSets.length === 0) return;
    const normalizedSets = normalizeSetColors(sanitizeTableData(newSets));

    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        title: newTitle !== undefined ? newTitle : this.sharedState.chart.title,
        datasets: {
          ...this.sharedState.chart.datasets,
          labels: newLabels !== undefined ? newLabels : this.sharedState.chart.datasets.labels,
          sets: normalizedSets as unknown as ChartDataSet[],
        },
      },
    };
    this.dispatchStateChange();
  }

initializeManualEntry() {
    this.sharedState = {
      ...this.sharedState,
      chart: {
        ...this.sharedState.chart,
        title: "My Chart",
        datasets: {
          labels: [],
          sets: [
            { name: "Series 1", color: getDistributedColor(0), colors: [], data: [] },
          ],
        },
      },
    };
    this.dispatchStateChange();
  }

addDataset() {
    const existing = this.sharedState.chart.datasets.sets;
    const colCount = existing.length > 0 ? existing[0].data.length : this.sharedState.chart.datasets.labels.length;
    const rowColor = getDistributedColor(existing.length);
    const newSets = [...existing, {
      name: `Series ${existing.length + 1}`,
      color: rowColor,
      colors: Array.from({ length: colCount }, () => rowColor),
      data: Array.from({ length: colCount }, () => null),
    }];
    this.applyDatasetChanges(newSets);
  }

addColumn() {
    const updatedSets = this.sharedState.chart.datasets.sets.map((d, index) => ({
      ...d,
      data: [...d.data, null],
      colors: [...d.colors, d.color || getDistributedColor(index)],
    }));
    const updatedLabels = [
      ...this.sharedState.chart.datasets.labels,
      `Category ${this.sharedState.chart.datasets.labels.length + 1}`,
    ];
    this.applyDatasetChanges(updatedSets, updatedLabels);
  }

deleteColumn(i: number) {
    const updatedSets = this.sharedState.chart.datasets.sets.map((d) => ({
      ...d,
      data: d.data.filter((_: any, j: number) => j !== i),
      colors: d.colors.filter((_: any, j: number) => j !== i),
    }));
    const updatedLabels = this.sharedState.chart.datasets.labels.filter((_: any, j: number) => j !== i);
    this.applyDatasetChanges(updatedSets, updatedLabels);
  }

deleteDataset(i: number) {
    const updatedSets = this.sharedState.chart.datasets.sets.filter((_: any, j: number) => j !== i);
    this.applyDatasetChanges(updatedSets);
  }

private _processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileBuffer = e.target?.result as ArrayBuffer;
        const { labels, sets, parsedTitle } = parseSpreadsheet(fileBuffer);
        this.applyDatasetChanges(
          sets,
          labels,
          parsedTitle ?? this.sharedState.chart.title
        );
      } catch (error) {
        console.error("Failed to parse file:", error);
        alert("Could not parse the file. Please ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

private _handleDragOver(e: DragEvent) {
    e.preventDefault();
    this._isDragging = true;
  }

private _handleDragLeave(e: DragEvent) {
    e.preventDefault();
    this._isDragging = false;
  }

private _handleDrop(e: DragEvent) {
    e.preventDefault();
    this._isDragging = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this._processFile(e.dataTransfer.files[0]);
    }
  }

clearDataset() {
    this.sharedState = {
      ...this.sharedState,
      chart: { ...this.sharedState.chart, datasets: { labels: [], sets: [] } },
    };
    this.dispatchStateChange();
  }

render() {
    const canEdit = this.sharedState.editable || this.sharedState.teacherOptions.changeData;
    const canAddRemove = this.sharedState.editable || this.sharedState.teacherOptions.addRemoveData;

    if (this.sharedState.chart.datasets.sets.length === 0) {
      return html`
        <div class="empty-state">
          ${canEdit ? html`
            <div 
              class="upload-zone ${this._isDragging ? 'drag-over' : ''}"
              @dragover=${this._handleDragOver}
              @dragleave=${this._handleDragLeave}
              @drop=${this._handleDrop}
            >
              <h3>Brought your own dataset?</h3>
              <p>Upload or drag and drop an Excel (.xlsx) or CSV file here.</p>
              <input type="file" id="data-uploader"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                class="hidden-file-input"
                @change=${this.handleFileUpload} />
              <sl-button variant="primary" @click=${() => this.shadowRoot?.getElementById('data-uploader')?.click()}>
                <sl-icon src=${IconTableImport} class="table-btn" ></sl-icon>
                Choose File
              </sl-button>
            </div>
            <div class="empty-divider">OR</div>
            <sl-button variant="default" @click=${() => this.initializeManualEntry()}>
              <sl-icon src=${IconTablePlus} class="table-btn" ></sl-icon>
              Create Empty Table
            </sl-button>
          ` : html`<p class="empty-title">No data available.</p>`}
        </div>
      `;
    }

    const { labels, sets } = this.sharedState.chart.datasets;

    // ... (rest of the render method remains exactly the same as the previous version)
    return html`
      <div class="table-wrapper">
        <div class="table-scroll-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="corner-cell row-label-cell">
                  <input
                    class="cell-input title-input"
                    type="text"
                    .value=${this.sharedState.chart.title}
                    placeholder="Chart Title"
                    ?disabled=${!canEdit}
                    @focus=${(e: FocusEvent) => {
                      const input = e.target as HTMLInputElement;
                      setTimeout(() => input.select(), 0);
                    }}
                    @input=${(e: Event) => {
                      this.sharedState = { ...this.sharedState, chart: { ...this.sharedState.chart, title: (e.target as HTMLInputElement).value } };
                      this.dispatchStateChange();
                    }}
                  />
                </th>

                ${labels.map((label, i) => html`
                  <th>
                    <div class="header-content">
                      <input
                        class="cell-input"
                        type="text"
                        .value=${label}
                        placeholder="Category${i + 1}"
                        ?disabled=${!canEdit}                      @focus=${(e: FocusEvent) => {
                        const input = e.target as HTMLInputElement;
                        setTimeout(() => input.select(), 0);
                      }}                        @input=${(e: Event) => {
                          const newLabels = [...labels];
                          newLabels[i] = (e.target as HTMLInputElement).value;
                          this.sharedState = { ...this.sharedState, chart: { ...this.sharedState.chart, datasets: { ...this.sharedState.chart.datasets, labels: newLabels } } };
                          this.dispatchStateChange();
                        }}
                      />
                      ${canAddRemove ? html`
                        <sl-icon-button src=${IconTrash} class="delete-btn" @click=${() => this.deleteColumn(i)}></sl-icon-button>
                      ` : ""}
                    </div>
                  </th>
                `)}

                ${canAddRemove ? html`
                  <th class="add-cell">
                    <sl-icon-button src=${IconPlus} class="add-btn" @click=${() => this.addColumn()}></sl-icon-button>
                  </th>
                ` : ""}
              </tr>
            </thead>

            <tbody>
              ${sets.map((dataset, i) => html`
                <tr>
                  <th class="row-label-cell ${this._openColorPicker === i ? 'active-popover-cell' : ''}">
                    <div class="row-header-content">
                      ${this._renderColorSwatch(dataset.color, i, canEdit)}
                      <input
                        class="cell-input"
                        type="text"
                        .value=${dataset.name}
                        placeholder="Series ${i + 1}"
                        ?disabled=${!canEdit}
                        @focus=${(e: FocusEvent) => {
                          const input = e.target as HTMLInputElement;
                          setTimeout(() => input.select(), 0);
                        }}
                        @input=${(e: Event) => {
                          const newSets = JSON.parse(JSON.stringify(sets));
                          newSets[i].name = (e.target as HTMLInputElement).value;
                          this.applyDatasetChanges(newSets);
                        }}
                      />
                      ${canAddRemove ? html`
                        <sl-icon-button src=${IconTrash} class="delete-btn" @click=${() => this.deleteDataset(i)}></sl-icon-button>
                      ` : ""}
                    </div>
                  </th>

                  ${dataset.data.map((value: any, j: number) => html`
                    <td class="data-cell">
                      <input
                        class="cell-input numeric"
                        type="text"
                        .value=${value === null ? "" : String(value)}
                        placeholder="0"
                        ?disabled=${!canEdit}                        @focus=${(e: FocusEvent) => {
                          const input = e.target as HTMLInputElement;
                          setTimeout(() => input.select(), 0);
                        }}                        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                        @change=${(e: Event) => {
                          const rawVal = (e.target as HTMLInputElement).value.trim();
                          const newSets = JSON.parse(JSON.stringify(sets));
                          newSets[i].data[j] = rawVal === "" ? null : rawVal;
                          this.applyDatasetChanges(newSets);
                        }}
                      />
                    </td>
                  `)}

                  ${canAddRemove ? html`<td class="empty-add-cell"></td>` : ""}
                </tr>
              `)}

              ${canAddRemove ? html`
                <tr>
                  <th class="row-label-cell add-row-cell">
                    <sl-icon-button src=${IconPlus} class="add-btn" @click=${() => this.addDataset()}></sl-icon-button>
                  </th>
                  ${labels.map(() => html`
                    <td class="empty-row-cell"></td>
                  `)}
                  <td class="empty-add-cell"></td>
                </tr>
              ` : ""}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}