import { useEffect, useRef } from "preact/hooks";
import { Map as GLMap } from "maplibre-gl";
import { usePortalState } from "../helpers/state";
import {
  getBaseStyle,
  rasterLayers,
  rasterSource,
  vectorLayers,
  vectorSource,
} from "../helpers/mapstyle";
import { Dataset } from "../helpers/structure";
import { sleep } from "../helpers/utils";

import style from "./map.module.css";
import "maplibre-gl/dist/maplibre-gl.css";

// Map using MapLibre GL.
export default function Map() {
  const { mapDataset, mapFeatureValues, mapTileUrl, mapTilesLoading } =
    usePortalState();

  const container = useRef(null);
  const map = useRef(null);
  const prevTileUrl = useRef(null);
  const prevDataset = useRef(null);
  const dataSourceIdx = useRef(0);
  const dataLayerIdx = useRef(0);

  const initMap = () => {
    map.current = new GLMap({
      container: container.current,
      center: [-91.5, 29.75],
      hash: "map",
      style: getBaseStyle(),
      zoom: 8,
    });

    map.current.on("data", () => (mapTilesLoading.value = true));
    map.current.on("idle", () => (mapTilesLoading.value = false));
  };

  const addLayerClickHandlers = (layerId) => {
    // map.current.on("data", () => {});

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

    // map.current.on("click", "geography-fill", (e) => {
    //   if (e.features) {
    //     const newGeographies = geographies.peek().slice();
    //     for (let feature of e.features) {
    //       let idx = newGeographies.indexOf(feature.id);
    //       idx === -1
    //         ? newGeographies.push(feature.id)
    //         : newGeographies.splice(idx, 1);
    //     }
    //     geographies.value = newGeographies;
    //   }
    // });
    map.current.on(
      "mousemove",
      layerId,
      () => (map.current.getCanvas().style.cursor = "pointer")
    );
    map.current.on(
      "mouseleave",
      layerId,
      () => (map.current.getCanvas().style.cursor = "")
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

    for (let layer of layers) map.current.addLayer(layer, "levee");
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
    // console.log("update style", tileUrl, dataset);

    const tilesChanged = tileUrl !== prevTileUrl.current;
    const datasetChanged = dataset !== prevDataset.current;
    const legendChanged =
      !prevDataset.current ||
      dataset.variable.legend !== prevDataset.current.variable.legend;

    // We update the source when the dataset changes (even though the tile URL might
    // be the same) to make sure the feature state gets cleared.
    if (tilesChanged || datasetChanged) addSource(tileUrl, dataset);
    if (tilesChanged || legendChanged || datasetChanged) {
      addLayers(dataset);
      datasetChanged ? cleanup() : scheduleCleanup(dataset);
    }

    prevTileUrl.current = tileUrl;
    prevDataset.current = mapDataset.value;
  };

  const updateFeatureValues = () => {
    const featureValues = mapFeatureValues.value;
    const sourceId = getSourceId();
    if (map.current.getSource(sourceId))
      for (let featureId in featureValues)
        if (featureId.match(/^[0-9]+$/))
          map.current.setFeatureState(
            {
              source: sourceId,
              sourceLayer: "boundary",
              id: parseInt(featureId),
            },
            { value: featureValues[featureId] }
          );
  };

  const ensureStyleLoaded = async () => {
    while (!map.current || !map.current.isStyleLoaded()) await sleep(100);
  };

  // Initialize the map.
  useEffect(() => {
    if (container.current && !map.current) initMap();
  }, [container.current]);

  // Update the map style.
  useEffect(() => {
    (async () => {
      if (!mapDataset.value || !mapTileUrl.value) return;
      await ensureStyleLoaded();
      updateStyle();
    })();
  }, [mapDataset.value, mapTileUrl.value]);

  // Update the map feature state when new data are loaded.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      updateFeatureValues();
    })();
  }, [mapFeatureValues.value]);

  // Clean up the map before the component unloads.
  useEffect(() => {
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  return (
    <div class={style.mapContainer}>
      <div class={style.map} ref={container} />
    </div>
  );
}
