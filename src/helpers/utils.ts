import { selectionColors } from "./config";
import { Dataset } from "./structure";

export async function getJson(absoluteUrl: string, { headers = {} } = {}) {
  const response = await fetch(absoluteUrl, {
    headers: { ...headers, accept: "application/json" },
  });
  if (response.status < 200 || response.status > 299) {
    return { error: { status: response.status } };
  } else {
    try {
      return await response.json();
    } catch (error) {
      return { error: { message: error } };
    }
  }
}

export async function getNdJson(absoluteUrl: string) {
  const response = await fetch(absoluteUrl, {
    headers: { accept: "application/x-ndjson" },
  });
  if (response.status < 200 || response.status > 299) {
    console.error(
      `Received status ${response.status} while loading ${absoluteUrl}`
    );
    return [];
  } else {
    try {
      return (await response.text())
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line));
    } catch (error) {
      console.error(`Error while loading ${absoluteUrl}: ${error}`);
      return [];
    }
  }
}

export function makeMap<T>(
  items: T[],
  key: string = "name"
): { [key: string]: T } {
  const result = {};
  for (let item of items) result[item[key]] = item;
  return result;
}

export function extractValues(values, step = 1, day = null) {
  const result = [];
  for (let value of values) {
    if (Array.isArray(value)) {
      let [current, end] = value;
      if (typeof value[0] === "number") {
        while (current <= end) {
          result.push(current);
          current += step;
        }
      } else {
        let [currentDate, endDate] = [current, end].map(
          (dateStr) => new Date(`${dateStr}T00:00:00`)
        );
        while (currentDate <= endDate) {
          if (day === null || currentDate.getDate() === day)
            result.push(
              new Date(currentDate.valueOf()).toISOString().split("T")[0]
            );
          currentDate.setDate(currentDate.getDate() + step);
        }
      }
    } else {
      result.push(value);
    }
  }
  return result;
}

export function extractCatalogObject(obj: any, dataset: Dataset) {
  const result = {};
  for (let key in obj) {
    let step = 1;
    let day = null;
    if (key.startsWith("calendar_")) {
      if (dataset.time_unit == "decadal") step = 10;
      if (dataset.time_unit == "monthly") day = 1;
    }
    result[key] = extractValues(obj[key], step, day);
  }
  return result;
}

export function mergeOr(objects: any[], keys: string[] = null) {
  const result = {};
  for (let obj of objects) {
    for (let key in obj) {
      if (!keys || keys.includes(key)) {
        const values = obj[key];
        if (key in result) {
          for (let value of values)
            if (!result[key].includes(value)) result[key].push(value);
        } else {
          result[key] = values;
        }
      }
    }
  }
  return result;
}

export function getFilterParams(requiredDimensions, filters) {
  const params = [];
  for (let dimension of requiredDimensions)
    for (let value of filters[dimension.name] || [])
      params.push([dimension.name, value]);
  return params;
}

export function makeQueryString(params: [string, any][]) {
  return params.length
    ? `?${params.map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`).join("&")}`
    : "";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adjust a color by changing its luminosity.
 * @param {string} color - Hexadecimal color code.
 * @param {number} amount - Value to add to the red, green, and blue channels.
 * @returns {string} - Hexadecimal representation of the adjusted color.
 */
export const adjustColor = (color: string, amount: number) =>
  `#${color.replace(/../g, (color) =>
    `0${Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(
      16
    )}`.substr(-2)
  )}`;

/**
 * Get the color for a selected geography.
 * @param {number} i - Dataset index.
 * @param {number} adjustment - Luminosity adjustment.
 * @returns
 */
export const getSelectionColor = (i: number, adjustment?: number) =>
  adjustColor(selectionColors[i] || "000000", adjustment || 0);
