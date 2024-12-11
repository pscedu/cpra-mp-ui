const baseUrl = "https://tiles.mpdv.coastal.la.gov/services";

/**
 * Create a color ramp based on a legend array.
 * @param {[string, string, number][]} legend - Legend array containing arrays of
 * color, label, and breakpoint. The range includes all values from the previous
 * breakpoint up to, but not including, the breakpoint.
 * @returns {*[]} - Color ramp in the format used by a MapLibre GL step expression.
 */
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

/**
 * Generate a linear zoom interpolation expression.
 * @param {*} min - Value of the expression at the map's minimum zoom level (6).
 * @param {*} max - Value of the expression at the map's maximum zoom level (12).
 * @returns
 */
const linearZoom = (min, max) => {
  return ["interpolate", ["linear"], ["zoom"], 6, min, 12, max];
};

/**
 * Generate a raster source definition object.
 * @param {string} service - Service (tile set) name.
 * @returns {Object} - Source object.
 */
const rasterSource = (service) => ({
  bounds: [
    -94.00080091962352, 28.70426878930118, -87.51148588666453,
    31.048795426051505,
  ],
  maxzoom: 13,
  type: "raster",
  tiles: ["a", "b", "c", "d"].map(
    (letter) =>
      `${baseUrl.replace(
        /\/\//g,
        `//${letter}.`
      )}/${service}/tiles/{z}/{x}/{y}.png`
  ),
  tileSize: 256,
});

/**
 * Generate a vector source definition object.
 * @param {string} serviceName - Service (tile set) name.
 * @param {boolean|Object} promoteId - Promote a property to ID?
 * @returns {Object} - Source object.
 */
const vectorSource = (serviceName, promoteId) => ({
  type: "vector",
  url: `${baseUrl}/${serviceName}`,
  promoteId,
});

/**
 * Create the base map style.
 * @returns {Object} - MapLibre GL style object.
 */
export function getBaseStyle() {
  return {
    sources: {
      "basemap-raster": rasterSource("basemap-raster"),
      "basemap-vector": {
        type: "vector",
        url: `${baseUrl}/basemap-vector`,
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

/**
 * Create the style for a raster layer.
 * @param {Object} options - Options objects.
 * @param {number} [options.order] - Minimum layer order value.
 * @returns {Object} - MapLibre GL style object.
 */
export function rasterStyle({ order = 6000 } = {}) {
  return function (entry, dataset) {
    const serviceName = dataset.getName(entry);
    if (!serviceName) return { sources: {}, layers: [] };
    return {
      sources: {
        [serviceName]: rasterSource(serviceName),
      },
      layers: [
        {
          id: serviceName,
          type: "raster",
          source: serviceName,
          order,
        },
      ],
    };
  };
}

/**
 * Create the style for a vector layer.
 * @param {Object} [options] - Options objects.
 * @param {[string, string]} [options.lineColors] - Minimum and maximum line colors (by zoom).
 * @param {[number, number]} [options.lineWidths] - Minimum and maximum line widths (by zoom).
 * @param {number} [options.order] - Minimum layer order value.
 * @returns {Object} - MapLibre GL style object.
 */
export function vectorStyle({
  lineColors = ["#DDDDDD", "#666666"],
  lineWidths = [0.5, 3],
  order = 6000,
} = {}) {
  return function ({ geographicUnit }, { legend }) {
    const ramp = colorRamp(legend);
    const layers = [];
    const isPoint = geographicUnit == "extraction_point";
    if (isPoint)
      layers.push(
        {
          id: "geography-fill",
          type: "circle",
          source: "geography-vector",
          "source-layer": geographicUnit,
          paint: {
            "circle-color": [
              "case",
              ["==", ["feature-state", "value"], null],
              "transparent",
              ["step", ["feature-state", "value"], ...ramp],
            ],
            "circle-radius": 5,
            "circle-stroke-color": linearZoom(...lineColors),
            "circle-stroke-width": linearZoom(...lineWidths),
          },
          order,
        },
        {
          id: "geography-selected",
          type: "circle",
          source: "geography-vector",
          "source-layer": geographicUnit,
          paint: {
            "circle-color": "transparent",
            "circle-radius": 5,
            "circle-stroke-color": [
              "coalesce",
              ["feature-state", "selected"],
              "transparent",
            ],
            "circle-stroke-width": 3,
          },
          order: order + 2,
        }
      );
    else
      layers.push(
        {
          id: "geography-fill",
          type: "fill",
          source: "geography-vector",
          "source-layer": geographicUnit,
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
          id: "geography-line",
          type: "line",
          source: "geography-vector",
          "source-layer": geographicUnit,
          paint: {
            "line-color": linearZoom(...lineColors),
            "line-width": linearZoom(...lineWidths),
          },
          order: order + 1,
        },
        {
          id: "geography-selected",
          type: "line",
          source: "geography-vector",
          "source-layer": geographicUnit,
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
        }
      );

    if (
      [
        "block_group",
        "clara",
        "ecoregion",
        "extraction_point",
        "hydro_compartment",
        "parish",
      ].includes(geographicUnit)
    )
      layers.push({
        id: "geography-label",
        type: "symbol",
        source: "geography-vector",
        "source-layer": `${geographicUnit}${isPoint ? "" : "_label"}`,
        minzoom: 9,
        layout: {
          "text-field": ["get", isPoint ? "id" : "label"],
          "text-offset": isPoint ? [0, -1.2] : [0, 0],
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
      });

    return {
      sources: {
        "geography-vector": vectorSource("geography-vector2", "id"),
      },
      layers,
    };
  };
}
