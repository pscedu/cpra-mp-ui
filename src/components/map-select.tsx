import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";
import {
  getCartesianProductObject,
  moveToFirstPosition,
} from "@/helpers/utils";

import SidebarSelect from "@/components/sidebar-select";
import { Map } from "lucide-react";

export default function MapSelect() {
  // Atoms imported at top
  if (!structure || !catalogQueries || !datasets) return;
  const allValues = {
    dataset: catalogQueries?.datasets,
    ...catalogQueries?.combinedFilters,
  };
  // Remove the analysis dimnension, if applicable.
  if (analysis?.dimension) delete allValues[analysis?.dimension];
  // Also remove the model group dimnesion if we are doing a three-image
  // concatenate for land type.
  if (
    analysis?.operation === "concatenate" &&
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
          .map(
            (key) =>
              `${structure?.dimensionsMap[key].label}: ${combo[key]}`,
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
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
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
              if (combo.dataset !== datasets[0])
                setSelectedDatasets(
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
        });
      }}
      value={selectedOption}
      icon={Map}
    />
  );
}
