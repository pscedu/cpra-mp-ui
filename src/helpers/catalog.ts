import { dataBaseUrl } from "./config";
import { QueryOptions } from "./query";
import { Dataset, Dimension, Structure } from "./structure";
import {
  extractCatalogObject,
  getJson,
  getFilterParams,
  makeQueryString,
  mergeOr,
  sortConsistent,
  sqlValue,
} from "./utils";

export class CatalogQuery {
  dataset: Dataset;
  filters: any;
  structure: Structure;
  response: any;

  constructor(dataset: Dataset, filters: any, structure: Structure) {
    this.dataset = dataset;
    this.filters = filters;
    this.structure = structure;
    this.response = null;
  }

  async execute() {
    const { variable, grid, time_unit } = this.dataset;
    const requiredDimensions = this.structure.getRequiredDimensions([
      this.dataset,
    ]);

    const qs = makeQueryString(
      getFilterParams(requiredDimensions, this.filters),
    );
    const requestPath = `${dataBaseUrl}/datasets/${variable.name}/${grid.name}/${time_unit}/catalog.json${qs}`;
    this.response = await getJson(requestPath);
    // Sort the filters so that the order of the requested filters is preserved if possible.
    for (const key of Object.keys(this.response.results))
      sortConsistent(this.response.results[key], this.filters[key]);
  }

  getQueryParams(
    { analysis, geographies, maxGeographies, maxValues }: QueryOptions = {
      analysis: null,
      geographies: null,
      maxGeographies: null,
      maxValues: null,
    },
  ): [string, any][] {
    const requiredDimensions = this.structure.getRequiredDimensions([
      this.dataset,
    ]);

    // TODO: Select the filters based on user input. For now, we select the first
    // value for each dimension.
    const selectedFilters = {};
    for (const dimension of requiredDimensions)
      if (!geographies || dimension.filterType !== "time")
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

    return params;
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
    this.structure = structure;
    this.queries = datasets.map(
      (dataset) => new CatalogQuery(dataset, filters, structure),
    );
    this.combinedFilters = null;
    this.combinedChoices = null;
    this.activeDimensions = [];
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
}
