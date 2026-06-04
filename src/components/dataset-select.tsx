import { useAtomValue, useSetAtom } from "jotai";
import {
  catalogQueriesAtom,
  setRequestedDatasetsAtom,
  structureAtom,
} from "@/helpers/state";
import { toTitleCase } from "@/helpers/utils";

import SidebarSelect from "@/components/sidebar-select";
import { BookImage, Calendar, Ruler } from "lucide-react";

const getMasterPlan = (dataset) =>
  dataset.grid.name.endsWith("_v001") ? "2023 Master Plan" : "2029 Master Plan";

export default function DatasetSelect() {
  const structure = useAtomValue(structureAtom);
  const datasets = useAtomValue(catalogQueriesAtom).datasets;
  const setRequestedDatasets = useSetAtom(setRequestedDatasetsAtom);

  const masterPlan =
    datasets?.length && datasets[0]
      ? getMasterPlan(datasets[0])
      : "2023 Master Plan";

  const masterPlans = [
    ...new Set(structure?.datasets.map(getMasterPlan)),
  ].sort();

  const masterPlanOptions = masterPlans.map((value) => ({
    label: value,
    value,
  }));

  const masterPlanDatasets = structure?.datasets.filter(
    (dataset) => getMasterPlan(dataset) === masterPlan,
  );

  const timeUnits = [
    ...new Set(masterPlanDatasets?.map((dataset) => dataset.time_unit)),
  ].sort();

  const timeUnit = (datasets?.length && datasets[0].time_unit) || "annual";

  const timeOptions = timeUnits.map((value) => ({
    label: toTitleCase(value),
    value,
  }));

  const variableOptions = masterPlanDatasets
    ?.filter((dataset) => dataset.time_unit === timeUnit)
    .map((dataset) => ({
      label: dataset.variable.label,
      value: dataset,
    }));

  const setMasterPlan = (newMasterPlan) => {
    const candidateDatasets = structure?.datasets.filter(
      (dataset) => getMasterPlan(dataset) === newMasterPlan,
    );
    let newDatasets = candidateDatasets.filter((candidate) =>
      datasets?.find(
        (dataset) =>
          dataset.variable === candidate.variable &&
          dataset.time_unit === candidate.time_unit,
      ),
    );
    if (newDatasets.length === 0) newDatasets = [candidateDatasets[0]];
    setRequestedDatasets(newDatasets);
  };

  const setTimeUnit = (newTimeUnit) => {
    const candidateDatasets = masterPlanDatasets?.filter(
      (dataset) => dataset.time_unit === newTimeUnit,
    );
    let newDatasets = candidateDatasets.filter((candidate) =>
      datasets?.find(
        (dataset) =>
          dataset.variable === candidate.variable &&
          dataset.grid === candidate.grid,
      ),
    );
    if (newDatasets.length === 0) newDatasets = [candidateDatasets[0]];
    setRequestedDatasets(newDatasets);
  };

  return (
    <>
      <SidebarSelect
        icon={BookImage}
        label="Master Plan"
        onChange={setMasterPlan}
        options={masterPlanOptions}
        value={masterPlan}
      />
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
        onChange={(value) => setRequestedDatasets([value])}
        options={variableOptions}
        value={datasets[0]}
        supp
      />
    </>
  );
}
