import { LitElement } from "lit";
import { CompleteChartData } from "../../interfaces";
import { addAlphaToRGB } from "../../functions";

export function getContext<T extends LitElement>(
  this_: T,
  canvasId = "chart-canvas"
): CanvasRenderingContext2D {
  const canvas = (this_.shadowRoot?.getElementById(canvasId) ||
    null) as HTMLCanvasElement | null;
  if (!canvas) throw new Error("No canvas found");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No context found");
  return ctx;
}

export const getLabels = (data: CompleteChartData): string[] =>
  Object.values(data).map((val) => val.label);

export const getData = (data: CompleteChartData): number[] =>
  Object.values(data).map((val) => val.value);

export const getBackgroundColor = (
  data: CompleteChartData,
  filled: boolean
): string[] =>
  Object.values(data).map((val) => addAlphaToRGB(val.color, filled ? 1 : 0.2));

export const getBorderColor = (data: CompleteChartData): string[] =>
  Object.values(data).map((val) => addAlphaToRGB(val.color, 1));
