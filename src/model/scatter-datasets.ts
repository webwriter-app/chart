import type { ChartDataset, Point } from "chart.js";
import type { ChartDataSet, DrawnLine } from "./models";
import { COLORS, HIT_PX, type Pt } from "./scatter-geometry";

/** Data points plus the drawn lines, which are line datasets in the same chart. */
export type PlotDataset = ChartDataset<"scatter" | "line", Point[]>;

export type PlotView = {
  sets: ChartDataSet[];
  xi: number;
  yi: number;
  selected: ReadonlySet<number>;
  hidden: ReadonlySet<number>;
  lines: DrawnLine[];
  selectedLine: number | null;
  /** Position of a line while it is dragged. */
  activeLine: (line: DrawnLine, index: number) => DrawnLine;
  /** The point that is dragged and where it is now. */
  dragged: { index: number; at: Pt } | null;
  /** First endpoint and cursor (data space) of the line that is being drawn. */
  preview: { from: Pt; to: Pt } | null;
  lineName: (index: number) => string;
  previewName: string;
};

export function buildPlotDatasets(view: PlotView): PlotDataset[] {
  const { sets, xi, yi } = view;
  if (xi < 0 || yi < 0) return [];

  const pointDatasets = sets.flatMap((set, i): PlotDataset[] => {
    let x = Number(set.data[xi]);
    let y = Number(set.data[yi]);
    // Use live drag position for the point being dragged (smooth visual)
    if (view.dragged?.index === i) {
      x = view.dragged.at.x;
      y = view.dragged.at.y;
    }
    if (isNaN(x) || isNaN(y)) return [];
    const isSel = view.selected.has(i);
    const isHid = view.hidden.has(i);
    const base = set.color ?? COLORS[i % COLORS.length];
    return [
      {
        label: set.name,
        data: [{ x, y }],
        backgroundColor: isHid ? "transparent" : isSel ? "rgba(220,0,0,0.3)" : `${base}4D`,
        borderColor: isSel ? "#cc0000" : base,
        borderWidth: isSel ? 2 : 1,
        pointRadius: isHid ? 0 : 6,
        pointHoverRadius: isHid ? 0 : 9,
        pointHoverBorderWidth: 2,
        pointHitRadius: isHid ? 0 : HIT_PX,
      },
    ];
  });

  const lineDatasets = view.lines.map((line, i): PlotDataset => {
    const isSel = i === view.selectedLine;
    const al = view.activeLine(line, i);
    return {
      type: "line" as const,
      label: line.name ?? view.lineName(i),
      data: [{ x: al.x1, y: al.y1 }, { x: al.x2, y: al.y2 }],
      parsing: false,
      // Endpoint handles are drawn by the overlay plugin, not as dataset points
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 8,
      borderColor: isSel ? "#ff6600" : "#444",
      borderWidth: isSel ? 2.5 : 2,
      tension: 0,
      fill: false,
      order: -1,
    };
  });

  // Lines rendered first (behind points) so points remain clickable when overlapping
  if (!view.preview) return [...lineDatasets, ...pointDatasets];
  const previewLine: PlotDataset = {
    type: "line" as const,
    label: view.previewName,
    data: [{ x: view.preview.from.x, y: view.preview.from.y }, { x: view.preview.to.x, y: view.preview.to.y }],
    parsing: false,
    pointRadius: 0,
    pointHitRadius: 0,
    borderColor: "#444",
    borderWidth: 2,
    borderDash: [6, 3],
    tension: 0,
    fill: false,
  };
  return [...lineDatasets, ...pointDatasets, previewLine];
}
