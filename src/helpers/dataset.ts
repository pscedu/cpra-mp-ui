import { apiBaseUrl } from "./config";
import { getApiNdJson, makeQueryString } from "./utils";

export class Dataset {
  variable: string;
  grid: string;
  time_unit: string;

  constructor({ variable, grid, time_unit }) {
    this.variable = variable;
    this.grid = grid;
    this.time_unit = time_unit;
  }

  getBaseUrl() {
    return `${apiBaseUrl}/datasets/${this.variable}/${this.grid}/${this.time_unit}`;
  }

  getDataUrl(format: string, params: [string, any][]) {
    return `${this.getBaseUrl()}/data.${format}${makeQueryString(params)}`;
  }

  getTileUrl(format: string, params: [string, any][]) {
    return `${this.getBaseUrl()}/data/{z}/{x}/{y}.${format}${makeQueryString(params)}`;
  }
}

export async function getDatasets() {
  return (await getApiNdJson("datasets.ndjson")).map(
    (dataset) => new Dataset(dataset)
  );
}
