import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { computed, effect, signal } from "@preact/signals";
import { getDatasets } from "./dataset";
import { Dimension, getStructure } from "./structure";
import { SelectItem } from "./types";
import { extractValues, getApiJson } from "./utils";

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

  // Ensure there is always at least one dataset selected.
  effect(() => {
    if (
      allDatasets.value &&
      allDatasets.value.length > 0 &&
      datasets.value.length == 0
    )
      datasets.value = [allDatasets.value[0]];
  });

  // Query the catalog API for each selected dataset when the selected
  // datasets or dimension values change.
  effect(() => {
    (async () => {
      if (datasets.value && datasets.value.length && structure.value) {
        const responses = await Promise.all(
          datasets.value.map((dataset) => {
            const requiredDimensions = filterDimensions.value.filter(
              (dimension) => {
                const variable = structure.value.variablesMap[dataset.variable];
                return (
                  dimension.required ||
                  variable.required_dimensions?.includes(dimension.name)
                );
              }
            );
            const params = {};
            for (let dimension of requiredDimensions)
              if (dimension.name in filters.value)
                params[dimension.name] = filters.value[dimension.name];

            // TODO: Include query string params.
            return getApiJson(
              `datasets/${dataset.variable}/${dataset.grid}/${dataset.time_unit}/catalog.json`
            );
          })
        );

        const choices = {};
        for (let response of responses) {
          for (let dimensionName in response.choices) {
            if (filterDimensionNames.value.includes(dimensionName)) {
              const values = extractValues(response.choices[dimensionName]);
              if (dimensionName in choices) {
                choices[dimensionName] = choices[dimensionName].filter(
                  (value) => values.includes(value)
                );
                // TODO: Create an alert and revert the filters if a dimension has
                // no common values.
              } else {
                choices[dimensionName] = values;
              }
            }
          }
        }

        // TODO: Update filter values based on the catalog results.

        filterChoices.value = choices;
        catalogResponses.value = responses;
      }
    })();
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

  const setDatasetSelectedItems = (items: SelectItem[]) => {
    datasets.value = (Array.isArray(items) ? items : [items]).map(
      (item) => allDatasets.value[datasetItems.value.indexOf(item)]
    );
  };

  const setFilterChoicesSelectedItems = (
    dimensionName: string,
    items: SelectItem[]
  ) => {
    filters.value = {
      ...filters.value,
      [dimensionName]: items.map((item) => item.value),
    };
  };

  return {
    activeFilterDimensions,
    allDatasets,
    datasetItems,
    datasetSelectedItems,
    datasets,
    filterChoicesItems,
    filterChoicesSelectedItems,
    setDatasetSelectedItems,
    setFilterChoicesSelectedItems,
    structure,
  };
}

export const usePortalState = () => useContext(PortalState);
