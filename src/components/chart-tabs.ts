import { html } from "lit";
import IconPlus from "@tabler/icons/outline/plus.svg";
import type { WebwriterChart } from "../widgets/webwriter-chart";

const DATA_TAB_ID = "data";
export const SCATTER_TAB_ID = "viz-scatterplot-fixed";

/** The label of a tab: its text, or an editable span while the tab is renamed. */
function tabLabel(host: WebwriterChart, id: string, text: string) {
  if (host.editingVisualizationId !== id) return html`<span class="tab-label-text">${text}</span>`;
  return html`<span
    class="tab-label-text tab-label-editing"
    data-tab-id=${id}
    contenteditable="true"
    @mousedown=${(e: MouseEvent) => e.stopPropagation()}
    @click=${(e: MouseEvent) => e.stopPropagation()}
    @dblclick=${(e: MouseEvent) => e.stopPropagation()}
    @keydown=${host.handleInlineTabRenameKeydown}
    @blur=${(e: FocusEvent) => host.commitInlineTabRename((e.currentTarget as HTMLElement).textContent ?? "")}
  >${host.editingVisualizationName}</span>`;
}

/** Tab group with the data tab, the fixed scatter plot tab, one tab per visualization and the button that adds one. */
export function renderChartTabs(host: WebwriterChart, isScatterTab: boolean) {
  const state = host.sharedState;
  const vizs = state.visualizations ?? [];
  const renameHandlers = (id: string) => ({
    dblclick: (e: MouseEvent) => host.startInlineTabRename(e, id),
    keydown: (e: KeyboardEvent) => host.handleTabKeydownWhileEditing(e, id),
  });
  const dataTab = renameHandlers(DATA_TAB_ID);
  const scatterTab = renameHandlers(SCATTER_TAB_ID);

  return html`
    <sl-tab-group @sl-tab-show=${host.handleTabShow} @sl-close=${host.handleTabClose}>
      <sl-tab
        slot="nav"
        panel=${DATA_TAB_ID}
        ?active=${host.showData}
        @dblclick=${dataTab.dblclick}
        @keydown=${dataTab.keydown}
      >
        ${tabLabel(host, DATA_TAB_ID, host.dataTabName === "Data" ? host.msg("Data") : host.dataTabName)}
      </sl-tab>

      <sl-tab
        slot="nav"
        panel=${SCATTER_TAB_ID}
        ?active=${host.showChart && isScatterTab}
        @dblclick=${scatterTab.dblclick}
        @keydown=${scatterTab.keydown}
      >
        ${tabLabel(host, SCATTER_TAB_ID, host.scatterplotTabName === "Scatter plot" ? host.msg("Scatter plot") : host.scatterplotTabName)}
      </sl-tab>

      ${vizs.map((viz, index) => {
        const handlers = renameHandlers(viz.id);
        return html`
          <sl-tab
            slot="nav"
            panel=${viz.id}
            ?active=${host.showChart && state.activeVisualizationId === viz.id}
            ?closable=${index > 0}
            @dblclick=${handlers.dblclick}
            @keydown=${handlers.keydown}
          >
            ${tabLabel(host, viz.id, viz.name.replace(/^Chart\b/, host.msg("Chart")))}
          </sl-tab>
        `;
      })}

      <div slot="nav" class="tab-add-action">
        <sl-tooltip content=${host.msg("Add visualization")}>
          <sl-icon-button
            src=${IconPlus}
            label=${host.msg("Add visualization")}
            @click=${host.addVisualization}
            class="tab-add-button"
          ></sl-icon-button>
        </sl-tooltip>
      </div>
    </sl-tab-group>
  `;
}
