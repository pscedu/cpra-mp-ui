import { Ref, useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as GLMap,
  Marker,
  LngLatLike,
  LngLat,
  MapMouseEvent,
  RasterTileSource,
} from "maplibre-gl";
import { getSelectionColor, sleep } from "@/helpers/utils";
import { Geography } from "@/helpers/types";
import { GeographySelection } from "@/helpers/selection";
import { CPRAMapLegendControl } from "@/plugins/map-legend";

import "@/plugins/map-legend.css";

import MapContextMenu from "@/components/visualization/map-context-menu";

// Map using MapLibre GL.
export default function Map<G extends Geography>({
  center = [-91.5, 29.75],
  maxSelectedGeographies = 10,
  selectedGeographies = [],
  setCenter = () => {},
  setMapLoading = () => {},
  setSelectedGeographies = () => {},
  setZoom = () => {},
  styleUrl,
  zoom = 8,
}: {
  center?: LngLatLike;
  maxSelectedGeographies?: number;
  selectedGeographies?: G[];
  setCenter?: (center: [number, number]) => void;
  setMapLoading?: (loading: boolean) => void;
  setSelectedGeographies?: (geographies: G[]) => void;
  setZoom?: (zoom: number) => void;
  styleUrl: string;
  zoom?: number;
}) {
  const container = useRef(null);
  const map = useRef<GLMap | null>(null);
  const markers: Ref<Marker[]> = useRef([]);
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null);

  const [contextMenuGeography, setContextMenuGeography] = useState<G | null>(
    null,
  );

  const selection = new GeographySelection(selectedGeographies);
  const setSelection = (newSelection: GeographySelection<G>) =>
    setSelectedGeographies(newSelection.geographies);

  const selectionRef = useRef(selection);

  useEffect(() => {
    selectionRef.current = new GeographySelection(selectedGeographies);
  }, [selectedGeographies]);

  const selectionColorOptions = {
    count: maxSelectedGeographies || 10,
  };

  const getGeography = (e: MapMouseEvent) => {
    const source = map.current?.getSource("data");
    if (!source) return;
    if (source.type === "raster") {
      const { lngLat } = e;
      const { lng, lat } = lngLat;

      const bounds = new LngLatBounds((source as RasterTileSource).bounds);
      if (bounds.contains(lngLat))
        return [lng.toFixed(5), lat.toFixed(5)] as unknown as G;
    } else {
      const features =
        map.current?.queryRenderedFeatures(e.point, {
          layers: ["fill", "line", "selected", "label"].map(
            (suffix) => `data-layer-${suffix}`,
          ),
        }) || [];
      if (features.length) return features[0].id as G;
    }
  };

  const openContextMenu = (geo: G, e: MouseEvent | MapMouseEvent) => {
    setContextMenuGeography(geo);
    const event = "originalEvent" in e ? e.originalEvent : e;
    contextMenuTriggerRef.current?.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );
  };

  const initMap = () => {
    if (!container.current) return;
    const glMap = new GLMap({
      container: container.current,
      center,
      style: styleUrl,
      zoom,
    });
    glMap.addControl(new CPRAMapLegendControl());

    glMap.on("click", (e) => {
      const geo = getGeography(e);
      if (geo) setSelection(selectionRef.current.toggle(geo));
    });
    glMap.on("contextmenu", (e) => {
      const geo = getGeography(e);
      if (geo) openContextMenu(geo, e);
    });
    glMap.on("mousemove", (e) => {
      const geo = getGeography(e);
      glMap.getCanvas().style.cursor = geo ? "pointer" : "";
    });
    glMap.on("data", () => setMapLoading(true));
    glMap.on("idle", () => setMapLoading(false));
    glMap.on("moveend", () => {
      const { lng, lat } = glMap.getCenter();
      setZoom(glMap.getZoom());
      setCenter([lng, lat]);
    });
    glMap.on("styledata", () => {
      updateMarkers();
      updateSelectionColors();
    });
    glMap.dragRotate.disable();
    map.current = glMap;
  };

  const updateMarkers = () => {
    const sel = selectionRef.current;
    markers.current?.forEach((marker) => marker.remove());
    markers.current = sel.geographies
      .filter((geo) => Array.isArray(geo))
      .map((geo, i) => {
        const marker = new Marker({
          color: getSelectionColor(i, selectionColorOptions),
          draggable: true,
        })
          .setLngLat(geo as [number, number])
          .addTo(map.current as GLMap);
        marker.on("dragend", () => {
          const { lng, lat } = marker.getLngLat();
          setSelection(sel.replace(i, [lng, lat] as G));
        });
        marker.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          setSelection(sel.toggle(geo));
        });
        marker
          .getElement()
          .addEventListener("contextmenu", (e) => openContextMenu(geo, e));
        return marker;
      });
  };

  const updateSelectionColors = () => {
    const selectionColors: Record<number, string> = {};
    selectionRef.current.geographies
      .filter((geo) => !Array.isArray(geo))
      .forEach(
        (geo, i) =>
          (selectionColors[geo as number] = getSelectionColor(
            i,
            selectionColorOptions,
          )),
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

  // Update the map position.
  useEffect(() => {
    if (map.current && zoom.toFixed(2) != map.current.getZoom().toFixed(2))
      map.current.setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (map.current) {
      const { lat, lng } = map.current.getCenter();
      const coords = LngLat.convert(center);
      if (
        coords.lat.toFixed(2) != lat.toFixed(2) ||
        coords.lng.toFixed(2) != lng.toFixed(2)
      )
        map.current.setCenter(center);
    }
  }, [center]);

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
      if (e.ctrlKey) {
        const selectionCount = selectionRef.current.length;
        let offset = 0;
        if (selectionCount) {
          if (e.key === "ArrowLeft") offset = -1;
          else if (e.key === "ArrowRight") offset = 1;
        }
        if (selectionCount > maxSelectedGeographies) {
          if (e.key === "ArrowUp") offset = -1 * maxSelectedGeographies;
          else if (e.key === "ArrowDown") offset = maxSelectedGeographies;
        }
        if (offset !== 0) setSelection(selectionRef.current.rotate(offset));
      } else if (e.key === "Escape") {
        setSelection(new GeographySelection([]));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [maxSelectedGeographies]);

  return (
    <MapContextMenu
      geography={contextMenuGeography}
      map={map.current}
      maxSelectedGeographies={maxSelectedGeographies}
      selection={selection}
      setGeography={setContextMenuGeography}
      setSelection={setSelection}
      triggerRef={contextMenuTriggerRef}
    >
      <div className="h-full rounded-xl overflow-hidden" ref={container} />
    </MapContextMenu>
  );
}
