import { CatalogQuery } from "./catalog";
import { dataBaseUrl, staticTilesBaseUrl } from "./config";
import {
  getJson,
  getNdJson,
  makeMap,
  makeQueryString,
  toTitleCase,
} from "./utils";

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
  isFilter: boolean;
  filterType: "select" | "time" | null;

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
    this.isFilter = !["dataset", "metadata"].includes(type);
    this.filterType = this.isFilter
      ? name.startsWith("calendar_")
        ? "time"
        : "select"
      : null;
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
  label: string;
  grid_type: string;
  crs: string;
  geographies: number | null;
  bounds: number | null;
  height: number | null;
  width: number | null;

  constructor({
    name,
    label,
    grid_type,
    crs,
    geographies,
    bounds,
    height,
    width,
  }) {
    this.name = name;
    this.label = label;
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
    return `${dataBaseUrl}/datasets/${this.variable.name}/${this.grid.name}/${this.time_unit}`;
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

  getTimeColumn() {
    return ["annual", "decadal"].includes(this.time_unit)
      ? "calendar_year"
      : "calendar_day";
  }

  getVisualizationUrl(params: [string, any][], visualizationType: string) {
    return `${this.getBaseUrl()}/visualization/${visualizationType}.json${makeQueryString(
      params,
    )}`;
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
          legend: variable.legend
            ? this.legendsMap[variable.legend]
            : this.legendsMap.default,
          required_dimensions: variable.required_dimensions
            ? variable.required_dimensions.map(
                (dimensionName) => this.dimensionsMap[dimensionName],
              )
            : [],
        }),
    );
    this.variablesMap = makeMap(this.variables);
    this.datasets = datasets
      .map((dataset) => {
        const variable = this.variablesMap[dataset.variable];
        const grid = this.gridsMap[dataset.grid];
        if (!variable)
          return console.warn(
            `Ignoring dataset with invalid variable: ${dataset.variable}`,
          );

        if (!grid)
          return console.warn(
            `Ignoring dataset with invalid grid: ${dataset.grid}`,
          );

        return new Dataset({
          variable,
          grid,
          time_unit: dataset.time_unit,
        });
      })
      .filter((dataset) => dataset !== undefined)
      .sort((a, b) => (a.variable.label < b.variable.label ? -1 : 1));
  }

  getRequiredDimensions(
    datasets: Dataset[],
    includeDataset = false,
    includeMetadata = false,
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

  getDataLabel(catalogQuery: CatalogQuery, selectedGeographies?: number[]) {
    const { dataset, response } = catalogQuery;
    const { results } = response;
    const title: string[] = [toTitleCase(dataset.time_unit)];
    const subtitle: string[] = [];
    for (const dimension of this.getRequiredDimensions([dataset])) {
      const valueLabel: string = (
        dimension.values
          ? results[dimension.name].map(
              (value) =>
                dimension.values.find((dv) => dv.value == value)?.label,
            )
          : results[dimension.name]
      ).join(", ");
      if (dimension.name == "aggregate_type") title.push(valueLabel);
      else subtitle.push(`${dimension.label} ${valueLabel}`);
    }
    title.push(dataset.variable.label);
    if (selectedGeographies && selectedGeographies.length > 0)
      subtitle.push(`${dataset.grid.label} ${selectedGeographies.join(", ")}`);
    return `${title.join(" ")}: ${subtitle.join(", ")}`;
  }
}

export async function getStructure() {
  const datasetsData = getNdJson(`${dataBaseUrl}/datasets.ndjson`);
  const staticData = ["dimensions", "variables", "grids", "legends"].map(
    (endpoint) => getJson(`${dataBaseUrl}/${endpoint}.json`),
  );
  return new Structure(
    ...((await Promise.all([datasetsData, ...staticData])) as [
      object,
      object,
      object,
      object,
      object,
    ]),
  );
}
