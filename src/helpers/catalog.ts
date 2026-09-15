import { dataBaseUrl } from "./config";
import { QueryOptions } from "./query";
import { Dataset, Dimension, Structure } from "./structure";
import { Analysis, Geography } from "./types";
import {
  camelToSnake,
  extractCatalogObject,
  getFilterParams,
  getJson,
  makeQueryString,
  mergeOr,
  sortConsistent,
} from "./utils";

// Every registered analysis compares exactly two values of its `dimension`
// ("difference" subtracts one from the other; "concatenate" puts one beside
// the other), so a selection with any other number of values has nothing for
// it to operate on and the API rejects it outright. The reader can leave the
// menu on "Subtract A - B" while narrowing the dimension back down to one
// value, which is a perfectly reasonable thing to do and used to produce a
// 400 -- so the number of selected values, not the menu alone, decides
// whether the analysis is actually sent.
const ANALYSIS_DIMENSION_VALUE_COUNT = 2;

export class CatalogQuery {
  dataset: Dataset;
  filters: any;
  structure: Structure;
  requestPath: string;
  response: any;

  constructor(dataset: Dataset, filters: any, structure: Structure) {
    this.dataset = dataset;
    this.filters = filters;
    this.structure = structure;
    this.requestPath = this.getRequestPath();
    this.response = null;
  }

  async execute() {
    this.response = await getJson(this.requestPath);
    // Sort the filters so that the order of the requested filters is preserved if possible.
    for (const key of Object.keys(this.response.results))
      sortConsistent(this.response.results[key], this.filters[key]);
  }

  equals(other: CatalogQuery) {
    return this.requestPath === other.requestPath;
  }

  // The values currently selected for an analysis's own dimension, deduplicated
  // the way the API counts them (it compares DISTINCT values, so a repeated one
  // must not look like a second).
  getAnalysisDimensionValues(analysis?: Analysis | null): unknown[] {
    if (!analysis?.dimension) return [];
    return [...new Set(this.response?.results?.[analysis.dimension] || [])];
  }

  // `analysis` when the selection can actually support it, else null. Returns
  // the analysis rather than a boolean so callers keep TypeScript's narrowing
  // of its nullable fields. Everything that names an analysis to the API goes
  // through here, so the query parameters and the data-download ROUTE
  // (`/analyses/{name}/data.csv`, via `getAnalysisName`) can never disagree
  // about whether one is in play -- picking the route while dropping the
  // parameters is its own 400.
  getApplicableAnalysis(analysis?: Analysis | null): Analysis | null {
    if (!analysis?.dimension) return null;
    return this.getAnalysisDimensionValues(analysis).length ===
      ANALYSIS_DIMENSION_VALUE_COUNT
      ? analysis
      : null;
  }

  // The name of the registered analysis to request, or null when the selection
  // can't support one -- including when `analysis` is "single"/"compare", which
  // is client-side view state with no `dimension` and is never sent to the API.
  getAnalysisName(analysis?: Analysis | null): string | null {
    return this.getApplicableAnalysis(analysis)?.operation ?? null;
  }

  getRequestPath() {
    const { variable, grid, time_unit } = this.dataset;
    const requiredDimensions = this.structure.getRequiredDimensions([
      this.dataset,
    ]);

    const qs = makeQueryString(
      getFilterParams(requiredDimensions, this.filters),
    );
    return `${dataBaseUrl}/datasets/${variable.name}/${time_unit}/${grid.name}/catalog.json${qs}`;
  }

  getQueryParams(
    {
      analysis,
      geographies,
      includeTimeDimension,
      maxGridCells,
      maxValues,
    }: QueryOptions = {
      analysis: null,
      geographies: null,
      includeTimeDimension: true,
      maxGridCells: null,
      maxValues: null,
    },
  ): [string, any][] {
    const requiredDimensions = this.structure.getRequiredDimensions([
      this.dataset,
    ]);

    // TODO: Select the filters based on user input. For now, we select the first
    // value for each dimension.
    const selectedFilters: Record<string, unknown[]> = {};
    for (const dimension of requiredDimensions)
      if (dimension.filterType !== "time" || includeTimeDimension)
        selectedFilters[dimension.name] = this.response.results[dimension.name];

    // An analysis the selection can't support is not sent at all, and its
    // dimension falls back to a single value -- the plain unanalyzed
    // visualization of the first thing the reader selected, which is the
    // sensible view of a comparison with nothing to compare against. The
    // fallback has to be explicit rather than left to `maxValues` below:
    // `getSpecUrl` passes no `maxValues`, so nothing would otherwise narrow a
    // three-value selection down, and the request would 400 just the same.
    const appliedAnalysis = this.getApplicableAnalysis(analysis);
    if (analysis?.dimension && !appliedAnalysis)
      selectedFilters[analysis.dimension] = this.getAnalysisDimensionValues(
        analysis,
      ).slice(0, 1);

    const modelGroupValues = selectedFilters.model_group_id || [];
    // Dimensions whose selected values must survive `maxValues` truncation:
    // the analysis's own dimension, and (for a three-image concatenate)
    // `model_group_id`, since the API derives two-image vs. three-image from
    // how many `model_group_id` values are in the request's filters.
    const analysisDimensions = [];
    if (appliedAnalysis?.dimension)
      analysisDimensions.push(appliedAnalysis.dimension);
    if (
      appliedAnalysis?.operation === "concatenate" &&
      modelGroupValues.length === 2
    )
      analysisDimensions.push("model_group_id");

    const params = getFilterParams(
      requiredDimensions,
      selectedFilters,
      maxValues,
      analysisDimensions,
    );

    // Named analyses are otherwise resolved and validated server-side; the UI
    // only names the analysis and forwards its parameters.
    if (appliedAnalysis?.dimension) {
      params.push(["analysis", appliedAnalysis.operation]);
      params.push(["dimension", appliedAnalysis.dimension]);
      if (appliedAnalysis.operation === "difference" && appliedAnalysis.order)
        params.push(["order", appliedAnalysis.order]);
    }

    if (geographies)
      params.push([
        "grid_cell",
        maxGridCells ? geographies.slice(0, maxGridCells) : geographies,
      ]);

    return params;
  }

  getTimeIncrement() {
    return {
      annual: "Year",
      daily: "Day",
      decadal: "Decade",
      month: "Month",
    }[this.dataset.time_unit];
  }

  getDataDownloadUrl({
    analysis,
    format,
    geographies,
    includeTimeDimension,
  }: {
    analysis: Analysis;
    format: string;
    geographies?: Geography[] | null;
    includeTimeDimension?: boolean;
  }) {
    return this.dataset.getDataUrl(
      this.getQueryParams({
        analysis,
        geographies,
        includeTimeDimension,
      }),
      format,
      this.getAnalysisName(analysis),
    );
  }

  getMapStyleUrl({
    analysis,
    mapOptions,
    extraParams = [],
  }: {
    analysis: Analysis;
    mapOptions: Record<string, any>;
    extraParams?: [string, any][];
  }) {
    return this.structure.visualizationsMap["map"].getSpecUrl(
      this,
      {
        analysis,
        includeTimeDimension: true,
      },
      [
        ...Object.keys(mapOptions).map((key): [string, any] => [
          camelToSnake(key),
          mapOptions[key],
        ]),
        ...extraParams,
      ],
    );
  }

  getModelGroup() {
    return (this?.response.results?.model_group_id || [-1])[0];
  }

  getVisualizationUrl({ visualizationType, selectedGeographies, analysis }) {
    return visualizationType &&
      selectedGeographies &&
      selectedGeographies.length
      ? this.structure.visualizationsMap[visualizationType].getSpecUrl(this, {
          analysis: analysis.dimension?.startsWith("calendar_")
            ? null
            : analysis,
          geographies: selectedGeographies,
        })
      : null;
  }

  getYear() {
    const results = this.response?.results;
    const days = results?.calendar_day;
    if (days) return parseInt(days[0].substr(0, 4));
    const years = results?.calendar_year;
    if (years) return years[0];
    return 0;
  }
}

export class CatalogQueries {
  datasets: Dataset[];
  filters: any;
  structure: Structure;
  queries: CatalogQuery[];

  combinedFilters: any;
  combinedChoices: any;
  activeDimensions: Dimension[];

  constructor(datasets: Dataset[], filters: any, structure: Structure) {
    this.datasets = datasets;
    this.filters = filters;
    this.reconcileFilters();
    this.structure = structure;
    this.queries = datasets.map(
      (dataset) => new CatalogQuery(dataset, this.filters, structure),
    );
    this.combinedFilters = null;
    this.combinedChoices = null;
    this.activeDimensions = [];
  }

  equals(other: CatalogQueries) {
    return (
      this.queries.length === other.queries.length &&
      this.queries.every((query, i) => query.equals(other.queries[i]))
    );
  }

  async executeAll() {
    await Promise.all(this.queries.map((query) => query.execute()));
    const filterDimensionNames = this.structure.dimensions
      .filter((dim) => dim.isFilter)
      .map((dim) => dim.name);

    this.combinedFilters = mergeOr(
      this.queries.map(({ dataset, response }) =>
        extractCatalogObject(response.results, dataset),
      ),
      filterDimensionNames,
    );

    // Sort the combined filters so that the order of the requested filters is preserved if possible.
    for (let key of Object.keys(this.combinedFilters))
      sortConsistent(this.combinedFilters[key], this.filters[key]);

    this.combinedChoices = mergeOr(
      this.queries.map(({ dataset, response }) =>
        extractCatalogObject(response.choices, dataset),
      ),
      filterDimensionNames,
    );

    this.activeDimensions = this.structure.dimensions.filter(
      (dim) => dim.name in this.combinedChoices,
    );
  }

  getMapCatalogQuery() {
    return this.queries[0];
  }

  getTimeDimension() {
    return this.activeDimensions.filter((dim) => dim.filterType === "time")[0];
  }

  getTimeChoices() {
    const timeDimension = this.getTimeDimension();
    return this.combinedChoices[timeDimension.name];
  }

  reconcileFilters() {
    // Handle changing from daily/monthly datasets to annual/decadal datasets
    // and vice-versa.
    const filters = this.filters;
    const timeColumn = this.datasets[0].getTimeColumn();
    const timeUnit = this.datasets[0].time_unit;
    const newFilters = { ...filters };
    if (
      "calendar_day" in filters &&
      !("calendar_year" in filters) &&
      timeColumn === "calendar_year"
    ) {
      newFilters["calendar_year"] = filters["calendar_day"].map(
        (dateStr: string) => {
          let year = parseInt(dateStr.substr(0, 4));
          if (timeUnit === "decadal") year = Math.round(year / 10) * 10;
          return year;
        },
      );
      delete newFilters["calendar_day"];
      this.filters = newFilters;
    } else if (
      "calendar_year" in filters &&
      !("calendar_day" in filters) &&
      timeColumn === "calendar_day"
    ) {
      newFilters["calendar_day"] = filters["calendar_year"].map(
        (year: number) => `${year}-01-01`,
      );
      delete newFilters["calendar_year"];
      this.filters = newFilters;
    }
  }
}
