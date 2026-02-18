import { Ref, useEffect, useRef } from "react";
import { LngLatBounds, Map as GLMap, Marker } from "maplibre-gl";
import { useAtomValue, useSetAtom } from "jotai";
import {
  analysisAtom,
  contextMenuAtom,
  catalogQueriesAtom,
  mapPositionAtom,
  mapTilesLoadingAtom,
  selectedGeographiesAtom,
  mapOptionsAtom,
  updateSelectedGeographyAtom,
  toggleGeographySelectedAtom,
  handleMapKeyPressAtom,
  maxSelectedGeographiesAtom,
} from "@/helpers/state";

import { getSelectionColor, sleep } from "../helpers/utils";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/plugins/map-legend.css";
import { CPRAMapLegendControl } from "@/plugins/map-legend";

// Map using MapLibre GL.
export default function Map() {
  const maxSelectedGeographies = useAtomValue(maxSelectedGeographiesAtom);
  const analysis = useAtomValue(analysisAtom);
  const mapCatalogQuery = useAtomValue(catalogQueriesAtom).getMapCatalogQuery();
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const handleMapKeyPress = useSetAtom(handleMapKeyPressAtom);
  const updateSelectedGeography = useSetAtom(updateSelectedGeographyAtom);
  const toggleGeographySelected = useSetAtom(toggleGeographySelectedAtom);
  const setContextMenu = useSetAtom(contextMenuAtom);
  const mapPosition = useAtomValue(mapPositionAtom);
  const setMapPosition = useSetAtom(mapPositionAtom);
  const setMapTilesLoading = useSetAtom(mapTilesLoadingAtom);
  const mapOptions = useAtomValue(mapOptionsAtom);

  const container = useRef(null);
  const map = useRef<GLMap | null>(null);
  const markers: Ref<Marker[]> = useRef([]);

  const selectedGeographiesRef = useRef(selectedGeographies);

  useEffect(() => {
    selectedGeographiesRef.current = selectedGeographies;
  }, [selectedGeographies]);

  const selectionColorOptions = {
    count: maxSelectedGeographies || 10,
  };

  const styleUrl = mapCatalogQuery.getMapStyleUrl({
    analysis,
    mapOptions,
  });

  const getGeography = (e) => {
    const source = map.current.getSource("data");
    if (!source) return;
    if (source.type === "raster") {
      const { lngLat } = e;
      const { lng, lat } = lngLat;

      const bounds = new LngLatBounds(source.bounds);
      if (bounds.contains(lngLat)) return [lng.toFixed(5), lat.toFixed(5)];
    } else {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["fill", "line", "selected", "label"].map(
          (suffix) => `data-layer-${suffix}`,
        ),
      });
      if (features.length) return features[0].id;
    }
  };
  const openContextMenu = (geo: any, e: any) => {
    setContextMenu({
      type: "geography-select",
      geography: geo,
      x: (e.originalEvent || e).clientX,
      y: (e.originalEvent || e).clientY,
    });
  };

  const initMap = () => {
    const [z, y, x] = mapPosition;
    const glMap = new GLMap({
      container: container.current,
      center: [x, y],
      style: styleUrl,
      zoom: z,
    });
    glMap.addControl(new CPRAMapLegendControl());

    glMap.on("click", (e) => {
      const geo = getGeography(e);
      if (geo) toggleGeographySelected(geo);
    });
    glMap.on("contextmenu", (e) => {
      const geo = getGeography(e);
      if (geo) openContextMenu(geo, e);
    });
    glMap.on("mousemove", (e) => {
      const geo = getGeography(e);
      glMap.getCanvas().style.cursor = geo ? "pointer" : "";
    });
    glMap.on("data", () => setMapTilesLoading(true));
    glMap.on("idle", () => setMapTilesLoading(false));
    glMap.on("moveend", () => {
      const { lat, lng } = glMap.getCenter();
      setMapPosition([glMap.getZoom(), lat, lng]);
    });
    glMap.on("styledata", () => {
      updateMarkers();
      updateSelectionColors();
    });
    glMap.dragRotate.disable();
    map.current = glMap;
    window.glMap = glMap;
  };

  const updateMarkers = () => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = selectedGeographiesRef.current
      .filter((geo) => Array.isArray(geo))
      .map((geo, i) => {
        const marker = new Marker({
          color: getSelectionColor(i, selectionColorOptions),
          draggable: true,
        })
          .setLngLat(geo)
          .addTo(map.current);
        marker.on("dragend", () => {
          const { lng, lat } = marker.getLngLat();
          updateSelectedGeography(i, [lng, lat]);
        });
        marker.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          toggleGeographySelected(geo);
        });
        marker
          .getElement()
          .addEventListener("contextmenu", (e) => openContextMenu(geo, e));
        return marker;
      });
  };

  const updateSelectionColors = () => {
    const selectionColors = {};
    selectedGeographiesRef.current
      .filter((geo) => !Array.isArray(geo))
      .forEach(
        (geo, i) =>
          (selectionColors[geo] = getSelectionColor(i, selectionColorOptions)),
      );
    map.current?.setGlobalStateProperty("selectionColors", selectionColors);
  };

  const ensureStyleLoaded = async () => {
    while (!map.current || !map.current.isStyleLoaded()) await sleep(100);
  };

  // Initialize the map.
  useEffect(() => {
    if (container.current && !map.current) initMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [container.current]);

  // Update the map position when the signal changes.
  useEffect(() => {
    if (map.current) {
      const [z, y, x] = mapPosition;
      if (z.toFixed(2) != map.current.getZoom().toFixed(2))
        map.current.setZoom(z);
      const { lat, lng } = map.current.getCenter();
      if (y.toFixed(2) != lat.toFixed(2) || x.toFixed(2) != lng.toFixed(2))
        map.current.setCenter([x, y]);
    }
  }, [mapPosition]);

  // Update the map style.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      if (map.current) map.current.setStyle(styleUrl);
    })();
  }, [styleUrl]);

  // Update the map feature state when new data are loaded or the selection changes.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      updateMarkers();
      updateSelectionColors();
    })();
  }, [selectedGeographies, maxSelectedGeographies]);

  // Clean up the map before the component unloads.
  useEffect(() => {
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // Add listeners for selection key combinations.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      (async () => await handleMapKeyPress(e))();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <div className="h-full rounded-xl overflow-hidden" ref={container} />;
}
