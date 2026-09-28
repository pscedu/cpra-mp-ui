import { CatalogQuery } from "./catalog";
import { dataBaseUrl, staticTilesBaseUrl } from "./config";
import { QueryOptions } from "./query";
import { formatGeography } from "./selection";
import { Coordinate, Geography } from "./types";
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
  // `unit` describes the values as stored; the display_* fields describe how they are
  // shown, which differs when a variable is stored in a finer unit than it is read in
  // (elev: stored as int32 millimeters, shown as meters). `display_scale_factor` is the
  // divisor taking a stored value to a displayed one. The API already applies all three to
  // everything it renders (chart specs, map legends), so these are only for a client that
  // formats raw dataset values itself.
  unit: string | null;
  display_unit: string | null;
  display_scale_factor: number | null;
  display_number_format: string | null;
  // Decimal places the API has already rounded this variable's values to in a CSV
  // response, reported so a client can tell a rounded download from a full-precision one.
  // Nothing to apply: the other formats carry the stored value, and formatting a value for
  // display is `display_number_format`'s job.
  float_precision: number | null;
  legend: Legend | null;
  geographic_units: string[];
  time_units: string[];
  required_dimensions: Dimension<any>[];
  difference_legend_limit: string | null;
  structure: Structure;

  constructor(
    {
      name,
      label,
      dtype,
      model,
      subroutine,
      unit,
      display_unit,
      display_scale_factor,
      display_number_format,
      float_precision,
      legend,
      geographic_units,
      time_units,
      required_dimensions,
      difference_legend_limit,
    },
    structure: Structure,
  ) {
    this.name = name;
    this.label = label;
    this.dtype = dtype;
    this.model = model;
    this.subroutine = subroutine;
    this.unit = unit;
    this.display_unit = display_unit;
    this.display_scale_factor = display_scale_factor;
    this.display_number_format = display_number_format;
    this.float_precision = float_precision;
    this.legend = legend;
    this.geographic_units = geographic_units;
    this.time_units = time_units;
    this.required_dimensions = required_dimensions;
    this.difference_legend_limit = difference_legend_limit;
    this.structure = structure;
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

  // The crosswalk URL that resolves coordinates to the geographies of this grid
  // containing them, each reported as a `dst_id` alongside the `src_lng`/`src_lat`
  // of the coordinate it answers for.
  getGeographyUrl(coordinates: Coordinate[]) {
    // Converted from `wgs84`, the source grid standing for the coordinates
    // themselves, so that every coordinate gets a row of its own and gets it from
    // the same polygons the data API selects data with.
    const params: [string, string][] = [
      ["grid_cell", coordinates.flat().join(",")],
      ["to_grid", this.name],
    ];
    return `${dataBaseUrl}/grids/wgs84/crosswalk.ndjson${makeQueryString(params)}`;
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
    return `${dataBaseUrl}/datasets/${this.variable.name}/${this.time_unit}/${this.grid.name}`;
  }

  // `analysisName` routes through the named-analysis data endpoint
  // (`/analyses/{name}/data.{format}`) instead of the plain data endpoint,
  // mirroring the dataset-scoped visualization route.
  getDataUrl(
    params: [string, any][],
    format: string,
    analysisName: string | null = null,
  ) {
    const basePath = analysisName
      ? `${this.getBaseUrl()}/analyses/${analysisName}/data`
      : `${this.getBaseUrl()}/data`;
    return `${basePath}.${format}${makeQueryString(params)}`;
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
}

export class Visualization {
  name: string;
  label: string;
  type: string;
  max_grid_cells: number;
  variables: string[] | null;

  constructor({
    name,
    label,
    type,
    max_grid_cells,
    variables,
  }: {
    name: string;
    label: string;
    type: string;
    max_grid_cells: number;
    variables: string[] | null;
  }) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.max_grid_cells = max_grid_cells;
    this.variables = variables;
  }

  getSpecUrl(
    catalogQuery: CatalogQuery,
    options: QueryOptions,
    specParams: [string, any][] = [],
  ) {
    // A visualization-spec request is always query-param-based (never a
    // path-based analysis route -- see `Dataset.getDataUrl`'s separate
    // path-segment mechanism for that), so the chain name belongs here as a
    // flat `analysis=` key rather than in `getQueryParams`.
    const chainName = catalogQuery.getAnalysisChainName(
      options.derivedAnalysis,
      options.analysis,
    );
    const params = [
      ...catalogQuery.getQueryParams({
        ...options,
        includeTimeDimension: !options.geographies,
        maxGridCells: this.max_grid_cells,
      }),
      ...(chainName ? ([["analysis", chainName]] as [string, any][]) : []),
      ...specParams,
    ];

    const baseUrl =
      this.type === "dataset"
        ? `${catalogQuery.dataset.getBaseUrl()}/visualization`
        : `${dataBaseUrl}/visualizations`;
    return `${baseUrl}/${this.name}.json${makeQueryString(params)}`;
  }
}

export class Analysis {
  name: string;
  label: string;
  type: string;
  variables: string[] | null;
  // "variable" (a derived variable, selected from the Variable dropdown, e.g.
  // `lnd_conf`) or "dimension" (a chainable operation applied on
  // top of whatever's selected, e.g. `diff`); `null` for an analysis
  // this portal doesn't surface as either (e.g. `sal_veg_investigation`).
  kind: string | null;
  // Dimensions this analysis already collapses/fixes, so a picker offering
  // dimensions to filter or difference over should not offer these.
  subsumed_dimensions: string[];

  constructor({
    name,
    label,
    type,
    variables,
    kind = null,
    subsumed_dimensions = [],
  }: {
    name: string;
    label: string;
    type: string;
    variables: string[] | null;
    kind?: string | null;
    subsumed_dimensions?: string[];
  }) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.variables = variables;
    this.kind = kind;
    this.subsumed_dimensions = subsumed_dimensions;
  }

  // Whether this analysis is meaningful for the given variable, per its
  // catalog `variables` restriction (`null` means it applies to any
  // variable).
  appliesTo(variableName: string): boolean {
    return this.variables === null || this.variables.includes(variableName);
  }
}

// A `kind === "variable"` analysis has no dataset of its own to key its
// options off of when `variables` is `null` -- its inputs are fixed
// server-side (e.g. `lnd_type_plus`'s three-input join across two grids), so
// there's no single variable/grid/time_unit that "matching the request"
// would mean. Cataloging it in the Variable dropdown still needs one to
// stand in for, hardcoded here since nothing in the catalog says which.
const CANONICAL_DERIVED_DATASETS: {
  [analysisName: string]: { variable: string; grid: string; time_unit: string };
} = {
  lnd_type_plus: {
    variable: "stg",
    grid: "hydro_compartment_v002",
    time_unit: "annual",
  },
};

// Pairs a `kind === "variable"` analysis with one of the real datasets it
// applies to, so it can be offered in the Variable dropdown alongside plain
// datasets (§4.1).
export class DerivedDataset {
  analysis: Analysis;
  dataset: Dataset;

  constructor(analysis: Analysis, dataset: Dataset) {
    this.analysis = analysis;
    this.dataset = dataset;
  }

  get name() {
    return this.analysis.name;
  }

  get label() {
    return this.analysis.label;
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
  visualizations: Visualization[];
  visualizationsMap: { [key: string]: Visualization };
  analyses: Analysis[];
  analysesMap: { [key: string]: Analysis };
  derivedDatasets: DerivedDataset[];
  derivedDatasetsMap: { [key: string]: DerivedDataset };

  constructor(
    datasets,
    dimensions,
    variables,
    grids,
    legends,
    visualizations,
    analyses,
  ) {
    this.dimensions = dimensions.map((dimension) => new Dimension(dimension));
    this.dimensionsMap = makeMap(this.dimensions);

    this.grids = grids.map((grid) => new Grid(grid));
    this.gridsMap = makeMap(this.grids);

    this.legends = legends.map((legend) => new Legend(legend));
    this.legendsMap = makeMap(this.legends);

    this.visualizations = visualizations.map(
      (visualization) => new Visualization(visualization),
    );
    this.visualizationsMap = makeMap(this.visualizations);

    this.analyses = analyses.map((analysis) => new Analysis(analysis));
    this.analysesMap = makeMap(this.analyses);

    this.variables = variables.map(
      (variable) =>
        new Variable(
          {
            ...variable,
            legend: variable.legend
              ? this.legendsMap[variable.legend]
              : this.legendsMap.default,
            required_dimensions: variable.required_dimensions
              ? variable.required_dimensions.map(
                  (dimensionName) => this.dimensionsMap[dimensionName],
                )
              : [],
          },
          this,
        ),
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

    this.derivedDatasets = this.analyses
      .filter((analysis) => analysis.kind === "variable")
      .flatMap((analysis) => {
        if (analysis.variables === null) {
          const canonical = CANONICAL_DERIVED_DATASETS[analysis.name];
          const dataset = canonical
            ? this.datasets.find(
                (ds) =>
                  ds.variable.name === canonical.variable &&
                  ds.grid.name === canonical.grid &&
                  ds.time_unit === canonical.time_unit,
              )
            : null;
          return dataset ? [new DerivedDataset(analysis, dataset)] : [];
        }
        return this.datasets
          .filter((ds) => analysis.appliesTo(ds.variable.name))
          .map((ds) => new DerivedDataset(analysis, ds));
      });
    this.derivedDatasetsMap = makeMap(this.derivedDatasets);
  }

  // Dimensions a selected derived variable already subsumes and so should
  // neither be offered for selection nor sent as a filter (§4.4). `null`
  // when no derived variable is selected.
  subsumedFor(analysisName: string | null): string[] {
    return analysisName
      ? (this.derivedDatasetsMap[analysisName]?.analysis.subsumed_dimensions ??
          [])
      : [];
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

  getDataLabel(catalogQuery: CatalogQuery, selectedGeographies?: Geography[]) {
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
      subtitle.push(
        `${dataset.grid.label} ${selectedGeographies.map(formatGeography).join(", ")}`,
      );
    return `${title.join(" ")}: ${subtitle.join(", ")}`;
  }
}

export async function getStructure() {
  const datasetsData = getNdJson(`${dataBaseUrl}/datasets.ndjson`);
  const staticData = [
    "dimensions",
    "variables",
    "grids",
    "legends",
    "visualizations",
    "analyses",
  ].map((endpoint) => getJson(`${dataBaseUrl}/${endpoint}.json`));
  return new Structure(
    ...((await Promise.all([datasetsData, ...staticData])) as [
      object,
      object,
      object,
      object,
      object,
      object,
      object,
    ]),
  );
}
