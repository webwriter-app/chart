// This legend follows the Chart.js pattern: the native canvas
// legend is disabled and rebuilt as DOM below the canvas, visually identical
// to the native one (same generateLabels metadata: box colors, border,
// radius, font). Because it lives in a scrollable container with a fixed
// max-height, many legend items can no longer squeeze the chart itself.
import { css } from "lit";
import { Chart } from "chart.js";
import type { ChartConfiguration, ChartEvent, FontSpec, LegendOptions, ChartType, LegendElement, LegendItem, Plugin } from "chart.js";

/** Shared styles for the legend container — include in the component's
 *  static styles so the plugin-generated DOM (same shadow root) is styled. */
export const htmlLegendStyles = css`
  .html-legend-container {
    flex: 0 0 auto;
    max-height: 50px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  @media (max-width: 768px) {
    .html-legend-container {
      max-height: min(40px, 10vh);
    }
  }
  .html-legend-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 2px 8px;
    list-style: none;
    /* Tight vertical rhythm: spacing comes from the flex gap alone,
       not from per-item margins */
    row-gap: 2px;
    column-gap: 8px;
  }
  .html-legend-list li {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 0;
    padding: 0;
    line-height: 1.1;
    user-select: none;
    -webkit-user-select: none;
  }

  @media (pointer: coarse) {
    .html-legend-list li {
      min-height: 24px;
    }
  }
  .html-legend-list .legend-box {
    display: inline-block;
    flex-shrink: 0;
    margin-right: 6px;
    box-sizing: border-box;
  }
`;

type AnyChart = Chart<ChartType>;

const chartType = (chart: AnyChart) => (chart.config as ChartConfiguration).type;
type AnyLegend = LegendElement<ChartType>;

/** Legend items and the signature of what was last rendered, per list. */
const rendered = new WeakMap<HTMLUListElement, { items: LegendItem[]; sig?: string }>();

/** The DOM event stands in for the Chart.js event: the legend callbacks only
 *  pass it on. */
const asChartEvent = (e: Event) => e as unknown as ChartEvent;

/** The real chart.legend object when available (it carries .chart and the
 *  resolved options), else a minimal stand-in — the hover/click callbacks
 *  only ever use legend.chart. */
function legendArg(chart: AnyChart): AnyLegend {
  return chart.legend ?? ({ chart } as AnyLegend);
}

/** Legend items with per-type semantics (pie/doughnut/polar generate one
 *  item per data index, others one per dataset). */
function getLegendItems(chart: AnyChart): LegendItem[] {
  const built = chart.legend?.legendItems;
  if (Array.isArray(built) && built.length > 0) return built;
  const type = chartType(chart);
  const generate =
    chart.options.plugins?.legend?.labels?.generateLabels ??
    Chart.overrides[type]?.plugins?.legend?.labels?.generateLabels ??
    Chart.defaults.plugins.legend.labels.generateLabels;
  return generate?.(chart) ?? [];
}

/** Native click behavior: toggle the dataset (or data index for circular
 *  types) exactly like the built-in legend would. */
function nativeToggle(chart: AnyChart, item: LegendItem, e: Event) {
  const onClick: LegendOptions<ChartType>["onClick"] =
    Chart.overrides[chartType(chart)]?.plugins?.legend?.onClick ??
    Chart.defaults.plugins.legend.onClick;
  const lg = legendArg(chart);
  onClick?.call(lg, asChartEvent(e), item, lg);
}

/** Event delegation lives on the persistent <ul> so hover state survives the
 *  item rebuilds that happen when hover-dimming recolors the datasets. */
function wireDelegation(ul: HTMLUListElement, chart: AnyChart) {
  let hoveredIdx: number | null = null;

  const itemAt = (target: EventTarget | null): { item: LegendItem; idx: number } | null => {
    const li = (target as HTMLElement | null)?.closest?.("li");
    if (!li || !ul.contains(li)) return null;
    const idx = Number((li as HTMLElement).dataset.idx);
    const items = rendered.get(ul)?.items ?? [];
    return Number.isInteger(idx) && items[idx] ? { item: items[idx], idx } : null;
  };
  const legendOpts = () => chart.options.plugins?.legend ?? {};

  ul.addEventListener("mouseover", (e) => {
    const hit = itemAt(e.target);
    if (!hit || hit.idx === hoveredIdx) return;
    const opts = legendOpts();
    const lg = legendArg(chart);
    if (hoveredIdx !== null) {
      opts.onLeave?.call(lg, asChartEvent(e), (rendered.get(ul)?.items ?? [])[hoveredIdx], lg);
    }
    hoveredIdx = hit.idx;
    opts.onHover?.call(lg, asChartEvent(e), hit.item, lg);
  });

  ul.addEventListener("mouseleave", (e) => {
    if (hoveredIdx === null) return;
    const item = (rendered.get(ul)?.items ?? [])[hoveredIdx];
    hoveredIdx = null;
    const lg = legendArg(chart);
    legendOpts().onLeave?.call(lg, asChartEvent(e), item, lg);
  });

  ul.addEventListener("click", (e) => {
    const hit = itemAt(e.target);
    if (!hit) return;
    const onClick = legendOpts().onClick;
    const lg = legendArg(chart);
    if (typeof onClick === "function") onClick.call(lg, asChartEvent(e), hit.item, lg);
    else nativeToggle(chart, hit.item, e);
  });
}

/**
 * Create the inline plugin. Pass it in the chart config's `plugins` array and
 * set `plugins.legend.display: false`; `getContainer` must return the DOM
 * element (below the canvas) that hosts the legend.
 */
export function createHtmlLegendPlugin(
  getContainer: () => HTMLElement | null | undefined
): Plugin<ChartType> {
  return {
    id: "htmlLegend",
    afterUpdate(chart) {
      const container = getContainer();
      if (!container) return;

      let ul = container.querySelector<HTMLUListElement>("ul.html-legend-list");
      if (!ul) {
        ul = document.createElement("ul");
        ul.className = "html-legend-list";
        container.appendChild(ul);
        wireDelegation(ul, chart);
      }

      const items = getLegendItems(chart);
      const state = rendered.get(ul) ?? { items };
      state.items = items;
      rendered.set(ul, state);

      // Skip the DOM rebuild when nothing visible changed — afterUpdate fires
      // on every chart.update, including per-mousemove updates while dragging
      const sig = JSON.stringify(
        items.map((i) => [i.text, i.fillStyle, i.strokeStyle, i.lineWidth, i.hidden, i.borderRadius])
      );
      if (state.sig === sig) return;
      state.sig = sig;

      const resolvedLabels =
        chart.legend?.options?.labels ??
        chart.options.plugins?.legend?.labels ??
        {};
      const font: Partial<FontSpec> = (resolvedLabels.font as Partial<FontSpec> | undefined) ?? Chart.defaults.font ?? {};
      const fontSize = font.size ?? 12;
      const boxWidth = resolvedLabels.boxWidth ?? 40;
      const boxHeight = resolvedLabels.boxHeight ?? fontSize;

      while (ul.firstChild) ul.firstChild.remove();

      items.forEach((item, i) => {
        const li = document.createElement("li");
        li.dataset.idx = String(i);

        const box = document.createElement("span");
        box.className = "legend-box";
        box.style.background = String(item.fillStyle ?? "transparent");
        box.style.borderColor = String(item.strokeStyle ?? "transparent");
        box.style.borderStyle = "solid";
        box.style.borderWidth = `${Math.min(Number(item.lineWidth) || 0, boxHeight / 2)}px`;
        box.style.borderRadius = `${Number(item.borderRadius) || 0}px`;
        box.style.width = `${boxWidth}px`;
        box.style.height = `${boxHeight}px`;

        const text = document.createElement("span");
        text.textContent = String(item.text ?? "");
        text.style.color = String(item.fontColor ?? Chart.defaults.color ?? "#666");
        text.style.fontFamily =
          font.family ?? "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        text.style.fontSize = `${fontSize}px`;
        text.style.lineHeight = "1.2";
        text.style.whiteSpace = "nowrap";
        text.style.textDecoration = item.hidden ? "line-through" : "";

        li.appendChild(box);
        li.appendChild(text);
        ul!.appendChild(li);
      });
    },
  };
}
