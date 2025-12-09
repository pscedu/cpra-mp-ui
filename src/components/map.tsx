import { Ref, useEffect, useRef } from "react";
import { LngLatBounds, Map as GLMap, Marker } from "maplibre-gl";
import { useAtomValue, useSetAtom } from "jotai";
import {
  analysisAtom,
  contextMenuAtom,
  mapCatalogQueryAtom,
  mapFeatureValuesAtom,
  mapPositionAtom,
  mapTileUrlAtom,
  mapTilesLoadingAtom,
  projectsModelGroupAtom,
  projectsYearAtom,
  selectedGeographiesAtom,
  showGridLabelsAtom,
  showGridLinesAtom,
  showProjectsAtom,
  showWaterAtom,
  structureAtom,
  visualizationAtom,
} from "@/helpers/state";
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
  const structure = useAtomValue(structureAtom);
  const visualization = useAtomValue(visualizationAtom);
  const analysis = useAtomValue(analysisAtom);
  const mapCatalogQuery = useAtomValue(mapCatalogQueryAtom);
  const selectedGeographies = useAtomValue(selectedGeographiesAtom);
  const setSelectedGeographies = useSetAtom(selectedGeographiesAtom);
  const contextMenu = useAtomValue(contextMenuAtom);
  const setContextMenu = useSetAtom(contextMenuAtom);
  const mapFeatureValues = useAtomValue(mapFeatureValuesAtom);
  const mapPosition = useAtomValue(mapPositionAtom);
  const setMapPosition = useSetAtom(mapPositionAtom);
  const mapTilesLoading = useAtomValue(mapTilesLoadingAtom);
  const projectsModelGroup = useAtomValue(projectsModelGroupAtom);
  const projectsYear = useAtomValue(projectsYearAtom);
  const setMapTilesLoading = useSetAtom(mapTilesLoadingAtom);
  const showGridLabels = useAtomValue(showGridLabelsAtom);
  const showGridLines = useAtomValue(showGridLinesAtom);
  const showProjects = useAtomValue(showProjectsAtom);
  const showWater = useAtomValue(showWaterAtom);
  const mapTileUrl = useAtomValue(mapTileUrlAtom);

  const container = useRef(null);
  const map = useRef(null);
  const prevTileUrl = useRef(null);
  const prevDataset = useRef(null);
  const prevAnalysisOperation = useRef(null);
  const dataSourceIdx = useRef(0);
  const dataLayerIdx = useRef(0);
  const markers: Ref<Marker[]> = useRef([]);

  const selectionColorOptions = {
    count: visualization.max_geographies || 10,
  };

  const { operation, dimension } = analysis;
  const analysisOperation =
    mapCatalogQuery && mapCatalogQuery?.response.results[dimension]?.length > 1
      ? operation
      : "single";

  const getSourceId = () => `data-source-${dataSourceIdx.current}`;
  const getLayerId = () => `data-layer-${dataLayerIdx.current}`;
  const getIsRaster = () =>
    mapCatalogQuery?.dataset.grid.grid_type === "raster";
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
  const updateGeography = (i: number, newGeo: any) => {
    const geos = selectedGeographies?.slice();
    geos[i] = newGeo;
    setSelectedGeographies(geos);
  };
  const toggleGeographySelected = (geo: any) => {
    const geos = selectedGeographies?.slice();
    let idx = geos.indexOf(geo);
    if (idx === -1) geos.push(geo);
    else geos.splice(idx, 1);
    setSelectedGeographies(geos);
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
    map.current.on("data", () => setMapTilesLoading(true));
    map.current.on("idle", () => setMapTilesLoading(false));
    map.current.on("moveend", () => {
      const { lat, lng } = map.current.getCenter();
      setMapPosition([map.current.getZoom(), lat, lng]);
    });
    map.current.dragRotate.disable();
  };

  const addSource = (tileUrl: string, dataset: Dataset) => {
    setMapTilesLoading(true);
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
          showLabels: showGridLabels,
          showLines: showGridLines,
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
    const tileUrl = mapTileUrl;
    const dataset = mapCatalogQuery?.dataset;

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
    prevDataset.current = mapCatalogQuery?.dataset;
    prevAnalysisOperation.current = analysisOperation;
  };

  const updateProjectLayers = () => {
    const mapStyle = map.current.getStyle();
    for (let layer of mapStyle.layers)
      if (layer.id.startsWith("project-")) map.current.removeLayer(layer.id);

    if (showProjects)
      for (let layer of projectLayers(projectsYear, true))
        map.current.addLayer(layer, "label");
  };

  const updateFeatureState = () => {
    const sourceId = getSourceId();
    if (map.current.getSource(sourceId))
      for (let featureId in mapFeatureValues)
        if (featureId.match(/^[0-9]+$/)) {
          let geoIdx = selectedGeographies?.indexOf(parseInt(featureId));
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
              value: mapFeatureValues[featureId],
            },
          );
        }
  };

  const updateMarkers = () => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = selectedGeographies
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
    if (map.current && structure) {
      map.current.addControl(new CPRAMapLegendControl(structure));
    }
  }, [map.current, structure]);

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
      if (!mapCatalogQuery || !mapTileUrl) return;
      await ensureStyleLoaded();
      updateStyle();
    })();
  }, [mapCatalogQuery, mapTileUrl, analysisOperation]);

  // Update grid label visibility.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      const layerId = `${getLayerId()}-label`;
      if (map.current.getLayer(layerId))
        map.current.setLayoutProperty(
          layerId,
          "visibility",
          showGridLabels ? "visible" : "none",
        );
    })();
  }, [showGridLabels]);

  // Update grid line visibility.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      const layerId = `${getLayerId()}-line`;
      if (map.current.getLayer(layerId))
        map.current.setLayoutProperty(
          layerId,
          "visibility",
          showGridLines ? "visible" : "none",
        );
    })();
  }, [showGridLines]);

  // Update projects source.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      const style = map.current.getStyle();
      style.sources.projects = projectsSource({
        modelGroup: projectsModelGroup,
      });
      map.current.setStyle(style);
    })();
  }, [projectsModelGroup]);

  // Update project layers.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      updateProjectLayers();
    })();
  }, [projectsYear, showProjects]);

  // Update water source and layer.
  useEffect(() => {
    if (structure && mapCatalogQuery)
      (async () => {
        const annualLndType = structure?.datasets.find(
          (dataset) =>
            dataset.variable.name === "lnd_type" &&
            dataset.time_unit === "annual",
        );
        if (!annualLndType) return;

        await ensureStyleLoaded();
        const style = map.current.getStyle();
        const dataParams = mapCatalogQuery?.getQueryParams();
        const params = [
          dataParams.find(([key]) => key === "model_group_id"),
          dataParams.find(([key]) => key === "scenario_id"),
          ["calendar_year", projectsYear],
        ];
        style.sources.water = rasterSource({
          tileUrls: [annualLndType.getTileUrl(params)],
          colorMap: "discrete:#00000000,2,#ffffff,3,#00000000",
        });
        map.current.setStyle(style);

        if (map.current.getLayer("water")) map.current.removeLayer("water");
        if (showWater)
          for (let layer of rasterLayers({
            layerId: "water",
            sourceId: "water",
          }))
            map.current.addLayer(layer, "road-secondary");
      })();
  }, [structure, projectsYear, mapCatalogQuery, showWater]);

  // Update the map feature state when new data are loaded or the selection changes.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      await ensureSourceLoaded();
      updateFeatureState();
      updateMarkers();
    })();
  }, [mapFeatureValues, selectedGeographies, visualization]);

  // Update the map legend when the map catalog query or analysis changes.
  useEffect(() => {
    (async () => {
      await ensureStyleLoaded();
      if (mapCatalogQuery && analysis) {
        const mapLegend =
          mapCatalogQuery?.dataset.variable.getMapLegend(analysis);
        map.current.setGlobalStateProperty("legend", mapLegend);
      } else {
        map.current.setGlobalStateProperty("legend", null);
      }
    })();
  }, [mapCatalogQuery, analysis]);

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
        const selectionCount = selectedGeographies?.length;
        const maxGeographies = visualization.max_geographies || 10;
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
        setSelectedGeographies([]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <div className="h-full rounded-xl overflow-hidden" ref={container} />;
}
