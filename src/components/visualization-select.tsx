import { useAtom, useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  structureAtom,
  visualizationTypeAtom,
} from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import { ChartLine } from "lucide-react";

export default function VisualizationSelect() {
  const structure = useAtomValue(structureAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const [visualizationType, setVisualizationType] = useAtom(
    visualizationTypeAtom,
  );

  if (!structure || !mapCatalogQuery) return;

  const options = structure
    ? structure?.visualizations
        .filter(
          (viz) =>
            viz.variables === null ||
            viz.variables.includes(mapCatalogQuery?.dataset.variable.name),
        )
        .map((viz) => ({ label: viz.label, value: viz.name }))
    : [];

  return (
    <SidebarSelect
      id="visualization-type"
      label="Chart"
      options={options}
      value={visualizationType}
      onChange={setVisualizationType}
      icon={ChartLine}
    />
  );
}
