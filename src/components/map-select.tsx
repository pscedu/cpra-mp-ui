import { useAtomValue, useSetAtom } from "jotai";
import {
  catalogQueriesAtom,
  derivedAnalysisAtom,
  modeAtom,
  setRequestedDatasetsAtom,
  setSelectedFilterChoicesAtom,
  structureAtom,
} from "@/helpers/state";
import {
  getCartesianProductObject,
  moveToFirstPosition,
} from "@/helpers/utils";

import SidebarSelect from "@/components/sidebar-select";
import { Map } from "lucide-react";

export default function MapSelect() {
  const structure = useAtomValue(structureAtom);
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const datasets = catalogQueries.datasets;
  const setRequestedDatasets = useSetAtom(setRequestedDatasetsAtom);
  const mode = useAtomValue(modeAtom);
  const derivedAnalysis = useAtomValue(derivedAnalysisAtom);
  const setSelectedFilterChoices = useSetAtom(setSelectedFilterChoicesAtom);

  const allValues = {
    dataset: catalogQueries?.datasets,
    ...catalogQueries?.combinedFilters,
  };
  // Remove the mode's own dimension, if applicable.
  if (mode?.dimension) delete allValues[mode?.dimension];
  // Also remove any dimensions the selected derived variable already
  // subsumes (§4.4), and the model group dimension specifically if we are
  // doing a three-image `lnd_chng`.
  for (const dim of structure?.subsumedFor(derivedAnalysis) ?? [])
    delete allValues[dim];
  if (
    derivedAnalysis === "lnd_chng" &&
    catalogQueries?.combinedFilters.model_group_id?.length == 2
  )
    delete allValues["model_group_id"];
  const combos = getCartesianProductObject(allValues);
  const nameKeys = Object.keys(allValues).filter(
    (key) => allValues[key].length > 1,
  );

  const options = combos.map((combo, i) => {
    return {
      label:
        nameKeys
          .map((key) => `${structure?.dimensionsMap[key].label}: ${combo[key]}`)
          .join(", ") || "Default",
      value: combo,
    };
  });
  // The first combination is always the currently selected one.
  const selectedOption = options[0];
  // Sort the options by value.
  options.sort((a, b) => {
    for (const key of nameKeys) {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
    }
    return 0;
  });

  return (
    <SidebarSelect
      label="Map"
      options={options}
      onChange={(combo: any) => {
        for (const key of nameKeys) {
          if (key === "dataset") {
            if (combo.dataset !== datasets[0])
              setRequestedDatasets(
                moveToFirstPosition(combo.dataset, datasets),
              );
          } else {
            setSelectedFilterChoices(
              key,
              moveToFirstPosition(
                combo[key],
                catalogQueries?.combinedFilters[key],
              ),
              false,
            );
          }
        }
      }}
      value={selectedOption.value}
      icon={Map}
    />
  );
}
