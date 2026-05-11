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

import Map from "@/components/visualization/map";

// Map using MapLibre GL.
export default function GlobalMap() {
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

  const [z, y, x] = mapPosition;

  const setCenter = (center: [number, number]) => {
    const [lng, lat] = center;
    setMapPosition([z, lat, lng]);
  };

  const setZoom = (zoom: number) => {
    setMapPosition([zoom, y, x]);
  };

  return (
    <Map
      center={[x, y]}
      maxSelectedGeographies={maxSelectedGeographies}
      selectedGeographies={selectedGeographies}
      setCenter={setCenter}
      setMapLoading={setMapLoading}
      setSelectedGeographies={setSelectedGeographies}
      setZoom={setZoom}
      styleUrl={styleUrl}
      zoom={z}
    />
  );
}
