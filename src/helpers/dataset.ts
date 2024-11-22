import { getApiNdJson } from "./utils";

export class Dataset {
  variable: string;
  grid: string;
  time_unit: string;

  constructor({ variable, grid, time_unit }) {
    this.variable = variable;
    this.grid = grid;
    this.time_unit = time_unit;
  }
}

export async function getDatasets() {
  return (await getApiNdJson("datasets.ndjson")).map(
    (dataset) => new Dataset(dataset)
  );
}
