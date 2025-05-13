import { glyphsBaseUrl, spritesBaseUrl, staticTilesBaseUrl } from "./config";
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
  return {
    version: 8,
    glyphs: `${glyphsBaseUrl}/{fontstack}/{range}.pbf`,
    sprite: `${spritesBaseUrl}/sprite`,
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

export function projectLayers(filter, isOverlay, suffix = "") {
  const overlay = (yes, no) => (isOverlay ? yes : no);
  const overlayStrokeColor = linearZoom(
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.25)",
  );
  const overlayStrokeWidth = linearZoom(1, 2);
  const overlayFillColor = linearZoom(
    "rgba(0, 0, 0, 0.07)",
    "rgba(0, 0, 0, 0.15)",
  );
  return [
    // Diversion polygon
    {
      id: `project-polygon-di${suffix}`,
      type: "fill",
      source: "basemap-vector",
      "source-layer": "project_polygon",
      filter: ["all", ["==", ["get", "type"], "DI"], filter],
      paint: {
        "fill-color": overlay(overlayFillColor, "#000000"),
        "fill-opacity": overlay(1, 0),
      },
    },
    // Diversion polygon outline
    {
      id: `project-polygon-di-outline${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_polygon",
      filter: ["all", ["==", ["get", "type"], "DI"], filter],
      paint: {
        "line-color": overlay(overlayStrokeColor, "#ed6731"),
        "line-dasharray": [2, 1],
        "line-width": overlay(overlayStrokeWidth, linearZoom(1, 3)),
      },
    },
    // Landbridge polygon
    {
      id: `project-polygon-lb${suffix}`,
      type: "fill",
      source: "basemap-vector",
      "source-layer": "project_polygon",
      filter: ["all", ["==", ["get", "type"], "LB"], filter],
      paint: {
        "fill-color": overlay(overlayFillColor, "#5C913A"),
      },
    },
    {
      id: `project-polygon-lb-outline${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_polygon",
      filter: ["all", ["==", ["get", "type"], "LB"], filter],
      paint: {
        "line-color": overlayStrokeColor,
        "line-width": overlayStrokeWidth,
      },
      layout: { visibility: overlay("visible", "none") },
    },
    // Marsh creation polygon
    {
      id: `project-polygon-mc${suffix}`,
      type: "fill",
      source: "basemap-vector",
      "source-layer": "project_polygon",
      filter: ["all", ["==", ["get", "type"], "MC"], filter],
      paint: overlay(
        { "fill-color": overlayFillColor },
        { "fill-pattern": "green-dots" },
      ),
    },
    {
      id: `project-polygon-mc-outline${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_polygon",
      filter: ["all", ["==", ["get", "type"], "MC"], filter],
      paint: {
        "line-color": overlayStrokeColor,
        "line-width": overlayStrokeWidth,
      },
      layout: { visibility: overlay("visible", "none") },
    },
    // Bank stabilization lines
    {
      id: `project-line-bs${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_line",
      filter: ["all", ["==", ["get", "type"], "BS"], filter],
      paint: {
        "line-color": overlay(overlayStrokeColor, "#D9A73B"),
        "line-width": overlay(overlayStrokeWidth, linearZoom(2, 5)),
      },
    },
    // Structural risk reduction lines
    {
      id: `project-line-sr${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_line",
      filter: ["all", ["==", ["get", "type"], "SR"], filter],
      paint: {
        "line-color": "#404042",
        "line-width": linearZoom(2, 5),
      },
    },
    // Diversion and hydrologic restoration lines
    {
      id: `project-line-di-hr${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_line",
      filter: [
        "all",
        ["in", ["get", "type"], ["literal", ["DI", "HR"]]],
        filter,
      ],
      paint: {
        "line-color": overlay(overlayStrokeColor, [
          "case",
          ["==", ["get", "type"], "DI"],
          "#ED6731",
          "#1DBEF0",
        ]),
        "line-dasharray": [2, 1],
        "line-width": overlay(overlayStrokeWidth, linearZoom(2, 6.75)),
      },
    },
    // Ridge restoration line
    {
      id: `project-line-rr${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_line",
      filter: ["all", ["==", ["get", "type"], "RR"], filter],
      paint: {
        "line-color": overlay(overlayStrokeColor, "#1C4E7F"),
        "line-width": overlay(overlayStrokeWidth, linearZoom(1.5, 2.5)),
      },
    },
    // Shoreline protection line
    {
      id: `project-line-sp${suffix}`,
      type: "line",
      source: "basemap-vector",
      "source-layer": "project_line",
      filter: ["all", ["==", ["get", "type"], "SP"], filter],
      paint: {
        "line-color": overlay(overlayStrokeColor, "#19A598"),
        "line-width": overlay(overlayStrokeWidth, linearZoom(3, 4.5)),
      },
    },
    // Diversion and hydrologic restoration points
    {
      id: `project-point-di-hr${suffix}`,
      type: "circle",
      source: "basemap-vector",
      "source-layer": "project_point",
      filter: [
        "all",
        ["in", ["get", "type"], ["literal", ["DI", "HR"]]],
        filter,
      ],
      paint: {
        "circle-color": overlay(overlayFillColor, "#FFFFFF"),
        "circle-radius": overlay(linearZoom(1, 3), linearZoom(2, 5)),
        "circle-stroke-color": overlay(overlayStrokeColor, [
          "case",
          ["==", ["get", "type"], "DI"],
          "#ED6731",
          "#1DBEF0",
        ]),
        "circle-stroke-width": overlay(overlayStrokeWidth, linearZoom(1.5, 4)),
      },
    },
    // Structural risk reduction point
    {
      id: `project-point-sr${suffix}`,
      type: "symbol",
      source: "basemap-vector",
      "source-layer": "project_point",
      filter: ["all", ["==", ["get", "type"], "SR"], filter],
      paint: {
        "icon-opacity": 1,
      },
      layout: {
        "icon-allow-overlap": true,
        "icon-image": "square",
        "icon-size": linearZoom(0.1, 1),
      },
    },
    // Project labels
    {
      id: `project-label${suffix}`,
      type: "symbol",
      source: "basemap-vector",
      "source-layer": "project_label",
      filter: ["all", ["!=", ["get", "type"], "OR"], filter],
      minzoom: 9,
      layout: {
        "text-anchor": "top",
        "text-field": ["get", "name"],
        "text-offset": ["literal", [0, 1.5]],
        "text-size": 14,
        "text-font": ["literal", ["Franklin Gothic Demi Regular"]],
      },
      paint: {
        "text-color": "#444444",
        "text-halo-blur": 1,
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    {
      id: `project-icon${suffix}`,
      type: "symbol",
      source: "basemap-vector",
      "source-layer": "project_label",
      filter: ["all", ["!=", ["get", "type"], "OR"], filter],
      minzoom: 10,
      layout: {
        "icon-image": ["get", "type"],
        "icon-size": linearZoom(0.5, 2.5),
      },
    },
    {
      id: `project-icon-dot${suffix}`,
      type: "circle",
      source: "basemap-vector",
      "source-layer": "project_label",
      filter: ["all", ["!=", ["get", "type"], "OR"], filter],
      maxzoom: 10,
      minzoom: 8,
      paint: {
        "circle-color": [
          "match",
          ["get", "type"],
          "BH",
          "#a2e5e0",
          "BS",
          "#e7a62c",
          "DI",
          "#ea6833",
          "HR",
          "#30bded",
          "LB",
          "#5c913e",
          "MC",
          "#d3df3a",
          "NS",
          "#64668b",
          "OR",
          "#eca583",
          "RR",
          "#204e7e",
          "SP",
          "#18a899",
          "SR",
          "#414143",
          "#c8c8c8",
        ],
        "circle-radius": linearZoom(2, 12),
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 1,
      },
    },
  ];
}
