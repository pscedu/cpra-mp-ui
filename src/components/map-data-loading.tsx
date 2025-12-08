import { useAtomValue, useSetAtom, useAtom } from "jotai";
import * as atoms from "@/helpers/state";

import { CircleCheck, LoaderCircle } from "lucide-react";

export default function MapDataLoading() {
  // Atoms imported at top
  const dataLoading = mapFeatureValuesLoading || mapTilesLoading;

  return dataLoading ? (
    <LoaderCircle className="animate-spin" />
  ) : (
    <CircleCheck />
  );
}
