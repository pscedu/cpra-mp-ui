import { usePortalState } from "@/helpers/state";

import { CircleCheck, LoaderCircle } from "lucide-react";

export default function MapDataLoading() {
  const { mapFeatureValuesLoading, mapTilesLoading } = usePortalState();
  const dataLoading = mapFeatureValuesLoading.value || mapTilesLoading.value;

  return dataLoading ? (
    <LoaderCircle className="animate-spin" />
  ) : (
    <CircleCheck />
  );
}
