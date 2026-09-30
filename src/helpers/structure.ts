import { CatalogQuery } from "./catalog";
import { dataBaseUrl } from "./config";
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
  // Whether this visualization plots the time dimension as an axis, and so cannot present
  // an analysis that collapses it (`api.models.Visualization`). True for every chart,
  // false for the map alone. `Structure.collapsesTime` is the other half of the pair --
  // together they are what keeps a chart from being offered, or requested, for an
  // analysis with no year column left to plot against. The server rejects the
  // combination outright (`DatasetVisualization.validate_time_axis` -> 400); this is
  // what stops the portal asking.
  time_axis: boolean;

  constructor({
    name,
    label,
    type,
    max_grid_cells,
    variables,
    time_axis,
  }: {
    name: string;
    label: string;
    type: string;
    max_grid_cells: number;
    variables: string[] | null;
    time_axis: boolean;
  }) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.max_grid_cells = max_grid_cells;
    this.variables = variables;
    this.time_axis = time_axis;
  }

  getSpecUrl(
    catalogQuery: CatalogQuery,
    options: QueryOptions,
    specParams: [string, any][] = [],
  ) {
    // Everything the request names -- the dataset it reads, the analysis chain
    // applied to it, the filters -- is a query parameter; the path carries only
    // the visualization's own name. `getDatasetParams` decides whether the
    // dataset triple belongs in the request at all.
    const chainName = catalogQuery.getAnalysisChainName(
      options.derivedAnalysis,
      options.analysis,
    );
    const params = [
      ...catalogQuery.getDatasetParams(),
      ...catalogQuery.getQueryParams({
        ...options,
        includeTimeDimension: !options.geographies,
        maxGridCells: this.max_grid_cells,
      }),
      ...(chainName ? ([["analysis", chainName]] as [string, any][]) : []),
      ...specParams,
    ];

    return `${dataBaseUrl}/visualizations/${this.name}.json${makeQueryString(params)}`;
  }
}

// What a request PRODUCES, as the API reports it -- `api/models.py`'s
// `CatalogOutput`. It arrives in two places, computed by one function server-side
// (`api/catalog.py::output_body`): on every `/v1/catalog.json` response, for the
// request that was actually sent, and on an `/v1/analyses.json` entry whose
// analysis fixes its own inputs, where it is a fact about the analysis and needs
// no request at all. Only the fields the portal reads are declared.
export type CatalogOutput = {
  grid: string;
  grid_type: string;
  time_unit: string;
  label: string | null;
  legend: string | null;
  result_kind: string;
  collapsed_dimensions: string[];
};

export class Analysis {
  name: string;
  label: string;
  variables: string[] | null;
  // What this analysis produces, for one that fixes its own inputs; `null` for
  // one that reads the caller's dataset, whose output depends on a dataset
  // nobody has named yet. See `Structure.fixesOwnInputs` and the
  // `DerivedDataset` built from this in `Structure`'s constructor.
  output: CatalogOutput | null;
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
    variables,
    kind = null,
    subsumed_dimensions = [],
    output = null,
  }: {
    name: string;
    label: string;
    variables: string[] | null;
    kind?: string | null;
    subsumed_dimensions?: string[];
    output?: CatalogOutput | null;
  }) {
    this.name = name;
    this.label = label;
    this.variables = variables;
    this.kind = kind;
    this.subsumed_dimensions = subsumed_dimensions;
    this.output = output;
  }

  // Whether this analysis is meaningful for the given variable, per its
  // catalog `variables` restriction (`null` means it applies to any
  // variable).
  appliesTo(variableName: string): boolean {
    return this.variables === null || this.variables.includes(variableName);
  }
}

// Pairs a `kind === "variable"` analysis with the dataset it is offered under
// in the Variable dropdown (§4.1) -- one of the real datasets it applies to,
// or, for an analysis that fixes its own inputs, the synthetic one
// `Structure.outputDataset` builds from what the API says it produces.
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
        // Same field `fixesOwnInputs` keys on, and for the same reason: an entry
        // carrying an `output` is one the server resolved with no dataset at
        // all, so there is no caller-chosen dataset to pair it with -- its own
        // result is the dataset. Everything else is offered once per real
        // dataset it applies to.
        if (analysis.output) {
          const dataset = this.outputDataset(analysis);
          return dataset ? [new DerivedDataset(analysis, dataset)] : [];
        }
        return this.datasets
          .filter((ds) => analysis.appliesTo(ds.variable.name))
          .map((ds) => new DerivedDataset(analysis, ds));
      });
    this.derivedDatasetsMap = makeMap(this.derivedDatasets);
  }

  // The dataset an input-fixing analysis is offered under, built from what the
  // API says it PRODUCES (`/v1/analyses.json`'s `output`). `null` if the entry
  // carries no output or names a grid this structure doesn't know, which is an
  // analysis the dropdown then simply doesn't list.
  //
  // This replaces a hardcoded table (`CANONICAL_DERIVED_DATASETS`) that named
  // one of the analysis's INPUTS as a stand-in, because nothing in the catalog
  // said what it output. Picking an input was never safe and the table carried a
  // long comment saying so: of `lnd_type_plus`'s three, `stg` is on a VECTOR
  // grid, so the map would have asked for polygon tiles of a raster result, and
  // `elev` is stored in millimetres, whose display scale factor would have
  // divided every legend break by 1000. Only `lnd_type` happened to agree with
  // the output, and only by hand.
  //
  // The variable is synthetic and deliberately so: the output of such an
  // analysis is not any registered variable (the server reports `variables:
  // [null]` for its one value column), and the presentation facts a `Variable`
  // exists to carry -- the label and the legend -- are the analysis's OWN, which
  // is exactly what `output` resolved them to. The display_*/unit fields stay
  // null because there is no stored unit to convert from; anything the API
  // renders itself (legend breaks, chart axes) already has them applied.
  outputDataset(analysis: Analysis): Dataset | null {
    const output = analysis.output;
    const grid = output && this.gridsMap[output.grid];
    if (!output || !grid) return null;
    return new Dataset({
      variable: new Variable(
        {
          name: analysis.name,
          label: output.label ?? analysis.label,
          dtype: null,
          model: null,
          subroutine: null,
          unit: null,
          display_unit: null,
          display_scale_factor: null,
          display_number_format: null,
          float_precision: null,
          legend: output.legend ? this.legendsMap[output.legend] : null,
          geographic_units: [grid.name],
          time_units: [output.time_unit],
          // None of its own: what a caller may still steer is the union its
          // inputs require, which is what `getRequiredDimensions` derives from
          // the globally-required dimensions and the output's time unit. A
          // dimension the analysis has already fixed is reported separately, as
          // `subsumed_dimensions`.
          required_dimensions: [],
          difference_legend_limit: null,
        },
        this,
      ),
      grid,
      time_unit: output.time_unit,
    });
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

  // Whether the named analysis supplies its OWN inputs rather than reading the
  // caller's dataset (e.g. `lnd_type_plus`, whose three inputs are fixed
  // server-side across two grids). A request naming such an analysis must NOT
  // carry a variable/time_unit/grid triple: `api/unified.py::_dataset_ref` 400s
  // on one it has no use for. Every URL builder asks through
  // `CatalogQuery.getDatasetParams` rather than repeating the predicate.
  //
  // `output != null` is not a proxy for the question -- it IS the answer, and
  // the server's own. `/v1/analyses.json` fills that field by resolving the
  // analysis with no dataset, no selection and no parameters and reporting what
  // came out, so an entry has one exactly when the resolve did not object to
  // being handed nothing. Reading `kind`/`variables` instead would be the
  // portal re-deriving from two fields what one field already states.
  fixesOwnInputs(analysisName: string | null | undefined): boolean {
    if (!analysisName) return false;
    return this.analysesMap[analysisName]?.output != null;
  }

  // Whether the named derived analysis folds the TIME dimension away, leaving a
  // result with no time column to plot against -- a chart with a time axis would
  // have nothing to draw, and the server rejects the pair outright
  // (`DatasetVisualization.validate_time_axis` -> 400). `Visualization.time_axis`
  // is the other half -- see `VisualizationSelect`, which stops offering the
  // chart, and `getVisualizationUrl`, which stops requesting it for an old
  // permalink that names one anyway.
  //
  // Built on `subsumedFor` and the dimension's own `filterType` rather than on a
  // list of analysis names, because subsumption means two different things by
  // filterType and only the `time` one collapses an axis (see `getQueryParams`):
  // `lnd_conf` subsumes `scenario_id`, a `select` dimension, and charts fine.
  // That is also why this returns false for every analysis shipping today --
  // `lnd_chng` was the one time case and now keeps its year column, comparing each
  // selected year against a derived baseline. The question is asked of the catalog
  // rather than of a name here, so the next one needs no change on this side.
  collapsesTime(analysisName: string | null | undefined): boolean {
    const subsumed = this.subsumedFor(analysisName ?? null);
    return this.dimensions.some(
      (dimension) =>
        dimension.filterType === "time" && subsumed.includes(dimension.name),
    );
  }

  // The charts a reader may pick for this selection -- `VisualizationSelect`'s
  // whole answer, lifted out of the component so it has exactly one definition.
  // `probe.ts` asks the same question to decide which spec URLs to fetch, and a
  // copy of the predicate there would drift from the component the moment either
  // moved, which is the failure `probe.ts`'s own header warns about.
  //
  // Three exclusions, each from a different source: `map` is not this control's
  // to pick (the map is always drawn, and is chosen by `MapSelect`); a chart that
  // plots time cannot present an analysis that folds the axis away
  // (`collapsesTime` above); and a chart declaring `variables` draws only those
  // (`species-stacked-bar` breaks down `veg_species` and 400s on anything else,
  // which `SpeciesStackedBar.validate` enforces server-side).
  //
  // `variable` is undefined for an analysis that folds several variables into one
  // result and so has no single presentation variable -- such a selection is
  // offered only the charts that name no `variables` at all.
  offeredVisualizations(
    analysisName: string | null | undefined,
    variable: string | undefined,
  ): Visualization[] {
    const collapsesTime = this.collapsesTime(analysisName);
    return this.visualizations.filter(
      (visualization) =>
        visualization.name !== "map" &&
        !(visualization.time_axis && collapsesTime) &&
        (visualization.variables === null ||
          (variable !== undefined && visualization.variables.includes(variable))),
    );
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
        // `dataset.variable` directly, not `variablesMap[...]`: a `Dataset` is
        // built holding the mapped `Variable` instance, so the lookup only ever
        // returned what it was handed -- and it returned `undefined` for the
        // synthetic variable an input-fixing analysis's dataset carries
        // (`outputDataset`), which is not in the map and has no reason to be.
        if (
          dimension.required ||
          (dataset.variable.required_dimensions || []).includes(dimension)
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
