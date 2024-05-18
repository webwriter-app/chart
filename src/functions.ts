import { ChartData, ChartDataSet, ChartDataSets } from "./interfaces";
import randomWords from "random-words";

export const converter = {
  fromAttribute: (value: string | null, type: unknown): any => {
    if (!value) return null;
    if (type === Number || type === "number") return parseInt(value);
    if (type === Boolean || type === "boolean") return value === "true";
    if (type === Object || type === Array) return JSON.parse(value);

    if (type === "color")
      return isColorHex(value) ? convertHexToRGB(value) : value;

    if (String(type).startsWith("Object<")) {
      const obj = JSON.parse(value.toString());
      const objType = String(type).replace("Object<", "").replace(">", "");
      const newObj: { [key: string]: string } = {};
      for (const key in obj) {
        newObj[key] = converter.fromAttribute(obj[key], objType);
      }
      return newObj;
    }

    if (String(type).startsWith("Array<")) {
      const arr = JSON.parse(value.toString());
      const arrType = String(type).replace("Array<", "").replace(">", "");
      const newArr: string[] = [];
      for (const item of arr) {
        newArr.push(converter.fromAttribute(item, arrType));
      }
      return newArr;
    }

    if (String(type) === "ChartData") {
      //TODO: add option for simple data-only object
      let result: ChartData = {};

      const obj: ChartData = JSON.parse(value.toString());
      for (const key in obj) {
        result[key] = {
          value: obj[key].value,
          //TODO: add option for auto color
          color: converter.fromAttribute(obj[key].color || "#000000", "color"),
          label: obj[key].label || key,
        };
      }
      return result;
    }

    return value;
  },
  toAttribute: (value: unknown, type: unknown): string | null => {
    if (!value) return null;
    if (type === Number) return value.toString();
    if (type === Boolean) return value.toString();
    if (type === Object || type === Array) return JSON.stringify(value);
    if (type === "color") convertRGBToHex(value.toString());
    if (String(type).startsWith("Object<"))
      return JSON.stringify(value.toString());
    if (String(type) === "ChartData") return JSON.stringify(value.toString());

    return value.toString();
  },
};

export function attribute(value: string): string;
export function attribute(value: number): string;
export function attribute(value: boolean): string;
export function attribute(value: object): string;
export function attribute(value: Array<unknown>): string;
export function attribute(
  value: string | number | boolean | object | Array<unknown>,
): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

export function isColorHex(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function convertHexToRGB(color: string): string {
  if (!color) return "rgb(0,0,0)";
  if (!isColorHex(color)) return color;
  const r = parseInt(color.substring(1, 3), 16),
    g = parseInt(color.substring(3, 5), 16),
    b = parseInt(color.substring(5, 7), 16);
  return `rgb(${r},${g},${b})`;
}

export function convertRGBToHex(color: string): string {
  if (!color) return "#000000";
  if (!color.startsWith("rgb")) return color;
  const rgb = color
    .replace(/^rgb\(|\s+|\)$/g, "")
    .split(",")
    .map(Number);
  return (
    "#" +
    rgb
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

export function addAlphaToRGB(color: string, alpha: number): string {
  if (!color) return "rgba(0,0,0,0)";
  if (!color.startsWith("rgb")) color = convertHexToRGB(color);
  return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
}

export function removeAlphaFromRGB(color: string): string {
  if (!color) return "rgb(0,0,0)";
  return color.replace(/,.*\)/, ")");
}

export function randomNumber(min?: number, max?: number): number {
  if (min && max) return Math.floor(Math.random() * (max - min) + min);
  return Math.floor(Math.random() * 100);
}

export function randomColor(): string {
  const h = randomNumber(0, 360);
  const l = randomNumber(30, 60);

  return hslToHex(h, 100, l);
}

export function randomString(): string {
  return randomWords(1)[0];
}

function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function chartOption<T extends keyof TypeMapping>(
  type: T,
  defaultValue: TypeMapping[T],
  name: string,
): OptionDef<T>;
export function chartOption(
  type: "number",
  defaultValue: number,
  name: string,
  min?: number,
  max?: number,
): OptionDef<"number">;
export function chartOption<T extends keyof TypeMapping>(
  type: T | "number",
  defaultValue: TypeMapping[T] | number,
  name: string,
  min?: number,
  max?: number,
): OptionDef<T> {
  if (type === "number")
    return {
      //@ts-ignore
      type: "number",
      default: defaultValue,
      name,
      min: min ?? Number.MIN_SAFE_INTEGER,
      max: max ?? Number.MAX_SAFE_INTEGER,
    };
  else
    return {
      type,
      default: defaultValue,
      name,
    } as any;
}

export function fillArray<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

export async function readFileInput(e: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let fileContent = "";

    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = function (event) {
      if (!event.target) return;
      fileContent += event.target.result + "\n";
    };
    reader.readAsText(file);
    reader.onloadend = () => resolve(fileContent);
    reader.onerror = () => reject();
  });
}

export function csvToDataset(fileContent: string): {
  datasets: ChartDataSets;
  title: string | undefined;
} {
  const sets: ChartDataSet[] = [];
  const lines = fileContent.replace(/\r\n/g, "\n").split("\n");

  const wwcFormat = lines[0].startsWith("#wwc#");

  let numberOfDataColumns = lines[0].split(",").indexOf("#");
  let title = undefined;
  let firstElementIsNumber = true;

  lines.slice(1).forEach((line) => {
    if (!line) return;
    const values = line.trim().split(",");
    let color = values[numberOfDataColumns + 1];
    let colors = values.slice(numberOfDataColumns + 2);
    if (values.length < numberOfDataColumns) return;

    if (!wwcFormat) {
      color = randomColor();
      colors = values.map(() => randomColor());
    }

    const data =
      numberOfDataColumns === -1
        ? values.map((x) => Number(x))
        : values.slice(0, numberOfDataColumns).map((x) => Number(x));

    let set = {
      name: randomString(),
      data,
      color,
      colors,
    };
    if (Number.isNaN(Number(values[0]))) {
      firstElementIsNumber = false;
      set.name = values[0];
      set.data = set.data.slice(1);
    }

    sets.push(set);
  });

  let labels =
    numberOfDataColumns === -1
      ? lines[0].split(",")
      : lines[0].split(",").slice(0, numberOfDataColumns);

  if (wwcFormat) labels[0] = labels[0].slice(5);

  if (!firstElementIsNumber) {
    title = labels[0];
    labels = labels.slice(1);
    debugger;
  }

  return {
    datasets: {
      labels: labels,
      sets: sets,
    },
    title,
  };
}
