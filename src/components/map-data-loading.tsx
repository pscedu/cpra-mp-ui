import { useAtomValue } from "jotai";
import { mapTilesLoadingAtom } from "@/helpers/state";

import { CircleCheck, LoaderCircle } from "lucide-react";

export default function MapDataLoading() {
  const mapTilesLoading = useAtomValue(mapTilesLoadingAtom);

  return mapTilesLoading ? (
    <LoaderCircle className="animate-spin" />
  ) : (
    <CircleCheck />
  );
}
