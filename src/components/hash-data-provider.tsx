import {
  fromHashEffect,
  getHashParams,
  updateHashEffect,
  useHydrateHashAtoms,
} from "@/helpers/hash";
import { useHydrateCatalogQueries } from "@/helpers/state";
import { useAtom } from "jotai";
import { ReactNode } from "react";
import DataProviderEffects from "@/components/data-provider-effects";

const initialHashParams = getHashParams();

export default function HashDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  useAtom(fromHashEffect);
  useAtom(updateHashEffect);
  useHydrateHashAtoms(initialHashParams);
  useHydrateCatalogQueries();
  return <DataProviderEffects>{children}</DataProviderEffects>;
}
