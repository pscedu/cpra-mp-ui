import { usePortalState } from "@/helpers/state";
import { cn } from "@/lib/utils";

import RSelect from "@/components/ui/rselect";

export default function VisualizationSelect({
  className = "",
  menuPlacement = "auto",
}: {
  className?: string;
  menuPlacement?: "top" | "bottom" | "auto";
}) {
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
    <RSelect
      inputId="visualization"
      options={options}
      isMulti={false}
      menuPlacement={menuPlacement}
      isClearable={false}
      className={cn(`w-full ${className}`)}
      placeholder="Visualization type..."
      value={options.find((option) => option.value === visualizationType.value)}
      onChange={(selected) => (visualizationType.value = selected.value)}
    />
  );
}
