import { useAtomValue } from "jotai";
import { catalogQueriesAtom } from "@/helpers/state";

import DimensionSelect from "@/components/dimension-select";

export default function DimensionsSelect() {
  const catalogQueries = useAtomValue(catalogQueriesAtom);

  return catalogQueries.activeDimensions
    .filter((dim) => dim.filterType === "select")
    .map((dimension) => <DimensionSelect key={dimension.name} name={dimension.name} />);
}
