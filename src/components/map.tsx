import { useEffect, useRef } from "react";
import { Map as GLMap } from "maplibre-gl";
import { usePortalState } from "@/helpers/state";
import {
  getBaseStyle,
  projectLayers,
  rasterLayers,
  rasterSource,
  vectorLayers,
  vectorSource,
} from "@/helpers/mapstyle";
import { Dataset } from "@/helpers/structure";
import { getSelectionColor, sleep } from "../helpers/utils";

import "maplibre-gl/dist/maplibre-gl.css";

// Map using MapLibre GL.
export default function Map() {
  const {
    mapDataset,
    mapFeatureValues,
    mapPosition,
    mapTileUrl,
    mapTilesLoading,
    projectsYear,
    selectedGeographies,
    showProjects,
  } = usePortalState();

  const container = useRef(null);
  const map = useRef(null);
  const prevTileUrl = useRef(null);
  const prevDataset = useRef(null);
  const dataSourceIdx = useRef(0);
  const dataLayerIdx = useRef(0);

  const initMap = () => {
    const [z, y, x] = mapPosition.value;
    map.current = new GLMap({
      container: container.current,
      center: [x, y],
      style: getBaseStyle(),
      zoom: z,
    });

    map.current.on("data", () => (mapTilesLoading.value = true));
    map.current.on("idle", () => (mapTilesLoading.value = false));
    map.current.on("moveend", () => {
      const { lat, lng } = map.current.getCenter();
      mapPosition.value = [map.current.getZoom(), lat, lng];
    });
  };

  const addLayerClickHandlers = (layerId) => {
    // map.current.on("contextmenu", "geography-fill", (e) => {
    //   // Stop propagation of the click event so that it doesn't cause the context menu
    //   // to close.
    //   e.originalEvent.stopPropagation();
    //   contextMenu.value = {
    //     type: "geography-select",
    //     feature: e.features[0],
    //     x: e.originalEvent.clientX,
    //     y: e.originalEvent.clientY,
    //   };
    // });

    map.current.on("click", layerId, (e) => {
      if (e.features) {
        const geos = selectedGeographies.peek().slice();
        for (let feature of e.features) {
          let idx = geos.indexOf(feature.id);
          idx === -1 ? geos.push(feature.id) : geos.splice(idx, 1);
        }
        selectedGeographies.value = geos;
      }
    });
    map.current.on(
      "mousemove",
      layerId,
      () => (map.current.getCanvas().style.cursor = "pointer"),
    );
    map.current.on(
      "mouseleave",
      layerId,
      () => (map.current.getCanvas().style.cursor = ""),
    );
  };

  const getSourceId = () => `data-source-${dataSourceIdx.current}`;
  const getLayerId = () => `data-layer-${dataLayerIdx.current}`;

  const addSource = (tileUrl: string, dataset: Dataset) => {
    mapTilesLoading.value = true;
    dataSourceIdx.current++;
    const source = dataset.grid.isVector()
      ? vectorSource({ gridName: dataset.grid.name })
      : rasterSource({ tileUrls: [tileUrl] });
    map.current.addSource(getSourceId(), source);
  };

  const addLayers = (dataset: Dataset) => {
    dataLayerIdx.current++;
    const ids = {
      layerId: getLayerId(),
      sourceId: getSourceId(),
    };
    const layers = dataset.grid.isVector()
      ? vectorLayers({
          ...ids,
          legend: dataset.variable.legend,
        })
      : rasterLayers(ids);

    for (let layer of layers) {
      map.current.addLayer(layer, "levee");
      addLayerClickHandlers(layer.id);
    }
  };

  const cleanup = () => {
    const mapStyle = map.current.getStyle();
    for (let layer of mapStyle.layers)
      if (
        layer.id.startsWith("data-layer-") &&
        !(layer.id == getLayerId() || layer.id.startsWith(`${getLayerId()}-`))
      )
        map.current.removeLayer(layer.id);

    for (let sourceId of Object.keys(mapStyle.sources))
      if (sourceId.startsWith("data-source-") && sourceId !== getSourceId())
        map.current.removeSource(sourceId);
  };

  const scheduleCleanup = (dataset: Dataset) => {
    if (dataset.grid.isRaster()) map.current.once("idle", cleanup);
  };

  const updateStyle = () => {
    const tileUrl = mapTileUrl.value;
    const dataset = mapDataset.value;

    const tilesChanged = tileUrl !== prevTileUrl.current;
    const datasetChanged = dataset !== prevDataset.current;
    const legendChanged =
      !prevDataset.current ||
      dataset.variable.legend !== prevDataset.current.variable.legend;
    const gridChanged =
      prevDataset.current && dataset.grid !== prevDataset.current.grid;

    // We update the source when the dataset changes (even though the tile URL might
    // be the same) to make sure the feature state gets cleared.
    if (tilesChanged || datasetChanged) addSource(tileUrl, dataset);
    if (tilesChanged || legendChanged || datasetChanged) {
      addLayers(dataset);
      datasetChanged ? cleanup() : scheduleCleanup(dataset);
    }

    // Reset geography selection when the grid changes.
    if (gridChanged) selectedGeographies.value = [];

    prevTileUrl.current = tileUrl;
    prevDataset.current = mapDataset.value;
  };

  const updateProjectLayers = (show: boolean) => {
    const mapStyle = map.current.getStyle();
    for (let layer of mapStyle.layers)
      if (layer.id.startsWith("project-")) map.current.removeLayer(layer.id);

    if (show)
      for (let layer of projectLayers(
        ["<=", ["get", "year"], projectsYear.value - 2019],
        true,
      ))
        map.current.addLayer(layer, "label");
  };

  const updateFeatureState = () => {
    const sourceId = getSourceId();
    if (map.current.getSource(sourceId))
      for (let featureId in mapFeatureValues.value)
        if (featureId.match(/^[0-9]+$/)) {
          let geoIdx = selectedGeographies.value.indexOf(featureId);
          map.current.setFeatureState(
            {
              source: sourceId,
              sourceLayer: "boundary",
              id: featureId,
            },
            {
              selected: geoIdx >= 0 ? getSelectionColor(geoIdx) : null,
              value: mapFeatureValues.value[featureId],
            },
          );
        }
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
      const [z, y, x] = mapPosition.value;
      if (z.toFixed(2) != map.current.getZoom().toFixed(2))
        map.current.setZoom(z);
      const { lat, lng } = map.current.getCenter();
      if (y.toFixed(2) != lat.toFixed(2) || x.toFixed(2) != lng.toFixed(2))
        map.current.setCenter([x, y]);
    }
  }, [mapPosition.value]);

  // Update the map style.
  useEffect(() => {
    (async () => {
      if (!mapDataset.value || !mapTileUrl.value) return;
      await ensureStyleLoaded();
      updateStyle();
    })();
  }, [mapDataset.value, mapTileUrl.value]);

  // Update project layers.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      updateProjectLayers(showProjects.value);
    })();
  }, [showProjects.value, projectsYear.value]);

  // Update the map feature state when new data are loaded or the selection changes.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      updateFeatureState();
    })();
  }, [mapFeatureValues.value, selectedGeographies.value]);

  // Clean up the map before the component unloads.
  useEffect(() => {
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  return <div className="h-full rounded-xl overflow-hidden" ref={container} />;
}
