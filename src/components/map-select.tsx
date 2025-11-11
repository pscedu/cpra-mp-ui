import { batch } from "@preact/signals-react";
import { usePortalState } from "@/helpers/state";
import {
  getCartesianProductObject,
  moveToFirstPosition,
} from "@/helpers/utils";

import SidebarSelect from "@/components/sidebar-select";
import { Map } from "lucide-react";

export default function MapSelect() {
  const {
    catalogQueries,
    datasets,
    setSelectedDatasets,
    setSelectedFilterChoices,
    structure,
  } = usePortalState();
  if (!structure.value || !catalogQueries.value || !datasets.value) return;
  const allValues = {
    dataset: catalogQueries.value.datasets,
    ...catalogQueries.value.combinedFilters,
  };
  const combos = getCartesianProductObject(allValues);
  const nameKeys = Object.keys(allValues).filter(
    (key) => allValues[key].length > 1,
  );

  const options = combos.map((combo, i) => {
    return {
      label:
        nameKeys
          .map(
            (key) =>
              `${structure.value.dimensionsMap[key].label}: ${combo[key]}`,
          )
          .join(", ") || "Default",
      value: combo,
    };
  });
  // The first combination is always the currently selected one.
  const selectedOption = options[0];
  // Sort the options by value.
  options.sort((a, b) => {
    for (const key of nameKeys) {
      if (a.value[key] < b.value[key]) return -1;
      if (a.value[key] > b.value[key]) return 1;
    }
    return 0;
  });

  return (
    <SidebarSelect
      label="Map"
      options={options}
      onChange={(combo) => {
        batch(() => {
          for (const key of nameKeys) {
            if (key === "dataset") {
              if (combo.dataset !== datasets.value[0])
                setSelectedDatasets(
                  moveToFirstPosition(combo.dataset, datasets.value),
                );
            } else {
              setSelectedFilterChoices(
                key,
                moveToFirstPosition(
                  combo[key],
                  catalogQueries.value.combinedFilters[key],
                ),
                false,
              );
            }
          }
        });
      }}
      value={selectedOption.value}
      icon={Map}
    />
  );
}
