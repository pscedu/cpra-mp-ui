import { usePortalState } from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import { ChartLine } from "lucide-react";

export default function VisualizationSelect() {
  const { mapCatalogQuery, structure, visualizationType } = usePortalState();

  if (!structure.value || !mapCatalogQuery.value) return;

  const options = structure.value
    ? structure.value.visualizations
        .filter(
          (viz) =>
            viz.variables === null ||
            viz.variables.includes(mapCatalogQuery.value.dataset.variable.name),
        )
        .map((viz) => ({ label: viz.label, value: viz.name }))
    : [];

  return (
    <SidebarSelect
      label="visualization"
      options={options}
      signal={visualizationType}
      icon={ChartLine}
    />
  );
}
