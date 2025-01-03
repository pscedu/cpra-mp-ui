import { apiBaseUrl, staticTilesBaseUrl } from "./config";
import { getApiJson, getApiNdJson, makeMap, makeQueryString } from "./utils";

export class DimensionValue<T> {
  value: T;
  label: string | null;

  constructor({ value, label }) {
    this.value = value;
    this.label = label;
  }
}

export class Dimension<T> {
  name: string;
  label: string;
  type: string;
  dtype: string;
  required: boolean;
  null: boolean;
  values: DimensionValue<T>[];
  minValue: T | null;
  maxValue: T | null;

  constructor({
    name,
    label,
    type,
    dtype,
    required,
    null: nullAllowed,
    values,
    min_value,
    max_value,
  }) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.dtype = dtype;
    this.required = required;
    this.null = nullAllowed;
    this.values = values
      ? values.map((value) => new DimensionValue(value))
      : null;
    this.minValue = min_value;
    this.maxValue = max_value;
  }
}

export class Variable {
  name: string;
  label: string;
  dtype: string;
  model: string;
  subroutine: string;
  unit: string | null;
  legend: Legend | null;
  geographic_units: string[];
  time_units: string[];
  required_dimensions: Dimension<any>[];

  constructor({
    name,
    label,
    dtype,
    model,
    subroutine,
    unit,
    legend,
    geographic_units,
    time_units,
    required_dimensions,
  }) {
    this.name = name;
    this.label = label;
    this.dtype = dtype;
    this.model = model;
    this.subroutine = subroutine;
    this.unit = unit;
    this.legend = legend;
    this.geographic_units = geographic_units;
    this.time_units = time_units;
    this.required_dimensions = required_dimensions;
  }
}

export class Grid {
  name: string;
  grid_type: string;
  crs: string;
  geographies: number | null;
  bounds: number | null;
  height: number | null;
  width: number | null;

  constructor({ name, grid_type, crs, geographies, bounds, height, width }) {
    this.name = name;
    this.grid_type = grid_type;
    this.crs = crs;
    this.geographies = geographies;
    this.bounds = bounds;
    this.height = height;
    this.width = width;
  }

  isRaster() {
    return this.grid_type === "raster";
  }

  isVector() {
    return this.grid_type === "vector";
  }

  getTileUrl() {
    return this.isVector() ? `${staticTilesBaseUrl}/${this.name}` : null;
  }
}

export class LegendBreakPoint {
  label: string;
  color: string;
  upper_bound: number | null;

  constructor({ label, color, upper_bound }) {
    this.label = label;
    this.color = color;
    this.upper_bound = upper_bound;
  }
}

export class Legend {
  name: string;
  break_points: LegendBreakPoint[];

  constructor({ name, break_points }) {
    this.name = name;
    this.break_points = break_points.map((bp) => new LegendBreakPoint(bp));
  }
}

export class Dataset {
  variable: Variable;
  grid: Grid;
  time_unit: string;

  constructor({
    variable,
    grid,
    time_unit,
  }: {
    variable: Variable;
    grid: Grid;
    time_unit: string;
  }) {
    this.variable = variable;
    this.grid = grid;
    this.time_unit = time_unit;
  }

  getBaseUrl() {
    return `${apiBaseUrl}/datasets/${this.variable.name}/${this.grid.name}/${this.time_unit}`;
  }

  getDataUrl(params: [string, any][], format: string) {
    return `${this.getBaseUrl()}/data.${format}${makeQueryString(params)}`;
  }

  getTileUrl(params: [string, any][]) {
    return (
      this.grid.getTileUrl() ||
      `${this.getBaseUrl()}/data/{z}/{x}/{y}.png${makeQueryString(params)}`
    );
  }
}

export class Structure {
  datasets: Dataset[];
  dimensions: Dimension<string | number>[];
  dimensionsMap: { [key: string]: Dimension<any> };
  variables: Variable[];
  variablesMap: { [key: string]: Variable };
  grids: Grid[];
  gridsMap: { [key: string]: Grid };
  legends: Legend[];
  legendsMap: { [key: string]: Legend };

  constructor(datasets, dimensions, variables, grids, legends) {
    this.dimensions = dimensions.map((dimension) => new Dimension(dimension));
    this.dimensionsMap = makeMap(this.dimensions);

    this.grids = grids.map((grid) => new Grid(grid));
    this.gridsMap = makeMap(this.grids);

    this.legends = legends.map((legend) => new Legend(legend));
    this.legendsMap = makeMap(this.legends);

    this.variables = variables.map(
      (variable) =>
        new Variable({
          ...variable,
          legend: variable.legend ? this.legendsMap[variable.legend] : null,
          required_dimensions: variable.required_dimensions
            ? variable.required_dimensions.map(
                (dimensionName) => this.dimensionsMap[dimensionName]
              )
            : [],
        })
    );
    this.variablesMap = makeMap(this.variables);

    // FIXME: Remove the filter below once the user interface supports date selection.
    this.datasets = datasets.map(
      (dataset) =>
        new Dataset({
          variable: this.variablesMap[dataset.variable],
          grid: this.gridsMap[dataset.grid],
          time_unit: dataset.time_unit,
        })
    );
  }

  getRequiredDimensions(
    datasets: Dataset[],
    includeDataset = false,
    includeMetadata = false
  ): Dimension<any>[] {
    return this.dimensions.filter((dimension) => {
      if (
        (!includeDataset && dimension.type === "dataset") ||
        (!includeMetadata && dimension.type === "metadata")
      )
        return false;
      for (let dataset of datasets) {
        let variable = this.variablesMap[dataset.variable.name];
        if (
          dimension.required ||
          (variable.required_dimensions || []).includes(dimension)
        )
          return true;
        if (
          ["daily", "monthly"].includes(dataset.time_unit) &&
          dimension.name === "calendar_day"
        )
          return true;
        if (
          ["annual", "decadal"].includes(dataset.time_unit) &&
          dimension.name === "calendar_year"
        )
          return true;
      }
      return false;
    });
  }
}

export async function getStructure() {
  const datasetsData = getApiNdJson("datasets.ndjson");
  const staticData = ["dimensions", "variables", "grids", "legends"].map(
    (endpoint) => getApiJson(`${endpoint}.json`)
  );
  return new Structure(
    ...((await Promise.all([datasetsData, ...staticData])) as [
      object,
      object,
      object,
      object,
      object,
    ])
  );
}
