import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  analysisAtom,
  catalogQueriesAtom,
  mapPositionAtom,
  mapTilesLoadingAtom,
  selectedGeographiesAtom,
  mapOptionsAtom,
  maxSelectedGeographiesAtom,
} from "@/helpers/state";

import "maplibre-gl/dist/maplibre-gl.css";

import BaseMap from "@/components/base-map";

// Map using MapLibre GL.
export default function Map({ className = "" }: { className?: string }) {
  const maxSelectedGeographies = useAtomValue(maxSelectedGeographiesAtom);
  const analysis = useAtomValue(analysisAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const [selectedGeographies, setSelectedGeographies] = useAtom(
    selectedGeographiesAtom,
  );
  const [mapPosition, setMapPosition] = useAtom(mapPositionAtom);
  const setMapLoading = useSetAtom(mapTilesLoadingAtom);
  const mapOptions = useAtomValue(mapOptionsAtom);

  const styleUrl = mapCatalogQuery.getMapStyleUrl({
    analysis,
    mapOptions,
  });
  const gridLabel = mapCatalogQuery.dataset.grid.label.toLowerCase();
  const [z, y, x] = mapPosition;

  return (
    <BaseMap
      center={[x, y]}
      className={className}
      gridLabel={gridLabel}
      maxSelectedGeographies={maxSelectedGeographies}
      selectedGeographies={selectedGeographies}
      setMapLoading={setMapLoading}
      setMapPosition={setMapPosition}
      setSelectedGeographies={setSelectedGeographies}
      styleUrl={styleUrl}
      zoom={z}
    />
  );
}
