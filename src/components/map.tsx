import { Ref, useEffect, useRef } from "react";
import { LngLatBounds, Map as GLMap, Marker } from "maplibre-gl";
import { usePortalState } from "@/helpers/state";
import {
  differenceRasterSource,
  getBaseStyle,
  projectLayers,
  projectsSource,
  rasterLayers,
  rasterSource,
  vectorLayers,
  vectorSource,
} from "@/helpers/mapstyle";
import { Dataset } from "@/helpers/structure";
import { getSelectionColor, sleep } from "../helpers/utils";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/plugins/map-legend.css";
import { CPRAMapLegendControl } from "@/plugins/map-legend";

// Map using MapLibre GL.
export default function Map() {
  const {
    analysis,
    contextMenu,
    mapCatalogQuery,
    mapFeatureValues,
    mapPosition,
    mapTileUrl,
    mapTilesLoading,
    projectsModelGroup,
    projectsYear,
    rotateSelectedGeographies,
    selectedGeographies,
    showGridLabels,
    showGridLines,
    showProjects,
    showWater,
    structure,
    visualization,
  } = usePortalState();

  const container = useRef(null);
  const map = useRef(null);
  const prevTileUrl = useRef(null);
  const prevDataset = useRef(null);
  const prevAnalysisOperation = useRef(null);
  const dataSourceIdx = useRef(0);
  const dataLayerIdx = useRef(0);
  const markers: Ref<Marker[]> = useRef([]);

  const selectionColorOptions = {
    count: visualization?.value?.max_geographies || 10,
  };

  const { operation, dimension } = analysis.value;
  const analysisOperation =
    mapCatalogQuery.value &&
    mapCatalogQuery.value.response.results[dimension]?.length > 1
      ? operation
      : "single";

  const getSourceId = () => `data-source-${dataSourceIdx.current}`;
  const getLayerId = () => `data-layer-${dataLayerIdx.current}`;
  const getIsRaster = () =>
    mapCatalogQuery.value.dataset.grid.grid_type === "raster";
  const getGeography = (e) => {
    const source = map.current.getSource(getSourceId());
    if (!source) return;
    if (getIsRaster()) {
      const { lngLat } = e;
      const { lng, lat } = lngLat;

      const bounds = new LngLatBounds(source.bounds);
      if (bounds.contains(lngLat)) return [lng.toFixed(5), lat.toFixed(5)];
    } else {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["fill", "line", "selected", "label"].map(
          (suffix) => `${getLayerId()}-${suffix}`,
        ),
      });
      if (features.length) return features[0].id;
    }
  };
  const updateGeography = (i, newGeo) => {
    const geos = selectedGeographies.value.slice();
    geos[i] = newGeo;
    selectedGeographies.value = geos;
  };
  const toggleGeographySelected = (geo) => {
    const geos = selectedGeographies.value.slice();
    let idx = geos.indexOf(geo);
    if (idx === -1) geos.push(geo);
    else geos.splice(idx, 1);
    selectedGeographies.value = geos;
  };
  const openContextMenu = (geo, e) => {
    contextMenu.value = {
      type: "geography-select",
      geography: geo,
      x: (e.originalEvent || e).clientX,
      y: (e.originalEvent || e).clientY,
    };
  };

  const initMap = () => {
    const [z, y, x] = mapPosition.value;
    map.current = new GLMap({
      container: container.current,
      center: [x, y],
      style: getBaseStyle(),
      zoom: z,
    });

    map.current.on("click", (e) => {
      const geo = getGeography(e);
      if (geo) toggleGeographySelected(geo);
    });
    map.current.on("contextmenu", (e) => {
      const geo = getGeography(e);
      if (geo) openContextMenu(geo, e);
    });
    map.current.on("mousemove", (e) => {
      const geo = getGeography(e);
      map.current.getCanvas().style.cursor = geo ? "pointer" : "";
    });
    map.current.on("data", () => (mapTilesLoading.value = true));
    map.current.on("idle", () => (mapTilesLoading.value = false));
    map.current.on("moveend", () => {
      const { lat, lng } = map.current.getCenter();
      mapPosition.value = [map.current.getZoom(), lat, lng];
    });
    map.current.dragRotate.disable();
  };

  const addSource = (tileUrl: string, dataset: Dataset) => {
    mapTilesLoading.value = true;
    dataSourceIdx.current++;
    const source = dataset.grid.isVector()
      ? vectorSource({ gridName: dataset.grid.name })
      : analysisOperation.startsWith("subtract-")
        ? differenceRasterSource({
            tileUrls: [tileUrl],
            variable: dataset.variable,
          })
        : rasterSource({
            tileUrls: [tileUrl],
            colorMap: analysisOperation === "concatenate" ? "lnd_chng" : "",
          });
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
          difference: analysisOperation.startsWith("subtract-"),
          showLabels: showGridLabels.value,
          showLines: showGridLines.value,
          variable: dataset.variable,
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
    const dataset = mapCatalogQuery.value.dataset;

    const tilesChanged = tileUrl !== prevTileUrl.current;
    const datasetChanged = dataset !== prevDataset.current;
    const legendChanged =
      !prevDataset.current ||
      dataset.variable.legend !== prevDataset.current.variable.legend;
    const analysisOperationChanged =
      analysisOperation !== prevAnalysisOperation.current;

    // We update the source when the dataset changes (even though the tile URL might
    // be the same) to make sure the feature state gets cleared.
    if (
      tilesChanged ||
      legendChanged ||
      datasetChanged ||
      analysisOperationChanged
    ) {
      addSource(tileUrl, dataset);
      addLayers(dataset);
      if (datasetChanged || legendChanged || analysisOperationChanged)
        cleanup();
      else scheduleCleanup(dataset);
    }

    prevTileUrl.current = tileUrl;
    prevDataset.current = mapCatalogQuery.value.dataset;
    prevAnalysisOperation.current = analysisOperation;
  };

  const updateProjectLayers = () => {
    const mapStyle = map.current.getStyle();
    for (let layer of mapStyle.layers)
      if (layer.id.startsWith("project-")) map.current.removeLayer(layer.id);

    if (showProjects.value)
      for (let layer of projectLayers(projectsYear.value, true))
        map.current.addLayer(layer, "label");
  };

  const updateFeatureState = () => {
    const sourceId = getSourceId();
    if (map.current.getSource(sourceId))
      for (let featureId in mapFeatureValues.value)
        if (featureId.match(/^[0-9]+$/)) {
          let geoIdx = selectedGeographies.value.indexOf(parseInt(featureId));
          map.current.setFeatureState(
            {
              source: sourceId,
              sourceLayer: "boundary",
              id: featureId,
            },
            {
              selected:
                geoIdx >= 0
                  ? getSelectionColor(geoIdx, selectionColorOptions)
                  : null,
              value: mapFeatureValues.value[featureId],
            },
          );
        }
  };

  const updateMarkers = () => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = selectedGeographies.value
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
          updateGeography(i, [lng, lat]);
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

  const ensureStyleLoaded = async () => {
    while (!map.current || !map.current.isStyleLoaded()) await sleep(100);
  };

  const ensureSourceLoaded = async () => {
    while (!map.current || !map.current.getSource(getSourceId()))
      await sleep(100);
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

  // Add the map legend control.
  useEffect(() => {
    if (map.current && structure.value) {
      map.current.addControl(new CPRAMapLegendControl(structure.value));
    }
  }, [map.current, structure.value]);

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
      if (!mapCatalogQuery.value || !mapTileUrl.value) return;
      await ensureStyleLoaded();
      updateStyle();
    })();
  }, [mapCatalogQuery.value, mapTileUrl.value, analysisOperation]);

  // Update grid label visibility.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      const layerId = `${getLayerId()}-label`;
      if (map.current.getLayer(layerId))
        map.current.setLayoutProperty(
          layerId,
          "visibility",
          showGridLabels.value ? "visible" : "none",
        );
    })();
  }, [showGridLabels.value]);

  // Update grid line visibility.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      const layerId = `${getLayerId()}-line`;
      if (map.current.getLayer(layerId))
        map.current.setLayoutProperty(
          layerId,
          "visibility",
          showGridLines.value ? "visible" : "none",
        );
    })();
  }, [showGridLines.value]);

  // Update projects source.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      const style = map.current.getStyle();
      style.sources.projects = projectsSource({
        modelGroup: projectsModelGroup.value,
      });
      map.current.setStyle(style);
    })();
  }, [projectsModelGroup.value]);

  // Update project layers.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      updateProjectLayers();
    })();
  }, [projectsYear.value, showProjects.value]);

  // Update water source and layer.
  useEffect(() => {
    if (structure.value && mapCatalogQuery.value)
      (async () => {
        const annualLndType = structure.value.datasets.find(
          (dataset) =>
            dataset.variable.name === "lnd_type" &&
            dataset.time_unit === "annual",
        );
        if (!annualLndType) return;

        await ensureStyleLoaded();
        const style = map.current.getStyle();
        const dataParams = mapCatalogQuery.value.getQueryParams();
        const params = [
          dataParams.find(([key]) => key === "model_group_id"),
          dataParams.find(([key]) => key === "scenario_id"),
          ["calendar_year", projectsYear.value],
        ];
        style.sources.water = rasterSource({
          tileUrls: [annualLndType.getTileUrl(params)],
          colorMap: "discrete:#00000000,2,#ffffff,3,#00000000",
        });
        map.current.setStyle(style);

        if (map.current.getLayer("water")) map.current.removeLayer("water");
        if (showWater.value)
          for (let layer of rasterLayers({
            layerId: "water",
            sourceId: "water",
          }))
            map.current.addLayer(layer, "road-secondary");
      })();
  }, [
    structure.value,
    projectsYear.value,
    mapCatalogQuery.value,
    showWater.value,
  ]);

  // Update the map feature state when new data are loaded or the selection changes.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      await ensureSourceLoaded();
      updateFeatureState();
      updateMarkers();
    })();
  }, [mapFeatureValues.value, selectedGeographies.value, visualization.value]);

  // Update the map legend when the map catalog query or analysis changes.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      if (mapCatalogQuery.value && analysis.value) {
        const mapLegend = mapCatalogQuery.value.dataset.variable.getMapLegend(
          analysis.value,
        );
        map.current.setGlobalStateProperty("legend", mapLegend);
      } else {
        map.current.setGlobalStateProperty("legend", null);
      }
    })();
  }, [mapCatalogQuery.value, analysis.value]);

  // Clean up the map before the component unloads.
  useEffect(() => {
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // Add listeners for selection key combinations.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        const selectionCount = selectedGeographies.value.length;
        const maxGeographies = visualization?.value?.max_geographies || 10;
        if (selectionCount) {
          if (e.key === "ArrowLeft") rotateSelectedGeographies(-1);
          else if (e.key === "ArrowRight") rotateSelectedGeographies(1);
        }
        if (selectionCount > maxGeographies) {
          if (e.key === "ArrowUp")
            rotateSelectedGeographies(-1 * maxGeographies);
          else if (e.key === "ArrowDown")
            rotateSelectedGeographies(maxGeographies);
        }
      } else if (e.key === "Escape") {
        selectedGeographies.value = [];
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <div className="h-full rounded-xl overflow-hidden" ref={container} />;
}
