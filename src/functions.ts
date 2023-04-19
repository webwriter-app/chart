import { ChartData } from "./interfaces";

export const converter = {
  fromAttribute: (value: string | null, type: unknown): any => {
    console.log(value, type);
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
  const r = parseInt(color.substring(1, 3), 16),
    g = parseInt(color.substring(3, 5), 16),
    b = parseInt(color.substring(5, 7), 16);
  return `rgb(${r},${g},${b})`;
}

export function convertRGBToHex(color: string): string {
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
  return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
}

export function removeAlphaFromRGB(color: string): string {
  return color.replace(/,.*\)/, ")");
}
