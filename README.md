# Chart (`@webwriter/chart@2.0.0`)
[License: MIT](LICENSE) | Version: 2.0.0

ww-chart is an interactive data visualization widget for the WebWriter tool that implements various charts and diagrams for static and exploratory data visualization.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Scatterplot Exercise | `@webwriter/chart/snippets/scatterplot-exercise.html` |
| Mean Median Exercise | `@webwriter/chart/snippets/mean-median-exercise.html` |
| Bar+line Chart | `@webwriter/chart/snippets/bar+line-chart.html` |
| Pie+doughnut Chart | `@webwriter/chart/snippets/pie+doughnut-chart.html` |
| Polar Area Chart | `@webwriter/chart/snippets/polar-area-chart.html` |
| Radar Chart | `@webwriter/chart/snippets/radar-chart.html` |
| Sunscreen Exercise | `@webwriter/chart/snippets/sunscreen-exercise.html` |



## `WebwriterChart` (`<webwriter-chart>`)
An interactive data visualization widget with several chart types, CSV and Excel import, axis controls per visualization and a scatter plot with regression analysis.

Authors enter or import data in the Data tab, then use the chart tabs to configure visualizations. Each chart tab has its own type and axis settings. The fixed Scatter plot tab lets learners drag points, draw lines and show regression models with correlation measures.

The widget keeps its state (visualizations, data, options and the teacher options that decide what learners may change) in a JSON data block.

Chart types: Pie, Doughnut, Bar, Line, Polar Area, Radar and the Scatter plot, all drawn with Chart.js. Spreadsheet files are read with SheetJS, which is loaded when the first file is imported.

The Delete and Backspace keys remove the selected point or line of the scatter plot while it has the focus.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/chart/widgets/webwriter-chart.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/chart/widgets/webwriter-chart.js"></script>
<webwriter-chart></webwriter-chart>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/chart
```

```html
<link href="@webwriter/chart/widgets/webwriter-chart.css" rel="stylesheet">
<script type="module" src="@webwriter/chart/widgets/webwriter-chart.js"></script>
<webwriter-chart></webwriter-chart>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WebwriterChart.scopedElements` | `object` | - | `{ "sl-button": SlButton, "sl-switch": SlSwitch, "sl-checkbox": SlCheckbox, "sl-icon-button": SlIconButton, "sl-tooltip": SlTooltip, "wwci-dataset-input": DatasetInput, "wwci-chart-settings": ChartSettingsPanel, "bar-chart": BarChart, "doughnut-chart": DoughnutChart, "line-chart": LineChart, "pie-chart": PieChart, "polar-chart": PolarChart, "radar-chart": RadarChart, "scatter-chart-js": ScatterChartJs, "sl-tab-group": SlTabGroup, "sl-tab": SlTab, "sl-alert": SlAlert, "sl-select": SlSelect, "sl-option": SlOption, "wwci-select": OptionSelect, "sl-icon": SlIcon, }` | ✗ |
| `WebwriterChart.actions` | `object` | - | `{ configureChart: { label: (widget: { msg: MsgFn }) => widget.msg("Chart settings") }, deleteSelection: { hidden: true, shortcut: ["Delete", "Backspace"] }, }` | ✗ |
| `localize` | - | - | - | ✗ |
| `msg` | - | - | - | ✗ |
| `showChart` (`showChart`) | `boolean` | Whether a chart tab is active. | `false` | ✓ |
| `showData` (`showData`) | `boolean` | Whether the Data tab is active. | `true` | ✓ |
| `scatterXAxis` (`scatter-x`) | `number` | Column index of the x axis of the Scatter plot tab. | `0` | ✓ |
| `scatterYAxis` (`scatter-y`) | `number` | Column index of the y axis of the Scatter plot tab. | `1` | ✓ |
| `dataTabName` | `string` | - | `"Data"` | ✗ |
| `scatterplotTabName` | `string` | - | `"Scatter plot"` | ✗ |
| `editingVisualizationId` | `string \| null` | - | `null` | ✗ |
| `editingVisualizationName` | `string` | - | `""` | ✗ |
| `sharedState` | `ChartState` | - | - | ✗ |
| `onStateChange` | - | - | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `deleteSelection` | Declines the key unless the scatter plot holds the focus and a selection. | -
| `applyScatterChanges` | Moves the edits made in the scatter plot into the data table. | -
| `configureChart` | - | -
| `normalizeColumns` | - | `value: unknown`
| `normalizeColumnIndexes` | - | `value: unknown`, `labels: string[]`
| `handleTabShow` | - | `e: CustomEvent`
| `handleTabClose` | - | `e: CustomEvent`
| `addVisualization` | - | -
| `removeVisualization` | - | `id: string`
| `switchVisualization` | - | `id: string`
| `changeVizType` | - | `id: string`, `newType: ChartType`
| `changeVizColumns` | - | `id: string`, `columns: unknown`
| `changeVizXAxis` | - | `id: string`, `xIdx: number`
| `changeVizYColumns` | - | `id: string`, `columns: string[]`
| `changeVizXCategories` | - | `id: string`, `categories: string[]`
| `changeVizScaleLabel` | - | `id: string`, `label: string`
| `clearChartData` | - | -
| `setScatterOption` | Update a single scatter chart option (reactive: the new sharedState<br>reference re-renders the scatter chart immediately). | `key: string`, `value: string | number | boolean`
| `startInlineTabRename` | - | `e: MouseEvent`, `id: string`
| `commitInlineTabRename` | - | `nextNameOverride: string`
| `cancelInlineTabRename` | - | -
| `handleInlineTabRenameKeydown` | - | `e: KeyboardEvent`
| `handleTabKeydownWhileEditing` | - | `e: KeyboardEvent`, `id: string`

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Events
| Name | Description |
| :--: | :---------: |
| focus | - |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*