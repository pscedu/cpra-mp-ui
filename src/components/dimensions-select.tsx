import { usePortalState } from "../helpers/state";

import SidebarSelect from "@/components/sidebar-select";

export default function DimensionsSelect() {
  const { catalogQueries, setSelectedFilterChoices, structure } =
    usePortalState();

  if (!structure.value || !catalogQueries.value) return;
  const cqs = catalogQueries.value;

  return cqs.activeDimensions
    .filter((dim) => dim.filterType === "select")
    .map((dimension) => {
      let options;
      if (dimension.values) {
        options = dimension.values
          .filter((dv) =>
            cqs.combinedChoices[dimension.name].includes(dv.value),
          )
          .map((dv) => ({
            label: dv.label || dv.value.toString(),
            value: dv.value,
          }));
      } else {
        options = cqs.combinedChoices[dimension.name].map((value) => ({
          label: value.toString(),
          value,
        }));
      }
      return (
        <SidebarSelect
          id={dimension.name}
          label={dimension.label}
          key={dimension.name}
          value={cqs.combinedFilters[dimension.name]}
          onChange={(value) => setSelectedFilterChoices(dimension.name, value)}
          options={options}
          supportsSubtract={true}
        />
      );
    });
}
