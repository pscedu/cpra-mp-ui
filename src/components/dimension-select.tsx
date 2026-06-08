import { useAtomValue, useSetAtom } from "jotai";
import { getDimensionIcon } from "@/helpers/icon";
import {
  catalogQueriesAtom,
  setSelectedFilterChoicesAtom,
  structureAtom,
} from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import { Option } from "@/helpers/types";

export default function DimensionSelect<T>({
  className,
  choices,
  name,
  showSelectionMode = true,
}: {
  className?: string;
  choices?: Option<T>[];
  name: string;
  showSelectionMode?: boolean;
}) {
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const setSelectedFilterChoices = useSetAtom(setSelectedFilterChoicesAtom);
  const structure = useAtomValue(structureAtom);
  const dimension = structure.dimensionsMap[name];

  let options;
  const valueChoices = choices || dimension.values;
  if (valueChoices) {
    options = valueChoices
      .filter((dv) =>
        catalogQueries.combinedChoices[dimension.name].includes(dv.value),
      )
      .map((dv) => ({
        label: dv.label || dv?.toString(),
        value: dv.value,
      }));
  } else {
    options = catalogQueries.combinedChoices[dimension.name].map(
      (value: T) => ({
        label: value.toString(),
        value,
      }),
    );
  }

  return (
    <SidebarSelect
      className={className}
      icon={getDimensionIcon(dimension.name)}
      id={dimension.name}
      label={dimension.label}
      key={dimension.name}
      value={catalogQueries.combinedFilters[dimension.name]}
      onChange={(value: T) => setSelectedFilterChoices(dimension.name, value)}
      options={options}
      showSelectionMode={showSelectionMode}
      supportsSubtract={true}
    />
  );
}
