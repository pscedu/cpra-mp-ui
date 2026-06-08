import { useAtomValue, useSetAtom } from "jotai";
import { getDimensionIcon } from "@/helpers/icon";
import {
  catalogQueriesAtom,
  setSelectedFilterChoicesAtom,
  structureAtom,
} from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";

export default function DimensionSelect({
  name,
  showSelectionMode = true,
}: {
  name: string;
  showSelectionMode?: boolean;
}) {
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const setSelectedFilterChoices = useSetAtom(setSelectedFilterChoicesAtom);
  const structure = useAtomValue(structureAtom);
  const dimension = structure.dimensionsMap[name];

  let options;
  if (dimension.values) {
    options = dimension.values
      .filter((dv) =>
        catalogQueries.combinedChoices[dimension.name].includes(dv.value),
      )
      .map((dv) => ({
        label: dv.label || dv?.toString(),
        value: dv.value,
      }));
  } else {
    options = catalogQueries.combinedChoices[dimension.name].map((value) => ({
      label: value.toString(),
      value,
    }));
  }

  return (
    <SidebarSelect
      icon={getDimensionIcon(dimension.name)}
      id={dimension.name}
      label={dimension.label}
      key={dimension.name}
      value={catalogQueries.combinedFilters[dimension.name]}
      onChange={(value) => setSelectedFilterChoices(dimension.name, value)}
      options={options}
      showSelectionMode={showSelectionMode}
      supportsSubtract={true}
    />
  );
}
