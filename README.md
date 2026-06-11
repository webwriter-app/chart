# WebWriter Chart

License: [MIT](LICENSE) | Version: 1.2.17

An interactive data visualization widget for [WebWriter](https://webwriter.app/) that supports multiple chart types, CSV/Excel import, per-visualization axis controls, and an interactive scatter plot with regression analysis.

## Snippets

[Snippets](https://webwriter.app/docs/snippets/snippets/) are ready-made examples you can insert directly into WebWriter.

| Name | Import Path |
| --- | --- |
...

## WebwriterChart (`<webwriter-chart>`)

The top-level custom element. Authors use the Data tab to enter or import data, then switch to chart tabs to configure and display visualizations. Multiple independent chart tabs can be open at once (each with its own type and axis settings). A dedicated Scatter plot tab provides full drag-and-draw interaction.

### Usage

With a CDN (e.g. [jsDelivr](https://www.jsdelivr.com/)):
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/chart/dist/widgets.js"></script>
<webwriter-chart></webwriter-chart>
```

With a bundler:
```html
<script type="module" src="@webwriter/chart/widgets/webwriter-chart.js"></script>
<webwriter-chart></webwriter-chart>
```

### Attributes

| Attribute | Type | Description | Default | Reflected |
| --- | --- | --- | --- | --- |
| `sharedState` | `Object` | Full widget state (visualizations, datasets, options). Serialized to an HTML attribute by WebWriter for persistence. | — | ✓ |
| `analyzable` | `boolean` | Reserved for future analysis mode. | `false` | ✓ |
| `show-chart` | `boolean` | Whether a chart tab is currently active. | `false` | ✓ |
| `show-data` | `boolean` | Whether the Data tab is currently active. | `true` | ✓ |
| `scatter-x` | `number` | Column index used as the X-axis in the fixed Scatter plot tab. | `0` | ✓ |
| `scatter-y` | `number` | Column index used as the Y-axis in the fixed Scatter plot tab. | `1` | ✓ |

### Teacher Options (inside `sharedState`)

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| `showOptions` | `boolean` | Show the settings panel to students. | `true` |
| `showData` | `boolean` | Show exact data values on hover. | `true` |
| `showLockedOptions` | `boolean` | Display locked options to students (read-only). | `true` |
| `changeData` | `boolean` | Allow students to edit cell values and labels. | `true` |
| `changeOptions` | `boolean` | Allow students to change chart options. | `true` |
| `addRemoveData` | `boolean` | Allow students to add or remove rows/columns. | `true` |

---

## Supported Chart Types

| Name | Description |
| --- | --- |
| **Pie** | Single-dataset pie chart with configurable border. |
| **Doughnut** | Pie variant with a hollow center. |
| **Bar** | Grouped or stacked bars; supports filled mode and custom Y-scale. |
| **Line** | Multi-series line chart with optional smoothing and custom Y-scale. |
| **Polar Area** | Radial chart where each segment's radius encodes its value. |
| **Radar** | Spider/web chart; each column becomes a spoke axis. |
| **Scatter plot** | Fixed tab with D3-powered interaction: drag points, draw regression lines, toggle grid/outliers/mean. |

---

## Key Files

### `src/widget/webwriter-chart.ts`
The root `<webwriter-chart>` element. Owns `sharedState`, manages the tab strip (Data / Scatter plot / chart tabs), handles tab switching, inline tab renaming, and dispatches axis/column selection changes to the active visualization.

### `src/widget/state/models.ts`
All TypeScript interfaces for shared state: `ChartState`, `Visualization`, `ChartDataSets`, `ChartDataSet`, `ScatterDatasets`, `ScatterDataset`, `DrawnLine`, and `RegressionType`.

### `src/widget/stateful-component.ts`
Base class for every sub-component. Extends `LitElementWw` and holds the `sharedState` property plus `dispatchStateChange()` for event-bus communication back to the root.

### `src/widget/components/charts/chart-base.ts` — `GenericChart`
Abstract base for all Chart.js-backed charts. Declares shared properties (`datasets`, `label`, `xAxisIndex`, `yColumns`, `xCategories`, `scaleLabel`) and the `transformByXAxis()` helper that reshapes raw tabular data according to the selected axis mode:

| `xAxisIndex` | Behaviour |
| --- | --- |
| `< 0` (Row Labels, default) | Row names become X-axis labels; each column is a series. |
| `−2` (Column Labels) | Column names become X-axis labels; each row is a series. |
| `≥ 0` | Values from that column become X-axis labels; remaining columns are series. |

### `src/widget/components/charts/chart-registry.ts`
Central registry. Defines option schemas for every chart type, exports `availableCharts`, `getOptionsDefinition(type)`, and the `getChart()` factory that renders the correct chart element via `unsafeStatic`.

### `src/widget/components/charts/chart-helpers.ts` — `ChartHelper`
Utility class wrapping a `Chart.js` instance. Provides `setYScales()`, `setRScales()`, `setLegendHoverHighlight()`, `setLineSmooth()`, `setHideExactValues()`, and `update()`. Also exports `CHART_PALETTE` and `LINE_PALETTE` color arrays and `makeCircularLegendCallbacks()` for pie/doughnut/polar hover effects.

### `src/widget/components/data-entry/dataset-input.ts` — `DatasetInput` (`<wwci-dataset-input>`)
Spreadsheet-style table editor for the standard chart data. Supports CSV/Excel file upload (drag-and-drop or file picker), per-cell editing, per-series color picking, and add/delete row/column actions.

### `src/widget/components/data-entry/scatter-dataset-input.ts` — `ScatterDatasetInput` (`<wwci-scatterdataset-input>`)
Table editor for the standalone (non-fixed) scatter dataset. Supports uploading CSV files with mixed numeric/string columns, column type switching, per-column color filter configuration, and dataset selection.

### `src/widget/components/data-entry/select-dataset.ts` — `SelectDataset` (`<wwci-select-dataset>`)
Dropdown + X/Y axis selector used inside `ScatterDatasetInput` to pick which datasets and columns to plot.

### `src/widget/components/settings/chart-settings-panel.ts` — `ChartSettingsPanel` (`<wwci-chart-settings>`)
Right-side options panel. Dynamically renders controls (toggle, number input, dropdown) for every option in the active chart's `optionDefinition`. Options can be individually locked by authors to prevent student changes.

### `src/widget/components/controls/controls.ts`
Three reusable Shoelace-backed input controls:

| Element | Tag | Purpose |
| --- | --- | --- |
| `OptionSelect` | `<wwci-select>` | Single-value dropdown; fires `wwci-change`. |
| `ToggleSwitch` | `<wwci-switch>` | Boolean toggle; fires `wwci-change`. |
| `NumberField` | `<wwci-limited-number-input>` | Clamped numeric input; fires `wwci-limited-number-input`. |

### `src/widget/components/charts/scatter/scatter-chart.ts` — `ScatterChartJs` (`<scatter-chart-js>`)
The interactive scatter plot built on Chart.js. Features include: draggable data points, freehand line drawing, regression overlays (Linear, Polynomial, Local, Exponential, Logarithmic), snap-to-grid, outlier detection, mean marker, and correlation display. Changes can be written back to the shared dataset via **Apply Changes to Data**.

### `src/widget/components/charts/scatter/scatter-utils.ts`
Pure color utility for the scatter plot: `updateColorForFilter()` assigns colors to data points based on a numeric range or string category filter.

### `src/widget/webwriter-chart.utils.ts`
Stateless helpers: `normalizeColumnsInput()`, `normalizeColumnIndexesInput()`, and `deriveFixedScatterDatasets()` (converts the standard `ChartDataSets` format into the `ScatterDatasets` format used by the fixed Scatter plot tab).

### `src/widget/utils.ts`
Low-level utilities: `converter` (Lit property converter for chart-base properties), color helpers (`convertHexToRGB`, `convertRGBToHex`, `addAlphaToRGB`, `randomColor`, `generateColorWheel`), `chartOption()` factory for building option definitions, and `randomString()` / `randomNumber()` for generating placeholder data.
