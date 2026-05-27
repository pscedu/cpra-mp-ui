import { hashAtoms } from "@/helpers/hash";
import { useHydrateAtoms } from "jotai/utils";
import { ReactNode } from "react";

import { ScopeProvider } from "jotai-scope";
import {
  analysisAtom,
  catalogQueriesAtom,
  dataPermalinkAtom,
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
  setExecutedCatalogQueriesAtom,
  setRequestedDatasetsAtom,
  startDateAtom,
  visualizationAtom,
  visualizationTypeAtom,
} from "@/helpers/state";
import DataProviderEffects from "@/components/data-provider-effects";

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
        dataPermalinkAtom,
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
        setExecutedCatalogQueriesAtom,
        setRequestedDatasetsAtom,
        startDateAtom,
        visualizationAtom,
        visualizationTypeAtom,
      ]}
    >
      <ScopeHydrate {...props}>
        <DataProviderEffects>{children}</DataProviderEffects>
      </ScopeHydrate>
    </ScopeProvider>
  );
}
