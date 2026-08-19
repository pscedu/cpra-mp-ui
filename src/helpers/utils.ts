import { selectionColors } from "./config";
import { Dataset } from "./structure";
import { Coordinate, Tag } from "./types";
import { hasLink } from "./markdown";

export async function getJson(
  absoluteUrl: string,
  { body = null, headers = {}, method = "GET" } = {},
) {
  const response = await fetch(absoluteUrl, {
    body: body ? JSON.stringify(body) : null,
    headers: { ...headers, accept: "application/json" },
    method,
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

export async function getNdJson(
  absoluteUrl: string,
  { signal }: { signal: AbortSignal | null } = { signal: null },
) {
  const response = await fetch(absoluteUrl, {
    headers: { accept: "application/x-ndjson" },
    signal: signal,
  });
  if (response.status < 200 || response.status > 299) {
    console.error(
      `Received status ${response.status} while loading ${absoluteUrl}`,
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
  key: string = "name",
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
          (dateStr) => new Date(`${dateStr}T00:00:00`),
        );
        while (currentDate <= endDate) {
          if (day === null || currentDate.getDate() === day)
            result.push(
              new Date(currentDate.valueOf()).toISOString().split("T")[0],
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

export function getFilterParams(
  requiredDimensions,
  filters,
  maxValues: number | null = null,
  maxValueExceptions: string[] = [],
) {
  const params = [];
  for (let dimension of requiredDimensions) {
    let dimensionParamsCount = 0;
    for (let value of filters[dimension.name] || []) {
      params.push([dimension.name, value]);
      dimensionParamsCount++;
      if (
        maxValues &&
        !maxValueExceptions.includes(dimension.name) &&
        dimensionParamsCount === maxValues
      )
        break;
    }
  }
  return params;
}

export function makeQueryString(params: [string, any][]) {
  return params.length
    ? `?${params
        .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
        .join("&")}`
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
      16,
    )}`.substr(-2),
  )}`;

/**
 * Get the color for a selected geography.
 * @param {number} i - Dataset index.
 * @param {number} adjustment - Luminosity adjustment.
 * @returns
 */
export const getSelectionColor = (
  i: number,
  { adjustment, count }: { adjustment?: number; count?: number } = {},
) =>
  adjustColor(selectionColors.slice(0, count)[i] || "000000", adjustment || 0);

/**
 * Round a coordinate to the precision at which selections are stored, so that
 * map interactions do not fill the URL hash with meaningless precision.
 * @param {Coordinate} coordinate - Longitude/latitude pair.
 * @returns {Coordinate} - The rounded coordinate.
 */
export const roundCoordinate = ([lng, lat]: Coordinate): Coordinate =>
  [lng, lat].map((value) => parseFloat(value.toFixed(5))) as Coordinate;

export const parseDate = (dateStr: string) => {
  const dateParts = dateStr.split("-").map((val) => parseInt(val));
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
};

// Adapted from:
// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
export function toTitleCase(text: string) {
  return (text || "").replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
  );
}

/**
 * Gets all possible combinations from an object with array properties using reduce
 * (Cartesian product for objects)
 *
 * @param {Object} obj - Object with array properties
 * @returns {Array<Object>} All possible combinations as objects
 */
export function getCartesianProductObject(obj) {
  const keys = Object.keys(obj);
  const values = keys.map((key) => obj[key]);

  return values.reduce(
    (acc, curr, index) =>
      acc.flatMap((a) => curr.map((b) => ({ ...a, [keys[index]]: b }))),
    [{}],
  );
}

export function sortConsistent(newValues, oldValues) {
  if (!oldValues) return newValues;
  const getIdx = (value) => {
    const idx = (oldValues || []).indexOf(value);
    return idx === -1 ? 9999 : idx;
  };
  newValues.sort((a, b) => {
    return getIdx(a) - getIdx(b);
  });
}

export function moveToFirstPosition(newFirstItem, allItems) {
  return [newFirstItem, ...allItems.filter((item) => item !== newFirstItem)];
}

export function sqlValue(value: string | number | Date, dimension = "") {
  return dimension === "calendar_day"
    ? `'${value}'::date`
    : typeof value === "number"
      ? value
      : `'${value}'`;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until at least `wait` milliseconds have elapsed since the last time it was invoked.
 *
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export const debounce = <T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | undefined;

  return (...args: Parameters<T>): void => {
    // Clear the previous timeout if the debounced function is called again
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout to invoke the original function
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait) as unknown as number; // Type assertion for browser/Node compatibility
  };
};

export const snakeToCamel = (str: string): string =>
  str.replace(/(_\w)/g, (match) => match[1].toUpperCase());

export const camelToSnake = (str: string): string =>
  str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1_$2").toLowerCase();

export const getIssueOrCommentWarning = (
  label: string,
  text: string,
  tags: Tag[] | null = null,
) => {
  if (!hasLink(text)) return `Your ${label} does not contain a link.`;

  if (tags !== null)
    for (const [prefix, tagLabel] of [
      ["type:", "a type"],
      ["impact:", "an impact"],
      ["theme:", "a theme"],
    ]) {
      if (!tags.some(({ name }) => name.startsWith(prefix)))
        return `Your ${label} is not tagged with ${tagLabel}.`;
    }
};
