import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { computed, effect, signal } from "@preact/signals";
import { getDatasets } from "./dataset";
import { getStructure } from "./structure";
import { SelectItem } from "./types";

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

  const choices = signal({});
  const datasets = signal([]);
  const dimensions = signal({});

  effect(() => {
    if (
      allDatasets.value &&
      allDatasets.value.length > 0 &&
      datasets.value.length == 0
    )
      datasets.value = [allDatasets.value[0]];
  });

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

  const setDatasetSelectedItems = (items: SelectItem[]) => {
    datasets.value = (Array.isArray(items) ? items : [items]).map(
      (item) => allDatasets.value[datasetItems.value.indexOf(item)]
    );
  };

  return {
    allDatasets,
    choices,
    datasetItems,
    datasetSelectedItems,
    datasets,
    dimensions,
    setDatasetSelectedItems,
    structure,
  };
}

export const usePortalState = () => useContext(PortalState);
