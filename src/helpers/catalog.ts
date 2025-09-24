import { dataBaseUrl } from "./config";
import { QueryOptions } from "./query";
import { Dataset, Dimension, Structure } from "./structure";
import {
  extractCatalogObject,
  getJson,
  getFilterParams,
  makeQueryString,
  mergeOr,
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
  }

  getQueryParams(
    { analysis, geographies, maxGeographies }: QueryOptions = {
      analysis: null,
      geographies: null,
      maxGeographies: null,
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

    const params = getFilterParams(requiredDimensions, selectedFilters);

    if (analysis) {
      const [analysisOperation, analysisDimension] = analysis.split(":");
      if (analysisOperation.startsWith("subtract-")) {
        const values = this.response.results[analysisDimension];
        if (values && values.length === 2) {
          const negateValue = values[analysisOperation.endsWith("asc") ? 1 : 0];
          const groupByNames = requiredDimensions
            .map(({ name }) => name)
            .filter((name) => name !== analysisDimension);
          params.push([
            "negate",
            `${analysisDimension}=${typeof negateValue === "number" ? negateValue : `"${negateValue}"`}`,
          ]);
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
