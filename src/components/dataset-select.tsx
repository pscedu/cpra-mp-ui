import { useAtomValue, useSetAtom } from "jotai";
import {
  catalogQueriesAtom,
  setRequestedDatasetsAtom,
  structureAtom,
} from "@/helpers/state";
import { toTitleCase } from "@/helpers/utils";

import SidebarSelect from "@/components/sidebar-select";
import { Calendar, Ruler } from "lucide-react";

export default function DatasetSelect() {
  const structure = useAtomValue(structureAtom);
  const datasets = useAtomValue(catalogQueriesAtom).datasets;
  const setRequestedDatasets = useSetAtom(setRequestedDatasetsAtom);

  const timeUnits = [
    ...new Set(structure?.datasets.map((dataset) => dataset.time_unit)),
  ].sort();

  const timeUnit = (datasets?.length && datasets[0].time_unit) || "annual";

  const timeOptions = timeUnits.map((value) => ({
    label: toTitleCase(value),
    value,
  }));

  const variableOptions = structure?.datasets
    .filter((dataset) => dataset.time_unit === timeUnit)
    .map((dataset) => ({
      label: dataset.variable.label,
      value: dataset,
    }));

  const setTimeUnit = (newTimeUnit) => {
    const canidateDatasets = structure?.datasets.filter(
      (dataset) => dataset.time_unit === newTimeUnit,
    );
    let newDatasets = canidateDatasets.filter((candidate) =>
      datasets?.find(
        (dataset) =>
          dataset.variable === candidate.variable &&
          dataset.grid === candidate.grid,
      ),
    );
    if (newDatasets.length === 0) newDatasets = [canidateDatasets[0]];
    setRequestedDatasets(newDatasets);
  };

  return (
    <>
      <SidebarSelect
        icon={Calendar}
        label="Time Unit"
        onChange={setTimeUnit}
        options={timeOptions}
        value={timeUnit}
      />
      <SidebarSelect
        icon={Ruler}
        label="Variable"
        onChange={setRequestedDatasets}
        options={variableOptions}
        value={datasets}
      />
    </>
  );
}
