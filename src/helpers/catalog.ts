import { dataBaseUrl } from "./config";
import { QueryOptions } from "./query";
import { Dataset, Dimension, Structure } from "./structure";
import { Analysis } from "./types";
import {
  camelToSnake,
  extractCatalogObject,
  getFilterParams,
  getJson,
  makeQueryString,
  mergeOr,
  sortConsistent,
  sqlValue,
} from "./utils";

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

  getRequestPath() {
    const { variable, grid, time_unit } = this.dataset;
    const requiredDimensions = this.structure.getRequiredDimensions([
      this.dataset,
    ]);

    const qs = makeQueryString(
      getFilterParams(requiredDimensions, this.filters),
    );
    return `${dataBaseUrl}/datasets/${variable.name}/${grid.name}/${time_unit}/catalog.json${qs}`;
  }

  getQueryParams(
    {
      analysis,
      geographies,
      includeTimeDimension,
      maxGeographies,
      maxValues,
      unpivot,
    }: QueryOptions = {
      analysis: null,
      geographies: null,
      includeTimeDimension: true,
      maxGeographies: null,
      maxValues: null,
      unpivot: false,
    },
  ): [string, any][] {
    const requiredDimensions = this.structure.getRequiredDimensions([
      this.dataset,
    ]);

    // TODO: Select the filters based on user input. For now, we select the first
    // value for each dimension.
    const selectedFilters = {};
    for (const dimension of requiredDimensions)
      if (dimension.filterType !== "time" || includeTimeDimension)
        selectedFilters[dimension.name] = this.response.results[dimension.name];

    const modelGroupValues = selectedFilters.model_group_id || [];
    const analysisDimensions = [];
    if (analysis?.dimension) analysisDimensions.push(analysis.dimension);
    if (analysis?.operation === "concatenate" && modelGroupValues.length === 2)
      analysisDimensions.push("model_group_id");

    const params = getFilterParams(
      requiredDimensions,
      selectedFilters,
      maxValues,
      analysisDimensions,
    );

    if (analysis) {
      const { operation, dimension } = analysis;
      if (dimension) {
        let groupByNames = requiredDimensions
          .map(({ name }) => name)
          .filter((name) => name !== dimension);
        const values = [...this.response.results[dimension]];
        values.sort((a, b) => (a < b ? -1 : 1));
        if (operation.startsWith("subtract-")) {
          if (values && values.length === 2) {
            const negateValue = values[operation.endsWith("asc") ? 1 : 0];
            params.push([
              "negate",
              `${dimension}=${sqlValue(negateValue, dimension)}`,
            ]);
            params.push(["group_by", groupByNames]);
            params.push(["group_aggregate", "sum"]);
          }
        } else if (operation === "concatenate") {
          const timeValues = values;
          modelGroupValues.sort();
          const threeImage = modelGroupValues.length === 2;
          params.push([
            threeImage ? "multiply100" : "multiply10",
            `${dimension}=${sqlValue(timeValues[0], dimension)}`,
          ]);
          if (threeImage) {
            params.push([
              "multiply10",
              `model_group_id=${sqlValue(modelGroupValues[0])} and ${dimension}=${sqlValue(timeValues[1], dimension)}`,
            ]);
            params.push([
              "where",
              `not (model_group_id=${sqlValue(modelGroupValues[1])} and ${dimension}=${sqlValue(timeValues[0], dimension)})`,
            ]);
            groupByNames = groupByNames.filter(
              (name) => name !== "model_group_id",
            );
          }
          params.push(["group_by", groupByNames]);
          params.push(["group_aggregate", "sum"]);
        }
      }
    }

    if (geographies)
      params.push([
        "geography",
        maxGeographies ? geographies.slice(0, maxGeographies) : geographies,
      ]);

    if (unpivot) params.push(["unpivot", "true"]);

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
    unpivot,
  }: {
    analysis: Analysis;
    format: string;
    geographies?: number[] | number[][] | null;
    includeTimeDimension?: boolean;
    unpivot?: boolean;
  }) {
    return this.dataset.getDataUrl(
      this.getQueryParams({
        analysis,
        geographies,
        includeTimeDimension,
        unpivot,
      }),
      format,
    );
  }

  getMapStyleUrl({ analysis, mapOptions }) {
    return this.structure.visualizationsMap["map"].getSpecUrl(
      this,
      {
        analysis,
        includeTimeDimension: true,
      },
      Object.keys(mapOptions).map((key) => [
        camelToSnake(key),
        mapOptions[key],
      ]),
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
