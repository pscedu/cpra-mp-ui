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
import { resolveGeographyIds } from "@/helpers/geography";
import { GeographySelection, isCoordinate } from "@/helpers/selection";
import { Grid } from "@/helpers/structure";
import { CPRAMapLegendControl } from "@/plugins/map-legend";

import "@/plugins/map-legend.css";

import BaseMapContextMenu, {
  ContextMenuTarget,
} from "@/components/base-map-context-menu";

// Map using MapLibre GL.
export default function BaseMap({
  center = [-91.5, 29.75],
  className = "",
  grid,
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
  // The grid the style draws. Selected cells are outlined only when it is given,
  // since it is what says which grid a selection coordinate is to be resolved on.
  grid?: Grid;
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

  const [contextMenuTarget, setContextMenuTarget] =
    useState<ContextMenuTarget | null>(null);

  const selection = new GeographySelection(selectedGeographies);
  const setSelection = (newSelection: GeographySelection) =>
    setSelectedGeographies(newSelection.geographies);

  const selectionRef = useRef(selection);
  // Read by the map's own event handlers, which are registered once and would
  // otherwise keep looking a selection up on whichever grid was current when the
  // map was created.
  const gridRef = useRef(grid);

  useEffect(() => {
    selectionRef.current = new GeographySelection(selectedGeographies);
  }, [selectedGeographies]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const selectionColorOptions = {
    count: maxSelectedGeographies || 10,
  };

  // Find the vector grid cell rendered at a point on the screen, if any. Only
  // meaningful on vector grids, which are the only ones with these layers, and
  // only for testing where an interaction landed — a pointer is always over
  // tiles that have been drawn, which a selected geography need not be.
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
    glMap.on("idle", () => setMapLoading(false));
    glMap.on("moveend", () => {
      const { lng, lat } = glMap.getCenter();
      const zoom = glMap.getZoom();
      setMapPosition([zoom, lat, lng]);
    });
    glMap.on("styledata", () => {
      updateMarkers();
      updateSelectionColors();
    });
    // Publishing again once a style is in place, since loading one resets the
    // global state the selection colors live in. A style that differs from the
    // one before it only in the colors baked into that state — which is every
    // style a vector grid draws, whose tiles don't change with the data — is
    // applied without any `styledata` of its own to publish on.
    glMap.on("style.load", () => updateSelectionColors());
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
  //
  // The lookup is the API's, not the rendered tiles': a selection restored with
  // the map, or one made somewhere the map has since been panned away from, has
  // no drawn feature to ask, and the cells it names would otherwise go
  // unmarked.
  const updateSelectionColors = async () => {
    const glMap = map.current;
    const selectionGrid = gridRef.current;
    if (!glMap || !selectionGrid?.isVector()) return;
    const { geographies } = selectionRef.current;
    const cellIds = await resolveGeographyIds(selectionGrid, geographies);
    // The selection can be edited, or the map torn down, while its cells are
    // being looked up; either way the colors this call would publish are no
    // longer the ones to draw.
    if (
      map.current !== glMap ||
      selectionRef.current.geographies !== geographies
    )
      return;
    const selectionColors: Record<number, string> = {};
    cellIds.forEach((cellId, i) => {
      if (cellId === undefined || cellId in selectionColors) return;
      selectionColors[cellId] = getSelectionColor(i, selectionColorOptions);
    });
    // Compared against the colors the map is holding rather than against the
    // ones last published to it, so that publishing again is skipped only while
    // they are still there to draw with. Loading a style resets the global state
    // to what its own spec declares, which is no colors at all, and a record of
    // what was published would go on reporting the colors that reset dropped.
    if (
      JSON.stringify(glMap.getGlobalState().selectionColors) ===
      JSON.stringify(selectionColors)
    )
      return;
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
  }, [grid, selectedGeographies, maxSelectedGeographies]);

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
