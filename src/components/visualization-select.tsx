import { useAtom, useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  derivedAnalysisAtom,
  structureAtom,
  visualizationTypeAtom,
} from "@/helpers/state";

import SidebarSelect from "@/components/sidebar-select";
import { ChartLine } from "lucide-react";

export default function VisualizationSelect() {
  const structure = useAtomValue(structureAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const derivedAnalysis = useAtomValue(derivedAnalysisAtom);
  const [visualizationType, setVisualizationType] = useAtom(
    visualizationTypeAtom,
  );

  if (!structure || !mapCatalogQuery) return;

  // `Structure.offeredVisualizations` is the whole rule, and it lives there rather
  // than here so that `probe.ts` can fetch exactly the spec URLs a reader could ask
  // for without re-implementing the predicate. Notably, a derived analysis that
  // folds the time column away leaves nothing for a chart to plot against and the
  // spec route rejects the pair outright -- so the chart is not offered rather than
  // offered and then failed, and for such an analysis this list comes back empty.
  const options = structure
    .offeredVisualizations(derivedAnalysis, mapCatalogQuery?.dataset.variable.name)
    .map((viz) => ({ label: viz.label, value: viz.name }));

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
