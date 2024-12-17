import { apiBaseUrl, staticTilesBaseUrl } from "./config";
import { RasterStyleOptions } from "./types";
import { makeQueryString } from "./utils";

const colorRamp = (legend) => {
  const ramp = [];
  let foundBound = false;
  for (let { color, upper_bound } of legend.break_points) {
    foundBound = foundBound || upper_bound !== null;
    if (!foundBound) continue;
    ramp.push(color);
    if (upper_bound !== null) ramp.push(upper_bound);
  }
  return ramp;
};

const linearZoom = (min, max) => {
  return ["interpolate", ["linear"], ["zoom"], 6, min, 12, max];
};

const rasterSource = ({
  bounds = [
    -94.00080091962352, 28.70426878930118, -87.51148588666453,
    31.048795426051505,
  ],
  dataset = null,
  grid = null,
  maxZoom = 13,
  params = [],
  tileSize = 256,
  tileUrls = [],
}) => {
  if (dataset) tileUrls = [dataset.getTileUrl("png", params)];
  // TODO: Calculate the correct bounds and max zoom from the grid.
  return {
    bounds,
    maxzoom: maxZoom,
    type: "raster",
    tiles: tileUrls,
    tileSize,
  };
};

const vectorSource = ({ gridName, promoteId = "id" }) => ({
  type: "vector",
  url: `${staticTilesBaseUrl}/${gridName}`,
  promoteId,
});

export function getBaseStyle() {
  return {
    sources: {
      "basemap-raster": {
        type: "raster",
        url: `${staticTilesBaseUrl}/basemap-raster`,
      },
      "basemap-vector": {
        type: "vector",
        url: `${staticTilesBaseUrl}/basemap-vector`,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#ffffff",
        },
        order: 0,
      },
      {
        id: "state",
        type: "fill",
        source: "basemap-vector",
        "source-layer": "state",
        paint: {
          "fill-color": "#d6d6d6",
        },
        order: 1,
      },
      {
        id: "state-screen",
        type: "fill",
        source: "basemap-vector",
        "source-layer": "state",
        filter: ["!=", ["get", "abbr"], "LA"],
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.4,
        },
        order: 2,
      },
      {
        id: "water-not-in-icm",
        type: "fill",
        source: "basemap-vector",
        "source-layer": "water",
        paint: {
          "fill-color": "#ffffff",
        },
        order: 5000,
      },
      {
        id: "initial-conditions-water",
        type: "raster",
        source: "basemap-raster",
        order: 5001,
      },
      {
        id: "levee",
        type: "line",
        source: "basemap-vector",
        "source-layer": "levee",
        paint: {
          "line-color": "#939598",
          "line-opacity": 0.5,
          "line-width": 0.667,
        },
        order: 10000,
      },
      {
        id: "road-secondary",
        type: "line",
        source: "basemap-vector",
        "source-layer": "road",
        filter: ["==", ["get", "type"], "S"],
        paint: {
          "line-color": "#a4a4a4",
          "line-opacity": 0.5,
          "line-width": 1.333,
        },
        order: 10001,
      },
      {
        id: "road-primary",
        type: "line",
        source: "basemap-vector",
        "source-layer": "road",
        filter: ["==", ["get", "type"], "P"],
        paint: {
          "line-color": "#a4a4a4",
          "line-width": 1.333,
        },
        order: 10002,
      },
      {
        id: "label",
        type: "symbol",
        source: "basemap-vector",
        "source-layer": "label",
        layout: {
          "text-field": ["get", "text"],
          "text-size": ["case", ["==", "community", ["get", "type"]], 16, 13],
          "text-font": [
            "case",
            ["==", "community", ["get", "type"]],
            ["literal", ["Franklin Gothic Demi Regular"]],
            ["literal", ["Franklin Gothic Book Regular"]],
          ],
        },
        paint: {
          "text-color": "#444444",
        },
        order: 100000,
      },
    ],
  };
}

export function rasterStyle({
  bounds,
  dataset,
  grid,
  layerName = "data-raster",
  maxZoom,
  order = 6000,
  params,
  sourceName = "data-raster",
  tileSize,
  tileUrls,
}: RasterStyleOptions) {
  return {
    sources: {
      [sourceName]: rasterSource({
        bounds,
        dataset,
        grid,
        maxZoom,
        params,
        tileSize,
        tileUrls,
      }),
    },
    layers: [
      {
        type: "raster",
        id: layerName,
        source: sourceName,
        order,
      },
    ],
  };
}

export function vectorStyle({
  dataset,
  lineColors = ["#DDDDDD", "#666666"],
  lineWidths = [0.5, 3],
  order = 6000,
  legend,
}) {
  const ramp = colorRamp(legend);
  const layers = [];

  layers.push(
    {
      id: "data-fill",
      type: "fill",
      source: "data-vector",
      "source-layer": "boundary",
      paint: {
        "fill-color": [
          "case",
          ["==", ["feature-state", "value"], null],
          "transparent",
          ["step", ["feature-state", "value"], ...ramp],
        ],
      },
      order,
    },
    {
      id: "data-line",
      type: "line",
      source: "data-vector",
      "source-layer": "boundary",
      paint: {
        "line-color": linearZoom(...lineColors),
        "line-width": linearZoom(...lineWidths),
      },
      order: order + 1,
    },
    {
      id: "data-selected",
      type: "line",
      source: "data-vector",
      "source-layer": "boundary",
      paint: {
        "line-color": [
          "coalesce",
          ["feature-state", "selected"],
          "transparent",
        ],
        "line-offset": 1.5,
        "line-width": 3,
      },
      order: order + 2,
    },
    {
      id: "data-label",
      type: "symbol",
      source: "data-vector",
      "source-layer": "label",
      minzoom: 9,
      layout: {
        "text-field": ["get", "label"],
        "text-offset": [0, 0],
        "text-size": 12,
        "text-font": ["literal", ["Franklin Gothic Demi Regular"]],
      },
      paint: {
        "text-halo-blur": 0.5,
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
      order: 100001,
    }
  );

  return {
    sources: {
      "data-vector": vectorSource({ gridName: dataset.grid }),
    },
    layers,
  };
}
