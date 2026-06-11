import { ChartData } from "./state/models";
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
    if (type === "color") return convertRGBToHex(value.toString());
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
  value: string | number | boolean | object | Array<unknown>
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

export function randomNumber(min?: number, max?: number): number {
  if (min && max) return Math.floor(Math.random() * (max - min) + min);
  return Math.floor(Math.random() * 100);
}

export function randomColor(): string {
  const h = randomNumber(0, 360);
  const l = randomNumber(30, 60);

  return hslToHex(h, 100, l);
}

export function generateColorWheel(numColors: number): string[] {
  const colors = [];
  const saturation = 100; 
  const lightnessBase = 50; 

  const step = Math.floor((360 - 60) / numColors); 

  for (let i = 0; i < numColors; i++) {
    let hue = step * i;

    if (hue >= 0 && hue < 30) {
      hue += 20;
    } else if (hue >= 330) {
      hue -= 20; 
    }
    const lightness = lightnessBase + (i % 2 === 0 ? 10 : -10);
    colors.push(hslToHex(hue, saturation, lightness));
  }

  return colors;
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
      .padStart(2, "0"); 
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function chartOption<T extends keyof TypeMapping>(
  type: T | "array",
  defaultValue: TypeMapping[T],
  name: string
): OptionDef<T>;
export function chartOption(
  type: "number",
  defaultValue: number,
  name: string,
  min?: number,
  max?: number
): OptionDef<"number">;
export function chartOption<T extends keyof TypeMapping>(
  type: T | "number",
  defaultValue: TypeMapping[T] | number,
  name: string,
  min?: number,
  max?: number
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

