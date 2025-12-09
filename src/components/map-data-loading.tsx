import { useAtomValue } from "jotai";
import {
  mapFeatureValuesLoadingAtom,
  mapTilesLoadingAtom,
} from "@/helpers/state";

import { CircleCheck, LoaderCircle } from "lucide-react";

export default function MapDataLoading() {
  const mapFeatureValuesLoading = useAtomValue(
    mapFeatureValuesLoadingAtom,
  );
  const mapTilesLoading = useAtomValue(mapTilesLoadingAtom);
  const dataLoading = mapFeatureValuesLoading || mapTilesLoading;

  return dataLoading ? (
    <LoaderCircle className="animate-spin" />
  ) : (
    <CircleCheck />
  );
}
