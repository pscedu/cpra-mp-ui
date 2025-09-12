import { usePortalState } from "@/helpers/state";
import { toTitleCase } from "@/helpers/utils";

import SidebarSelect from "@/components/sidebar-select";
import { Calendar, Ruler } from "lucide-react";

export default function DatasetSelect() {
  const { datasets, setSelectedDatasets, structure } = usePortalState();

  if (!structure.value) return;

  const timeUnits = [
    ...new Set(structure.value.datasets.map((dataset) => dataset.time_unit)),
  ].sort();

  const timeUnit =
    (datasets.value.length && datasets.value[0].time_unit) || "annual";

  const timeOptions = timeUnits.map((value) => ({
    label: toTitleCase(value),
    value,
  }));

  const variableOptions = structure.value.datasets
    .filter((dataset) => dataset.time_unit === timeUnit)
    .map((dataset) => ({
      label: dataset.variable.label,
      value: dataset,
    }));

  const setTimeUnit = (newTimeUnit) => {
    const filter = (dataset) => dataset.time_unit === newTimeUnit;
    let newDatasets = datasets.value.filter(filter);
    if (newDatasets.length === 0)
      newDatasets = [structure.value.datasets.find(filter)];
    setSelectedDatasets(newDatasets);
  };

  return (
    <>
      <SidebarSelect
        icon={Calendar}
        label="time unit"
        onChange={setTimeUnit}
        options={timeOptions}
        value={timeUnit}
      />
      <SidebarSelect
        icon={Ruler}
        label="variable"
        onChange={setSelectedDatasets}
        options={variableOptions}
        value={datasets.value}
      />
    </>
  );
}
