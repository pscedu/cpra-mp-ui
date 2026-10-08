export type Analysis = {
  // "single" and "compare" are local selection-mode view state; any other
  // value is the name of a registered analysis (e.g. "diff",
  // "concatenate") from the `/v1/analyses.json` catalog.
  operation: string;
  dimension: string | null;
  // Only meaningful for the "diff" analysis.
  order?: "asc" | "desc" | null;
};

export type DatasetRequest = {
  variable: string;
  grid: string;
  time_unit: string;
};

export type Coordinate = [number, number];

// A vector grid cell ID. Only ever produced by decoding a URL hash saved before
// selections became coordinate-based; selections made in the UI are always
// coordinates.
export type LegacyCellId = number;

export type Geography = Coordinate | LegacyCellId;

export type Tag = {
  name: string;
};

export type Option<T> = {
  label: string;
  value: T;
};
