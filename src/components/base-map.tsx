import { Ref, useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as GLMap,
  Marker,
  LngLatLike,
  LngLat,
  MapMouseEvent,
  PointLike,
  RasterTileSource,
} from "maplibre-gl";
import { getSelectionColor, roundCoordinate, sleep } from "@/helpers/utils";
import { Coordinate, Geography } from "@/helpers/types";
import { GeographySelection, isCoordinate } from "@/helpers/selection";
import { CPRAMapLegendControl } from "@/plugins/map-legend";

import "@/plugins/map-legend.css";

import BaseMapContextMenu, {
  ContextMenuTarget,
} from "@/components/base-map-context-menu";

// Map using MapLibre GL.
export default function BaseMap({
  center = [-91.5, 29.75],
  className = "",
  gridLabel = "area",
  maxSelectedGeographies = 10,
  selectedGeographies = [],
  setMapLoading = () => {},
  setMapPosition = () => {},
  setSelectedGeographies = () => {},
  styleUrl,
  zoom = 8,
}: {
  center?: LngLatLike;
  className?: string;
  gridLabel?: string;
  maxSelectedGeographies?: number;
  selectedGeographies?: Geography[];
  setMapLoading?: (loading: boolean) => void;
  setMapPosition?: (position: [number, number, number]) => void;
  setSelectedGeographies?: (geographies: Geography[]) => void;
  styleUrl: string;
  zoom?: number;
}) {
  const container = useRef(null);
  const map = useRef<GLMap | null>(null);
  const markers: Ref<Marker[]> = useRef([]);
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null);

  // The colors last published to the map style, so that recomputing them on
  // every idle frame does not repaint the map when nothing has changed.
  const publishedColors = useRef<string | null>(null);

  const [contextMenuTarget, setContextMenuTarget] =
    useState<ContextMenuTarget | null>(null);

  const selection = new GeographySelection(selectedGeographies);
  const setSelection = (newSelection: GeographySelection) =>
    setSelectedGeographies(newSelection.geographies);

  const selectionRef = useRef(selection);

  useEffect(() => {
    selectionRef.current = new GeographySelection(selectedGeographies);
  }, [selectedGeographies]);

  const selectionColorOptions = {
    count: maxSelectedGeographies || 10,
  };

  const isRasterGrid = () => map.current?.getSource("data")?.type === "raster";

  // Find the vector grid cell rendered at a point on the screen, if any. Only
  // meaningful on vector grids, which are the only ones with these layers.
  const getCellId = (point: PointLike) => {
    // Cells are looked up while the style is in flux, so only the layers the
    // style currently has are queried.
    const layers = ["fill", "line", "selected", "label"]
      .map((suffix) => `data-layer-${suffix}`)
      .filter((id) => map.current?.getLayer(id));
    if (!layers.length) return;
    const features =
      map.current?.queryRenderedFeatures(point, { layers }) || [];
    return features.length ? (features[0].id as number) : undefined;
  };

  // Get the coordinate for a map event, if it lands somewhere selectable. Both
  // grid types are selected by coordinate; the grid type only determines how a
  // click is tested against the data.
  const getCoordinate = (e: MapMouseEvent): Coordinate | undefined => {
    const source = map.current?.getSource("data");
    if (!source) return;
    const { lngLat } = e;
    if (source.type === "raster") {
      const bounds = new LngLatBounds((source as RasterTileSource).bounds);
      if (bounds.isEmpty() || !bounds.contains(lngLat)) return;
    } else if (getCellId(e.point) === undefined) return;
    return roundCoordinate([lngLat.lng, lngLat.lat]);
  };

  const openContextMenu = (
    target: ContextMenuTarget,
    e: MouseEvent | MapMouseEvent,
  ) => {
    setContextMenuTarget(target);
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
      const coordinate = getCoordinate(e);
      if (coordinate) setSelection(selectionRef.current.add(coordinate));
    });
    glMap.on("contextmenu", (e) => {
      const coordinate = getCoordinate(e);
      if (coordinate) openContextMenu({ coordinate, index: -1 }, e);
    });
    glMap.on("mousemove", (e) => {
      glMap.getCanvas().style.cursor = getCoordinate(e) ? "pointer" : "";
    });
    glMap.on("data", () => setMapLoading(true));
    glMap.on("idle", () => {
      setMapLoading(false);
      // Cells are resolved from the tiles currently rendered, so the colors are
      // recomputed once panning or zooming has brought new ones into view.
      updateSelectionColors();
    });
    glMap.on("moveend", () => {
      const { lng, lat } = glMap.getCenter();
      const zoom = glMap.getZoom();
      setMapPosition([zoom, lat, lng]);
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
    // Legacy cell IDs have no coordinate to place a pin at, so they are skipped
    // while keeping the colors tied to each geography's place in the selection.
    markers.current = sel.geographies.flatMap((geo, i) => {
      if (!isCoordinate(geo)) return [];
      const marker = new Marker({
        color: getSelectionColor(i, selectionColorOptions),
        draggable: true,
      })
        .setLngLat(geo)
        .addTo(map.current as GLMap);
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        setSelection(sel.replace(i, roundCoordinate([lng, lat])));
      });
      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        setSelection(sel.remove(i));
      });
      marker
        .getElement()
        .addEventListener("contextmenu", (e) =>
          openContextMenu({ coordinate: geo, index: i }, e),
        );
      return [marker];
    });
  };

  // Publish the color of each selected grid cell for the map style to draw its
  // outline with. Vector grids are selected by coordinate just like raster
  // grids, so the cell under each pin has to be looked up; where several pins
  // share a cell, the first of them gives the cell its color.
  const updateSelectionColors = () => {
    const glMap = map.current;
    if (!glMap || isRasterGrid()) return;
    const selectionColors: Record<number, string> = {};
    selectionRef.current.geographies.forEach((geo, i) => {
      const cellId = isCoordinate(geo) ? getCellId(glMap.project(geo)) : geo;
      if (cellId === undefined || cellId in selectionColors) return;
      selectionColors[cellId] = getSelectionColor(i, selectionColorOptions);
    });
    const serialized = JSON.stringify(selectionColors);
    if (serialized === publishedColors.current) return;
    publishedColors.current = serialized;
    glMap.setGlobalStateProperty("selectionColors", selectionColors);
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
  }, []);

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
      setMapLoading(true);
      await ensureStyleLoaded();
      // A new style starts with empty global state, so the colors have to be
      // published to it again.
      publishedColors.current = null;
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
    <BaseMapContextMenu
      className={className}
      gridLabel={gridLabel}
      maxSelectedGeographies={maxSelectedGeographies}
      selection={selection}
      setSelection={setSelection}
      setTarget={setContextMenuTarget}
      target={contextMenuTarget}
      triggerRef={contextMenuTriggerRef}
    >
      <div className={className} ref={container} />
    </BaseMapContextMenu>
  );
}
