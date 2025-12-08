import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import { ChartLine } from "lucide-react";

export default function VisualizationSelect() {
  // Atoms imported at top

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
      label="Chart"
      options={options}
      signal={visualizationType}
      icon={ChartLine}
    />
  );
}
