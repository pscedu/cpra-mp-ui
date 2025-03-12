import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { batch, computed, effect, signal } from "@preact/signals";
import { loadUser, saveUser } from "./auth";
import { Dimension, getStructure } from "./structure";
import { SelectItem } from "./types";
import {
  extractCatalogObject,
  getApiJson,
  getApiNdJson,
  getFilterParams,
  makeQueryString,
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

  const user = signal(loadUser());
  const avatarCacheKey = signal(new Date().getTime());

  const datasets = signal([]);
  const filters = signal({});
  const filterChoices = signal({});
  const catalogResponses = signal([]);
  const timeValues = signal([]);
  let timeValuesTimeout = null;

  const mapFeatureValues = signal({});
  const mapFeatureValuesLoading = signal(false);
  const mapTilesLoading = signal(false);

  const selectedGeographies = signal([]);
  const visualizationType = signal("time-series-line");
  const visualizationSpec = signal(null);

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

            // Create a copy of the filters specific to this dataset so we can make
            // changes without impacting other datasets.
            const queryFilers = { ...requestedFilters };

            // Handle changing from daily/monthly datasets to annual/decadal datasets
            // and vice-versa.
            if (
              "calendar_day" in queryFilers &&
              ["annual", "decadal"].includes(dataset.time_unit)
            ) {
              queryFilers["calendar_year"] = queryFilers["calendar_day"].map(
                (dateStr) => {
                  let year = parseInt(dateStr.substr(0, 4));
                  if (dataset.time_unit === "decadal")
                    year = Math.round(year / 10) * 10;
                  return year;
                }
              );
              delete queryFilers["calendar_day"];
            } else if (
              "calendar_year" in queryFilers &&
              ["daily", "monthly"].includes(dataset.time_unit)
            ) {
              queryFilers["calendar_day"] = queryFilers["calendar_year"].map(
                (year) => `${year}-01-01`
              );
              delete queryFilers["calendar_year"];
            }

            const qs = makeQueryString(
              getFilterParams(requiredDimensions, queryFilers)
            );
            const requestPath = `datasets/${dataset.variable.name}/${dataset.grid.name}/${dataset.time_unit}/catalog.json${qs}`;
            return getApiJson(requestPath);
          })
        );

        const newFilters = mergeOr(
          responses.map((response, i) =>
            extractCatalogObject(response.results, datasets.value[i])
          ),
          filterDimensionNames.value
        );

        const choices = mergeOr(
          responses.map((response, i) =>
            extractCatalogObject(response.choices, datasets.value[i])
          ),
          filterDimensionNames.value
        );

        batch(() => {
          filters.value = newFilters;
          filterChoices.value = choices;
          catalogResponses.value = responses;
          const timeDim = timeDimension.peek();
          if (timeDim) timeValues.value = newFilters[timeDim.name];
        });
      }
    })();
  };

  // Ensure there is always at least one dataset selected.
  effect(() => {
    if (structure.value && datasets.value.length == 0)
      datasets.value = [structure.value.datasets[0]];
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
    activeSelectDimensions.value.map((dimension) => {
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
      const dimension = activeSelectDimensions.value[i];
      return items.filter((item) =>
        (filters.value[dimension.name] || []).includes(item.value)
      );
    })
  );

  // SelectItems representing all available datasets.
  const datasetItems = computed(() =>
    structure.value
      ? structure.value.datasets.map(
          (dataset): SelectItem => ({
            text: dataset.variable.label,
            description: `${dataset.grid.name},${dataset.time_unit}`,
          })
        )
      : []
  );

  // SelectItems representing the selected datasets.
  const datasetSelectedItems = computed((): SelectItem[] =>
    structure.value &&
    datasets.value &&
    datasetItems.value &&
    datasets.value.length &&
    datasetItems.value.length
      ? datasets.value.map(
          (dataset) =>
            datasetItems.value[structure.value.datasets.indexOf(dataset)]
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

  // Select item dimensions.
  const activeSelectDimensions = computed((): Dimension<any>[] =>
    activeFilterDimensions.value.filter(
      (dimension) => !dimension.name.startsWith("calendar_")
    )
  );

  // Time dimensions.
  const activeTimeDimensions = computed((): Dimension<any>[] =>
    activeFilterDimensions.value.filter((dimension) =>
      dimension.name.startsWith("calendar_")
    )
  );

  const mapDataset = computed(() => {
    if (!datasets.value || !datasets.value.length) return null;
    // TODO: Allow user to select the active dataset.
    return datasets.value[0];
  });

  const mapDataUrl = computed(() => {
    if (
      !mapDataset.value ||
      !mapFilterParams.value ||
      mapDataset.value.grid.grid_type === "raster"
    )
      return null;
    return mapDataset.value.getDataUrl(mapFilterParams.value, "ndjson");
  });

  const mapCatalogResponse = computed(() => {
    if (!catalogResponses.value.length) return null;
    // TODO: Allow user to select the active dataset.
    return catalogResponses.value[0];
  });

  const mapFilterParams = computed(() => {
    const ds = mapDataset.value;
    const cr = mapCatalogResponse.value;
    if (!ds || !cr || !structure.value) return null;

    const requiredDimensions = structure.value.getRequiredDimensions([ds]);

    // TODO: Select the filters based on user input. For now, we select the first
    // value for each dimension.
    const selectedFilters = {};
    for (let dimension of requiredDimensions)
      selectedFilters[dimension.name] = [cr.results[dimension.name][0]];

    return getFilterParams(requiredDimensions, selectedFilters);
  });

  const visualizationFilterParams = computed(() =>
    mapFilterParams.value && selectedGeographies.value.length > 0
      ? mapFilterParams.value
          .filter(([param, _value]) => !param.startsWith("calendar_"))
          .concat([["geography", selectedGeographies.value]])
      : null
  );

  const mapTileUrl = computed(() =>
    mapDataset.value && mapFilterParams.value
      ? mapDataset.value.getTileUrl(mapFilterParams.value)
      : null
  );

  const timeDimension = computed(() =>
    activeTimeDimensions.value.length ? activeTimeDimensions.value[0] : null
  );

  const timeChoices = computed(() =>
    timeDimension.value
      ? (filterChoices.value || {})[timeDimension.value.name] || []
      : []
  );

  const visualizationSpecUrl = computed(() => {
    return visualizationFilterParams.value && visualizationType.value
      ? mapDataset.value.getVisualizationUrl(
          visualizationFilterParams.value,
          visualizationType.value
        )
      : null;
  });

  const setTimeValues = (values) => {
    timeValues.value = values;
    if (timeValuesTimeout) clearTimeout(timeValuesTimeout);
    timeValuesTimeout = setTimeout(
      () =>
        queryCatalog({
          ...filters.value,
          [timeDimension.value.name]: values,
        }),
      250
    );
  };

  const setDatasetSelectedItems = (items: SelectItem[]) => {
    batch(() => {
      datasets.value = (Array.isArray(items) ? items : [items]).map(
        (item) => structure.value.datasets[datasetItems.value.indexOf(item)]
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

  // Update map feature state when the dataset or filters change.
  effect(() => {
    (async () => {
      if (mapDataUrl.value) {
        mapFeatureValuesLoading.value = true;
        const data = await getApiNdJson(mapDataUrl.value);
        if (data.length === 1) {
          batch(() => {
            mapFeatureValues.value = data[0];
            mapFeatureValuesLoading.value = false;
          });
        } else {
          console.error(`Expected 1 row, received ${data.length}`, data);
        }
      } else {
        mapFeatureValues.value = {};
      }
    })();
  });

  // Save user information to local storage when it changes.
  effect(() => {
    saveUser(user.value);
  });

  // Load the visualization spec when the URL changes.
  effect(() => {
    (async () =>
      (visualizationSpec.value = visualizationSpecUrl.value
        ? await getApiJson(visualizationSpecUrl.value)
        : null))();
  });

  return {
    activeSelectDimensions,
    avatarCacheKey,
    datasetItems,
    datasetSelectedItems,
    datasets,
    filterChoicesItems,
    filterChoicesSelectedItems,
    mapDataset,
    mapFeatureValues,
    mapFeatureValuesLoading,
    mapTileUrl,
    mapTilesLoading,
    selectedGeographies,
    setDatasetSelectedItems,
    setFilterChoicesSelectedItems,
    setTimeValues,
    structure,
    timeChoices,
    timeDimension,
    timeValues,
    user,
    visualizationSpec,
  };
}

export const usePortalState = () => useContext(PortalState);
