import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { batch, computed, effect, signal } from "@preact/signals";
import { apiBaseUrl } from "./config";
import { getDatasets } from "./dataset";
import { getBaseStyle, getDataStyle } from "./mapstyle";
import { Dimension, getStructure } from "./structure";
import { SelectItem } from "./types";
import {
  extractValues,
  getApiJson,
  getFiltersQueryString,
  mergeOr,
} from "./utils";

export const PortalState = createContext(null);

function dataSignal(loadFn: Function, defaultValue = null) {
  const sig = signal(defaultValue);
  effect(() => {
    (async () => {
      sig.value = await loadFn();
    })();
  });
  return sig;
}

export function createPortalState() {
  const structure = dataSignal(getStructure);
  const allDatasets = dataSignal(getDatasets);

  const datasets = signal([]);
  const filters = signal({});
  const filterChoices = signal({});
  const catalogResponses = signal([]);

  const mapDataLoading = signal(false);

  // Query the catalog API for each selected dataset when the selected
  // datasets or dimension values change.
  const queryCatalog = (requestedFilters) => {
    (async () => {
      if (datasets.value && datasets.value.length && structure.value) {
        const responses = await Promise.all(
          datasets.value.map((dataset) => {
            const requiredDimensions = structure.value.getRequiredDimensions([
              dataset,
            ]);

            const qs = getFiltersQueryString(
              requiredDimensions,
              requestedFilters
            );
            const requestPath = `datasets/${dataset.variable}/${dataset.grid}/${dataset.time_unit}/catalog.json${qs}`;
            return getApiJson(requestPath);
          })
        );

        const newFilters = mergeOr(
          responses.map((response) => response.results),
          filterDimensionNames.value,
          extractValues
        );

        const choices = mergeOr(
          responses.map((response) => response.choices),
          filterDimensionNames.value,
          extractValues
        );

        filters.value = newFilters;
        filterChoices.value = choices;
        catalogResponses.value = responses;
      }
    })();
  };

  // Ensure there is always at least one dataset selected.
  effect(() => {
    if (
      allDatasets.value &&
      allDatasets.value.length > 0 &&
      datasets.value.length == 0
    )
      datasets.value = [allDatasets.value[0]];
    queryCatalog(filters.peek());
  });

  // Dimensions representing a filter (not dataset or metadata).
  const filterDimensions = computed(() =>
    structure.value
      ? structure.value.dimensions.filter(
          (dimension) => !["dataset", "metadata"].includes(dimension.type)
        )
      : []
  );

  // Names of filter dimensions.
  const filterDimensionNames = computed(() =>
    filterDimensions.value.map((dimension) => dimension.name)
  );

  // Object mapping filter dimension names to SelectItems for choices.
  const filterChoicesItems = computed((): SelectItem[][] =>
    activeFilterDimensions.value.map((dimension) => {
      if (dimension.values) {
        return dimension.values
          .filter((dv) =>
            filterChoices.value[dimension.name].includes(dv.value)
          )
          .map((dv) => ({
            text: dv.label || dv.value.toString(),
            description: dv.label ? dv.value.toString() : null,
            value: dv.value,
          }));
      } else {
        return filterChoices.value[dimension.name].map((value) => ({
          text: value.toString(),
          value,
        }));
      }
    })
  );

  // Object mapping filter dimension names to SelectItems for selected choices.
  const filterChoicesSelectedItems = computed((): SelectItem[][] =>
    filterChoicesItems.value.map((items, i) => {
      const dimension = activeFilterDimensions.value[i];
      return items.filter((item) =>
        (filters.value[dimension.name] || []).includes(item.value)
      );
    })
  );

  // SelectItems representing all available datasets.
  const datasetItems = computed(() =>
    allDatasets.value && structure.value
      ? allDatasets.value.map(
          (dataset): SelectItem => ({
            text: structure.value.variablesMap[dataset.variable].label,
            description: `${dataset.grid},${dataset.time_unit}`,
          })
        )
      : []
  );

  // SelectItems representing the selected datasets.
  const datasetSelectedItems = computed((): SelectItem[] =>
    allDatasets.value &&
    datasets.value &&
    datasetItems.value &&
    datasets.value.length &&
    datasetItems.value.length
      ? datasets.value.map(
          (dataset) => datasetItems.value[allDatasets.value.indexOf(dataset)]
        )
      : []
  );

  // Partition and non-partition Dimensions for the selected datasets.
  const activeFilterDimensions = computed((): Dimension<any>[] =>
    structure.value && filterChoices.value
      ? structure.value.dimensions.filter(
          (dimension) => dimension.name in filterChoices.value
        )
      : []
  );

  const mapDataset = computed(() => {
    if (!datasets.value || !datasets.value.length) return null;
    // TODO: Allow user to select the active dataset.
    return datasets.value[0];
  });

  const mapCatalogResponse = computed(() => {
    if (!catalogResponses.value.length) return null;
    // TODO: Allow user to select the active dataset.
    return catalogResponses.value[0];
  });

  const mapQueryString = computed(() => {
    const ds = mapDataset.value;
    const cr = mapCatalogResponse.value;
    if (!ds || !cr) return "";

    const requiredDimensions = structure.value.getRequiredDimensions([ds]);

    // TODO: Select the filters based on user input. For now, we select the first
    // value for each dimension.
    const selectedFilters = {};
    for (let dimension of requiredDimensions)
      selectedFilters[dimension.name] = [cr.results[dimension.name][0]];

    return getFiltersQueryString(requiredDimensions, selectedFilters);
  });

  const datasetStyle = computed(() => {
    const noData = { sources: {}, layers: [] };
    const ds = mapDataset.value;
    const qs = mapQueryString.value;
    if (!ds || !qs.length || !structure.value) return noData;

    const grid = structure.value.gridsMap[ds.grid];
    if (grid.grid_type === "raster") {
      const tileUrl = `${apiBaseUrl}/datasets/${ds.variable}/${ds.grid}/${ds.time_unit}/data/{z}/{x}/{y}.png`;
      return {
        sources: {
          "data-raster": {
            // TODO: Calculate the correct bounds and max zoom from the grid.
            bounds: [
              -94.00080091962352, 28.70426878930118, -87.51148588666453,
              31.048795426051505,
            ],
            maxzoom: 13,
            type: "raster",
            tiles: [`${tileUrl}${qs}`],
            tileSize: 256,
          },
        },
        layers: [
          {
            type: "raster",
            id: "data-raster",
            source: "data-raster",
            order: 6000,
          },
        ],
      };
    } else {
      return noData;
    }
  });

  // Map style
  const mapStyle = computed(() => {
    const baseStyle = getBaseStyle();
    const sources = { ...baseStyle.sources, ...datasetStyle.value.sources };
    const layers = [...baseStyle.layers, ...datasetStyle.value.layers];
    layers.sort((a, b) => a.order - b.order);

    const origin = document.location.origin;
    return {
      version: 8,
      glyphs: `${origin}/style/glyphs/{fontstack}/{range}.pbf`,
      sources,
      layers,
      transition: {
        duration: 0,
        delay: 0,
      },
    };
  });

  const setDatasetSelectedItems = (items: SelectItem[]) => {
    batch(() => {
      datasets.value = (Array.isArray(items) ? items : [items]).map(
        (item) => allDatasets.value[datasetItems.value.indexOf(item)]
      );
      catalogResponses.value = [];
    });
    queryCatalog(filters.value);
  };

  const setFilterChoicesSelectedItems = (
    dimensionName: string,
    items: SelectItem[]
  ) => {
    queryCatalog({
      ...filters.value,
      [dimensionName]: items.map((item) => item.value),
    });
  };

  return {
    activeFilterDimensions,
    allDatasets,
    datasetItems,
    datasetSelectedItems,
    datasets,
    filterChoicesItems,
    filterChoicesSelectedItems,
    mapDataLoading,
    mapStyle,
    setDatasetSelectedItems,
    setFilterChoicesSelectedItems,
    structure,
  };
}

export const usePortalState = () => useContext(PortalState);
