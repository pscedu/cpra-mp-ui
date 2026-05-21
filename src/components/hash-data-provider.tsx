import {
  fromHashEffect,
  getHashParams,
  hashAtoms,
  updateHashEffect,
} from "@/helpers/hash";
import { useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
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

  const initialValues = hashAtoms.flatMap((config) =>
    config.fromHash ? [[config.atom, config.fromHash(initialHashParams)]] : [],
  );
  useHydrateAtoms(initialValues);
  return <DataProviderEffects>{children}</DataProviderEffects>;
}
