import { staticTilesBaseUrl } from "./config";
import { StyleSpecification } from "maplibre-gl";

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

export const rasterSource = ({
  bounds = [
    -94.00080091962352, 28.70426878930118, -87.51148588666453,
    31.048795426051505,
  ],
  maxZoom = 13,
  tileSize = 256,
  tileUrls = [],
}) => {
  return {
    bounds,
    maxzoom: maxZoom,
    type: "raster",
    tiles: tileUrls,
    tileSize,
  };
};

export const vectorSource = ({ gridName, promoteId = "id" }) => ({
  type: "vector",
  url: `${staticTilesBaseUrl}/${gridName}`,
  promoteId,
});

export function getBaseStyle(): StyleSpecification {
  const origin = document.location.origin;
  return {
    version: 8,
    glyphs: `${origin}/style/glyphs/{fontstack}/{range}.pbf`,
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
      },
      {
        id: "state",
        type: "fill",
        source: "basemap-vector",
        "source-layer": "state",
        paint: {
          "fill-color": "#d6d6d6",
        },
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
      },
      {
        id: "water-not-in-icm",
        type: "fill",
        source: "basemap-vector",
        "source-layer": "water",
        paint: {
          "fill-color": "#ffffff",
        },
      },
      {
        id: "initial-conditions-water",
        type: "raster",
        source: "basemap-raster",
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
      },
    ],
    transition: {
      duration: 0,
      delay: 0,
    },
  };
}

export function rasterLayers({ layerId, sourceId }) {
  return [
    {
      type: "raster",
      id: layerId,
      source: sourceId,
    },
  ];
}

export function vectorLayers({
  layerId,
  lineColors = ["#DDDDDD", "#666666"],
  lineWidths = [0.5, 3],
  legend,
  sourceId,
}) {
  const ramp = colorRamp(legend);

  return [
    {
      id: `${layerId}-fill`,
      type: "fill",
      source: sourceId,
      "source-layer": "boundary",
      paint: {
        "fill-color": [
          "case",
          ["==", ["feature-state", "value"], null],
          "transparent",
          ["step", ["feature-state", "value"], ...ramp],
        ],
      },
    },
    {
      id: `${layerId}-line`,
      type: "line",
      source: sourceId,
      "source-layer": "boundary",
      paint: {
        "line-color": linearZoom(...(lineColors as [string, string])),
        "line-width": linearZoom(...(lineWidths as [number, number])),
      },
    },
    {
      id: `${layerId}-selected`,
      type: "line",
      source: sourceId,
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
    },
    {
      id: `${layerId}-label`,
      type: "symbol",
      source: sourceId,
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
    },
  ];
}
