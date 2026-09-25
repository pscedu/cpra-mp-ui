import { useAtomValue } from "jotai";
import {
  catalogQueriesAtom,
  derivedAnalysisAtom,
  structureAtom,
} from "@/helpers/state";

import DimensionSelect from "@/components/dimension-select";

export default function DimensionsSelect() {
  const catalogQueries = useAtomValue(catalogQueriesAtom);
  const structure = useAtomValue(structureAtom);
  const derivedAnalysis = useAtomValue(derivedAnalysisAtom);

  // Dimensions the selected derived variable already subsumes are neither
  // filterable nor difference-able (§4.4) -- they're fixed/collapsed
  // server-side by the analysis itself, so offering a picker for one here
  // would just produce a request `getQueryParams` already strips the value
  // back out of.
  const subsumedDimensions = structure?.subsumedFor(derivedAnalysis) ?? [];

  return catalogQueries.activeDimensions
    .filter(
      (dim) =>
        dim.filterType === "select" && !subsumedDimensions.includes(dim.name),
    )
    .map((dimension) => <DimensionSelect key={dimension.name} name={dimension.name} />);
}
