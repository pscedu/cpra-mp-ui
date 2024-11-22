import { apiBaseUrl } from "./config";

export async function getApiJson(relativeUrl: string) {
  const response = await fetch(`${apiBaseUrl}/${relativeUrl}`, {
    headers: { accept: "application/json" },
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

export async function getApiNdJson(relativeUrl: string) {
  const response = await fetch(`${apiBaseUrl}/${relativeUrl}`, {
    headers: { accept: "application/x-ndjson" },
  });
  if (response.status < 200 || response.status > 299) {
    console.error(
      `Received status ${response.status} while loading ${relativeUrl}`
    );
    return [];
  } else {
    try {
      return (await response.text())
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line));
    } catch (error) {
      console.error(`Error while loading ${relativeUrl}: ${error}`);
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
