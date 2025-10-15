import { glyphsBaseUrl, spritesBaseUrl, staticTilesBaseUrl } from "./config";
import { StyleSpecification } from "maplibre-gl";
import { Legend, Variable } from "./structure";

const colorRamp = (legend: Legend) => {
  const ramp = [];
  let foundBound = false;
  for (const { color, upper_bound } of legend.break_points) {
    foundBound = foundBound || upper_bound !== null;
    if (!foundBound) continue;
    ramp.push(color);
    if (upper_bound !== null) ramp.push(upper_bound);
  }
  return ["step", ["feature-state", "value"], ...ramp];
};

const differenceBreaksColors = (variable: Variable) => {
  const limit: number = variable.difference_legend_limit || 1;
  return limit > 0
    ? [-1 * limit, "#d53e4f", 0, "#ffffff", limit, "#3288bd"]
    : [limit, "#3288bd", 0, "#ffffff", limit * -1, "#d53e4f"];
};

const differenceColorRamp = (variable: Variable) => {
  return [
    "interpolate",
    ["linear"],
    ["feature-state", "value"],
    ...differenceBreaksColors(variable),
  ];
};

const linearZoom = <T>(min: T, max: T) => {
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
  difference = false,
  variable,
}) => {
  return {
    bounds,
    maxzoom: maxZoom,
    type: "raster",
    tiles: tileUrls.map(
      (tileUrl) =>
        `${tileUrl}${difference ? `&color_map=${encodeURIComponent(`continuous:${differenceBreaksColors(variable).join(",")}`)}` : ""}`,
    ),
    tileSize,
  };
};

export const vectorSource = ({ gridName }: { gridName: string }) => ({
  type: "vector",
  url: `${staticTilesBaseUrl}/${gridName}`,
});

export const projectsSource = ({ modelGroup }: { modelGroup: number }) => ({
  type: "vector",
  url: `${staticTilesBaseUrl}/f_generate_tile_element_project?model_group_id=${modelGroup}`,
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
        filter: ["==", ["get", "element_type_code"], "S"],
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
        filter: ["==", ["get", "element_type_code"], "P"],
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
          "text-size": [
            "case",
            ["==", "community", ["get", "element_type_code"]],
            16,
            13,
          ],
          "text-font": [
            "case",
            ["==", "community", ["get", "element_type_code"]],
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
  difference = false,
  layerId,
  lineColors = ["#DDDDDD", "#666666"],
  lineWidths = [0.5, 3],
  sourceId,
  showLabels = false,
  variable,
}) {
  const ramp = difference
    ? differenceColorRamp(variable)
    : colorRamp(variable.legend);

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
          ramp,
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
        visibility: showLabels ? "visible" : "none",
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

export function projectLayers(year, isOverlay, suffix = "") {
  const yearFilter = ["<=", ["get", "start_year"], year];
  const overlay = (yes, no) => (isOverlay ? yes : no);
  const projectLayer = (
    gisType: string,
    projectTypeCode: string,
    type: string,
  ) => ({
    id: `project-${gisType.toLowerCase()}-${projectTypeCode.toLowerCase()}-${type}${suffix}`,
    type,
    source: "projects",
    "source-layer": "project_element",
    filter: [
      "all",
      ["==", ["get", "gis_type"], gisType],
      ["==", ["get", "project_type_code"], projectTypeCode],
      yearFilter,
    ],
  });
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
    // Diversion polygon fill
    {
      ...projectLayer("Polygon", "DI", "fill"),
      paint: {
        "fill-color": overlay(overlayFillColor, "#000000"),
        "fill-opacity": overlay(1, 0),
      },
    },
    // Diversion polygon line
    {
      ...projectLayer("Polygon", "DI", "line"),
      paint: {
        "line-color": overlay(overlayStrokeColor, "#ed6731"),
        "line-dasharray": [2, 1],
        "line-width": overlay(overlayStrokeWidth, linearZoom(1, 3)),
      },
    },
    // Landbridge polygon fill
    {
      ...projectLayer("Polygon", "LB", "fill"),
      paint: {
        "fill-color": overlay(overlayFillColor, "#5C913A"),
      },
    },
    // Landbridge polygon line
    {
      ...projectLayer("Polygon", "LB", "line"),
      paint: {
        "line-color": overlayStrokeColor,
        "line-width": overlayStrokeWidth,
      },
      layout: { visibility: overlay("visible", "none") },
    },
    // Marsh creation polygon fill
    {
      ...projectLayer("Polygon", "MC", "fill"),
      paint: overlay(
        { "fill-color": overlayFillColor },
        { "fill-pattern": "green-dots" },
      ),
    },
    // Marsh creation polygon line
    {
      ...projectLayer("Polygon", "MC", "line"),
      paint: {
        "line-color": overlayStrokeColor,
        "line-width": overlayStrokeWidth,
      },
      layout: { visibility: overlay("visible", "none") },
    },
    // Bank stabilization line
    {
      ...projectLayer("Line", "BS", "line"),
      paint: {
        "line-color": overlay(overlayStrokeColor, "#D9A73B"),
        "line-width": overlay(overlayStrokeWidth, linearZoom(2, 5)),
      },
    },
    // Structural risk reduction line
    {
      ...projectLayer("Line", "SR", "line"),
      paint: {
        "line-color": "#404042",
        "line-width": linearZoom(2, 5),
      },
    },
    // Diversion line
    {
      ...projectLayer("Line", "DI", "line"),
      paint: {
        "line-color": overlay(overlayStrokeColor, "#ED6731"),
        "line-dasharray": [2, 1],
        "line-width": overlay(overlayStrokeWidth, linearZoom(2, 6.75)),
      },
    },
    // Hydrologic restoration line
    {
      ...projectLayer("Line", "HR", "line"),
      paint: {
        "line-color": overlay(overlayStrokeColor, "#1DBEF0"),
        "line-dasharray": [2, 1],
        "line-width": overlay(overlayStrokeWidth, linearZoom(2, 6.75)),
      },
    },
    // Ridge restoration line
    {
      ...projectLayer("Line", "RR", "line"),
      paint: {
        "line-color": overlay(overlayStrokeColor, "#1C4E7F"),
        "line-width": overlay(overlayStrokeWidth, linearZoom(1.5, 2.5)),
      },
    },
    // Shoreline protection line
    {
      ...projectLayer("Line", "SP", "line"),
      paint: {
        "line-color": overlay(overlayStrokeColor, "#19A598"),
        "line-width": overlay(overlayStrokeWidth, linearZoom(3, 4.5)),
      },
    },
    // Diversion point
    {
      ...projectLayer("Point", "DI", "circle"),
      paint: {
        "circle-color": overlay(overlayFillColor, "#FFFFFF"),
        "circle-radius": overlay(linearZoom(1, 3), linearZoom(2, 5)),
        "circle-stroke-color": overlay(overlayStrokeColor, "#ED6731"),
        "circle-stroke-width": overlay(overlayStrokeWidth, linearZoom(1.5, 4)),
      },
    },
    // Hydrologic restoration point
    {
      ...projectLayer("Point", "HR", "circle"),
      paint: {
        "circle-color": overlay(overlayFillColor, "#FFFFFF"),
        "circle-radius": overlay(linearZoom(1, 3), linearZoom(2, 5)),
        "circle-stroke-color": overlay(overlayStrokeColor, "#1DBEF0"),
        "circle-stroke-width": overlay(overlayStrokeWidth, linearZoom(1.5, 4)),
      },
    },
    // Structural risk reduction point
    {
      ...projectLayer("Point", "SR", "symbol"),
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
      source: "projects",
      "source-layer": "project_label",
      filter: ["all", ["!=", ["get", "project_type_code"], "OR"], yearFilter],
      minzoom: 9,
      layout: {
        "text-anchor": "top",
        "text-field": ["get", "project_name"],
        "text-offset": ["literal", [0, 0.75]],
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
      id: `project-icon-dot${suffix}`,
      type: "circle",
      source: "projects",
      "source-layer": "project_label",
      filter: ["all", yearFilter],
      minzoom: 8,
      paint: {
        "circle-color": [
          "match",
          ["get", "project_type_code"],
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
        "circle-radius": linearZoom(2, 6),
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 1,
      },
    },
  ];
}
