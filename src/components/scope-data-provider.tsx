import { hashAtoms } from "@/helpers/hash";
import { useHydrateAtoms } from "jotai/utils";
import { ReactNode } from "react";

import { ScopeProvider } from "jotai-scope";
import {
  analysisAtom,
  catalogQueriesAtom,
  endDateAtom,
  initialCatalogQueriesAtom,
  mapOptionsAtom,
  mapPositionAtom,
  mapTilesLoadingAtom,
  maxSelectedGeographiesAtom,
  requestedDatasetsAtom,
  requestedFiltersAtom,
  requestedTimeValuesAtom,
  selectedGeographiesAtom,
  startDateAtom,
  visualizationTypeAtom,
} from "@/helpers/state";

export function ScopeHydrate({ children, ...props }: { children: ReactNode }) {
  const params = new URLSearchParams(props);
  const initialValues = hashAtoms.flatMap((config) =>
    config.fromHash ? [[config.atom, config.fromHash(params)]] : [],
  );
  useHydrateAtoms(initialValues);
  return children;
}

export default function ScopeDataProvider({
  children,
  ...props
}: {
  children: ReactNode;
}) {
  return (
    <ScopeProvider
      atoms={[
        analysisAtom,
        catalogQueriesAtom,
        endDateAtom,
        initialCatalogQueriesAtom,
        mapOptionsAtom,
        mapPositionAtom,
        mapTilesLoadingAtom,
        maxSelectedGeographiesAtom,
        requestedDatasetsAtom,
        requestedFiltersAtom,
        requestedTimeValuesAtom,
        selectedGeographiesAtom,
        startDateAtom,
        visualizationTypeAtom,
      ]}
    >
      <ScopeHydrate {...props}>{children}</ScopeHydrate>
    </ScopeProvider>
  );
}
