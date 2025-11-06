import { useAtomValue } from "jotai";
import {
  mapCatalogQueryAtom,
  structureAtom,
  visualizationTypeAtom,
} from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import { ChartLine } from "lucide-react";

export default function VisualizationSelect() {
  const structure = useAtomValue(structureAtom);
  const mapCatalogQuery = useAtomValue(mapCatalogQueryAtom);

  if (!structure || !mapCatalogQuery) return;

  const options = structure
    ? structure.visualizations
        .filter(
          (viz) =>
            viz.variables === null ||
            viz.variables.includes(mapCatalogQuery.dataset.variable.name),
        )
        .map((viz) => ({ label: viz.label, value: viz.name }))
    : [];

  return (
    <SidebarSelect
      label="visualization"
      options={options}
      signal={visualizationTypeAtom}
      icon={ChartLine}
    />
  );
}
