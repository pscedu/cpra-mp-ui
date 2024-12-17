import { apiBaseUrl, staticTilesBaseUrl } from "./config";
import { RasterStyleOptions } from "./types";

const colorRamp = (legend) => {
  const ramp = [];
  for (let level of legend) {
    if (level[2] !== null) {
      ramp.push(level[0]);
      if (level[2] !== undefined) ramp.push(level[2]);
    }
  }
  return ramp;
};

const staticTileUrls = (serviceName) =>
  ["a", "b", "c", "d"].map(
    (letter) =>
      `${staticTilesBaseUrl.replace(
        /\/\//g,
        `//${letter}.`
      )}/${serviceName}/tiles/{z}/{x}/{y}.png`
  );

const linearZoom = (min, max) => {
  return ["interpolate", ["linear"], ["zoom"], 6, min, 12, max];
};

const rasterSource = ({
  bounds = [
    -94.00080091962352, 28.70426878930118, -87.51148588666453,
    31.048795426051505,
  ],
  grid = null,
  maxZoom = 13,
  tileSize = 256,
  tileUrls = [],
}) => {
  // TODO: Calculate the correct bounds and max zoom from the grid.
  return {
    bounds,
    maxzoom: maxZoom,
    type: "raster",
    tiles: tileUrls,
    tileSize,
  };
};

// const vectorSource = (serviceName, promoteId) => ({
//   type: "vector",
//   url: `${baseUrl}/${serviceName}`,
//   promoteId,
// });

export function getBaseStyle() {
  return {
    sources: {
      "basemap-raster": rasterSource({
        tileUrls: staticTileUrls("basemap-raster"),
      }),
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
  grid,
  layerName = "data-raster",
  maxZoom,
  order = 6000,
  sourceName = "data-raster",
  tileSize,
  tileUrls,
}: RasterStyleOptions) {
  return {
    sources: {
      [sourceName]: rasterSource({
        bounds,
        grid,
        maxZoom,
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

// export function vectorStyle({
//   lineColors = ["#DDDDDD", "#666666"],
//   lineWidths = [0.5, 3],
//   order = 6000,
// } = {}) {
//   return function ({ geographicUnit }, { legend }) {
//     const ramp = colorRamp(legend);
//     const layers = [];
//     const isPoint = geographicUnit == "extraction_point";
//     if (isPoint)
//       layers.push(
//         {
//           id: "geography-fill",
//           type: "circle",
//           source: "geography-vector",
//           "source-layer": geographicUnit,
//           paint: {
//             "circle-color": [
//               "case",
//               ["==", ["feature-state", "value"], null],
//               "transparent",
//               ["step", ["feature-state", "value"], ...ramp],
//             ],
//             "circle-radius": 5,
//             "circle-stroke-color": linearZoom(...lineColors),
//             "circle-stroke-width": linearZoom(...lineWidths),
//           },
//           order,
//         },
//         {
//           id: "geography-selected",
//           type: "circle",
//           source: "geography-vector",
//           "source-layer": geographicUnit,
//           paint: {
//             "circle-color": "transparent",
//             "circle-radius": 5,
//             "circle-stroke-color": [
//               "coalesce",
//               ["feature-state", "selected"],
//               "transparent",
//             ],
//             "circle-stroke-width": 3,
//           },
//           order: order + 2,
//         }
//       );
//     else
//       layers.push(
//         {
//           id: "geography-fill",
//           type: "fill",
//           source: "geography-vector",
//           "source-layer": geographicUnit,
//           paint: {
//             "fill-color": [
//               "case",
//               ["==", ["feature-state", "value"], null],
//               "transparent",
//               ["step", ["feature-state", "value"], ...ramp],
//             ],
//           },
//           order,
//         },
//         {
//           id: "geography-line",
//           type: "line",
//           source: "geography-vector",
//           "source-layer": geographicUnit,
//           paint: {
//             "line-color": linearZoom(...lineColors),
//             "line-width": linearZoom(...lineWidths),
//           },
//           order: order + 1,
//         },
//         {
//           id: "geography-selected",
//           type: "line",
//           source: "geography-vector",
//           "source-layer": geographicUnit,
//           paint: {
//             "line-color": [
//               "coalesce",
//               ["feature-state", "selected"],
//               "transparent",
//             ],
//             "line-offset": 1.5,
//             "line-width": 3,
//           },
//           order: order + 2,
//         }
//       );

//     if (
//       [
//         "block_group",
//         "clara",
//         "ecoregion",
//         "extraction_point",
//         "hydro_compartment",
//         "parish",
//       ].includes(geographicUnit)
//     )
//       layers.push({
//         id: "geography-label",
//         type: "symbol",
//         source: "geography-vector",
//         "source-layer": `${geographicUnit}${isPoint ? "" : "_label"}`,
//         minzoom: 9,
//         layout: {
//           "text-field": ["get", isPoint ? "id" : "label"],
//           "text-offset": isPoint ? [0, -1.2] : [0, 0],
//           "text-size": 12,
//           "text-font": ["literal", ["Franklin Gothic Demi Regular"]],
//         },
//         paint: {
//           "text-halo-blur": 0.5,
//           "text-color": "#000000",
//           "text-halo-color": "#ffffff",
//           "text-halo-width": 2,
//         },
//         order: 100001,
//       });

//     return {
//       sources: {
//         "geography-vector": vectorSource("geography-vector2", "id"),
//       },
//       layers,
//     };
//   };
// }
